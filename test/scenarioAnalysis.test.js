import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  calculateTimingSlack,
  evaluateParetoFrontier,
  buildEvaluatedScenarios,
} from '../src/utils/scenarioAnalysis.js';

describe('Scenario Analysis & Timing Slack Model', () => {
  test('calculates timing closure for nominal sign-off corner (1.2V @ 100MHz)', () => {
    const slack = calculateTimingSlack(1.20, 100);
    assert.equal(slack.periodNs, 10.0);
    assert.equal(slack.delayNs, 10.0);
    assert.equal(slack.wnsNs, 0.0);
    assert.equal(slack.isMet, true);
  });

  test('calculates positive timing slack when operating frequency is reduced (e.g. 1.2V @ 80MHz)', () => {
    const slack = calculateTimingSlack(1.20, 80);
    assert.equal(slack.periodNs, 12.5);
    assert.equal(slack.delayNs, 10.0);
    assert.equal(slack.wnsNs, 2.5);
    assert.equal(slack.isMet, true);
  });

  test('detects setup timing violation when voltage is lowered without lowering frequency enough', () => {
    // 0.75V at 100MHz (period 10ns, but propagation delay explodes due to reduced overdrive)
    const slack = calculateTimingSlack(0.75, 100);
    assert.equal(slack.periodNs, 10.0);
    assert.ok(slack.delayNs > 10.0, `Expected delay > 10ns, got ${slack.delayNs}`);
    assert.ok(slack.wnsNs < 0, `Expected negative slack, got ${slack.wnsNs}`);
    assert.equal(slack.isMet, false);
  });

  test('detects subthreshold stall when voltage <= threshold voltage (Vt = 0.35V)', () => {
    const slack = calculateTimingSlack(0.30, 50);
    assert.equal(slack.delayNs, 999.0);
    assert.equal(slack.isMet, false);
    assert.ok(slack.wnsNs < 0);
  });

  test('safely handles missing, non-numeric, or negative inputs without throwing', () => {
    const invalidInputs = [
      [null, 100],
      [1.2, undefined],
      ['invalid', 100],
      [1.2, 'not-a-number'],
      [-1.2, 100],
      [1.2, -50],
      [0, 100],
      [1.2, 0],
    ];

    for (const [v, f] of invalidInputs) {
      const res = calculateTimingSlack(v, f);
      assert.deepEqual(res, { delayNs: 0, periodNs: 0, wnsNs: 0, isMet: false });
    }
  });

  test('accepts valid numeric string inputs from HTML form controls', () => {
    const slack = calculateTimingSlack('1.20', '100');
    assert.equal(slack.isMet, true);
    assert.equal(slack.periodNs, 10.0);
  });
});

describe('Pareto Frontier Dominance Evaluation', () => {
  test('returns empty array when input list is empty or non-array', () => {
    assert.deepEqual(evaluateParetoFrontier([]), []);
    assert.deepEqual(evaluateParetoFrontier(null), []);
    assert.deepEqual(evaluateParetoFrontier(undefined), []);
  });

  test('flags timing-violated candidate as TIMING_VIOLATED and not Pareto optimal', () => {
    const scenarios = [
      {
        id: 'CAND-1',
        powerMw: 0.15,
        frequencyMhz: 100,
        timing: { isMet: false, wnsNs: -2.5 },
      },
    ];

    const evaluated = evaluateParetoFrontier(scenarios);
    assert.equal(evaluated[0].paretoStatus, 'TIMING_VIOLATED');
    assert.equal(evaluated[0].isParetoOptimal, false);
  });

  test('correctly identifies dominated vs Pareto-optimal candidates', () => {
    // Candidate A: 0.20 mW @ 80 MHz (High freq, low power)
    // Candidate B: 0.30 mW @ 70 MHz (Higher power AND lower freq -> DOMINATED by A)
    // Candidate C: 0.15 mW @ 60 MHz (Lower power, lower freq -> PARETO OPTIMAL trade-off)
    const scenarios = [
      { id: 'A', powerMw: 0.20, frequencyMhz: 80, timing: { isMet: true, wnsNs: 0.5 } },
      { id: 'B', powerMw: 0.30, frequencyMhz: 70, timing: { isMet: true, wnsNs: 1.0 } },
      { id: 'C', powerMw: 0.15, frequencyMhz: 60, timing: { isMet: true, wnsNs: 2.0 } },
    ];

    const evaluated = evaluateParetoFrontier(scenarios);

    const a = evaluated.find((s) => s.id === 'A');
    const b = evaluated.find((s) => s.id === 'B');
    const c = evaluated.find((s) => s.id === 'C');

    assert.equal(a.isParetoOptimal, true);
    assert.equal(a.paretoStatus, 'PARETO_OPTIMAL');

    assert.equal(b.isParetoOptimal, false);
    assert.equal(b.paretoStatus, 'DOMINATED');

    assert.equal(c.isParetoOptimal, true);
    assert.equal(c.paretoStatus, 'PARETO_OPTIMAL');
  });

  test('single timing-compliant candidate is Pareto optimal by default', () => {
    const scenarios = [
      { id: 'ONLY', powerMw: 0.576, frequencyMhz: 100, timing: { isMet: true, wnsNs: 0 } },
    ];
    const evaluated = evaluateParetoFrontier(scenarios);
    assert.equal(evaluated[0].isParetoOptimal, true);
    assert.equal(evaluated[0].paretoStatus, 'PARETO_OPTIMAL');
  });
});

describe('Scenario Comparison Builder - Integrated Calculations', () => {
  test('evaluates candidates with exact physical dynamic power and honest deltas', () => {
    const baseline = {
      alpha: 0.20,
      effectiveCapacitancePf: 20,
      supplyVoltageV: 1.20,
      clockFrequencyMhz: 100,
    };

    const rawScenarios = [
      { id: 'SCEN-BASE', voltageV: 1.20, frequencyMhz: 100, isBaseline: true },
      { id: 'SCEN-DVFS-LOWV', voltageV: 0.80, frequencyMhz: 80, isBaseline: false },
      { id: 'SCEN-DVFS-SAFE', voltageV: 1.15, frequencyMhz: 80, isBaseline: false },
    ];

    const results = buildEvaluatedScenarios(baseline, rawScenarios);

    assert.equal(results.length, 3);

    // Baseline: 0.576 mW
    const base = results[0];
    assert.equal(base.powerMw, 0.576);
    assert.equal(base.timing.isMet, true);

    // DVFS Low-V (0.80V @ 80MHz): Significant power savings, but timing setup violation under alpha-power model
    const dvfsLow = results[1];
    assert.ok(Math.abs(dvfsLow.powerMw - 0.2048) < 0.001);
    assert.equal(Number(dvfsLow.comparison.percentageReduction), 64.44);
    assert.equal(dvfsLow.timing.isMet, false);
    assert.equal(dvfsLow.paretoStatus, 'TIMING_VIOLATED');
    assert.equal(dvfsLow.isParetoOptimal, false);

    // DVFS Safe (1.10V @ 80MHz): Timing closure is met, power is reduced, verified Pareto optimal
    const dvfsSafe = results[2];
    assert.ok(dvfsSafe.powerMw < base.powerMw);
    assert.equal(dvfsSafe.timing.isMet, true);
    assert.equal(dvfsSafe.paretoStatus, 'PARETO_OPTIMAL');
    assert.equal(dvfsSafe.isParetoOptimal, true);
  });

  test('safely returns empty array for null/missing inputs in builder', () => {
    assert.deepEqual(buildEvaluatedScenarios(null, []), []);
    assert.deepEqual(buildEvaluatedScenarios({ alpha: 0.2 }, null), []);
  });

  test('REGRESSION: ScenarioComparisonView JSX contains no unescaped LaTeX braces or undefined dd identifiers', () => {
    const filePath = new URL('../src/components/views/ScenarioComparisonView.jsx', import.meta.url);
    const content = fs.readFileSync(filePath, 'utf8');

    // Asserts that no unescaped LaTeX math patterns like $V_{dd}$ or \text{ V} are present in JSX
    assert.ok(!content.includes('$V_{dd}$'), 'Found unescaped $V_{dd}$ in ScenarioComparisonView.jsx');
    assert.ok(!content.includes('\\text{'), 'Found unescaped \\text{ in ScenarioComparisonView.jsx');
    assert.ok(!content.includes('_{dd}'), 'Found unescaped _{dd} in ScenarioComparisonView.jsx');
    assert.ok(!content.includes('{dd}'), 'Found raw {dd} identifier in ScenarioComparisonView.jsx');
  });

  test('handles empty experiment registry gracefully, evaluating default sign-off corners', () => {
    const baseline = {
      alpha: 0.20,
      effectiveCapacitancePf: 20,
      supplyVoltageV: 1.20,
      clockFrequencyMhz: 100,
    };

    // Standard 6 sign-off corners when registry is empty
    const predefinedScenarios = [
      { id: 'SCEN-BASELINE', voltageV: 1.20, frequencyMhz: 100, isBaseline: true },
      { id: 'SCEN-DVFS-BALANCED', voltageV: 0.80, frequencyMhz: 80, isBaseline: false },
      { id: 'SCEN-STRICT-BUDGET', voltageV: 0.80, frequencyMhz: 70, isBaseline: false },
      { id: 'SCEN-ISO-PERFORMANCE', voltageV: 0.90, frequencyMhz: 100, isBaseline: false },
      { id: 'SCEN-AGGRESSIVE-LOWPOWER', voltageV: 0.70, frequencyMhz: 50, isBaseline: false },
      { id: 'SCEN-TIMING-FAIL-DEMO', voltageV: 0.75, frequencyMhz: 100, isBaseline: false },
    ];

    const emptyRegistry = [];
    const combined = [...predefinedScenarios, ...emptyRegistry];
    const evaluated = buildEvaluatedScenarios(baseline, combined);

    assert.equal(evaluated.length, 6);
    for (const scen of evaluated) {
      assert.ok(typeof scen.powerMw === 'number' && !isNaN(scen.powerMw), 'powerMw must be a valid number');
      assert.ok(typeof scen.powerMilliwatts === 'number' && !isNaN(scen.powerMilliwatts), 'powerMilliwatts must be a valid number');
      assert.ok(typeof scen.voltageV === 'number');
      assert.ok(typeof scen.frequencyMhz === 'number');
      assert.ok(scen.comparison && typeof scen.comparison.deltaPowerMw === 'number');
      assert.ok(scen.timing && typeof scen.timing.wnsNs === 'number');
      assert.ok(['PARETO_OPTIMAL', 'DOMINATED', 'TIMING_VIOLATED'].includes(scen.paretoStatus));
    }
  });
});
