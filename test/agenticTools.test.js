import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  toolCalculatePower,
  toolSearchConfigurations,
  toolVerifyCandidate,
  toolCompareConfigurations,
  toolRecordExperiment,
  executeAgentTool,
  parseGoalToConfiguration,
  AGENT_TOOL_DEFINITIONS,
} from '../src/utils/agentTools.js';
import { clearExperiments, getExperiments } from '../src/utils/experimentStorage.js';
import { OPTIMIZATION_OBJECTIVES } from '../src/utils/optimizationEngine.js';

describe('Agentic AI Tools - Definitions & Schemas', () => {
  test('declares all 5 required engineering tools with JSON schemas', () => {
    const toolNames = AGENT_TOOL_DEFINITIONS.map((t) => t.name);
    assert.deepEqual(toolNames, [
      'calculatePower',
      'searchConfigurations',
      'verifyCandidate',
      'compareConfigurations',
      'recordExperiment',
    ]);

    AGENT_TOOL_DEFINITIONS.forEach((tool) => {
      assert.ok(tool.description.length > 20);
      assert.equal(tool.parameters.type, 'object');
      assert.ok(Array.isArray(tool.parameters.required));
    });
  });
});

describe('Agentic AI Tools - Goal Parser', () => {
  const fallback = {
    alpha: 0.20,
    effectiveCapacitancePf: 20,
    supplyVoltageV: 1.2,
    clockFrequencyMhz: 100,
  };

  test('extracts power budget and min frequency from natural language', () => {
    const goal = 'Reduce dynamic power below 0.35 mW for a 20 pF block while keeping clock frequency at least 80 MHz.';
    const parsed = parseGoalToConfiguration(goal, fallback);

    assert.equal(parsed.constraints.maxPowerMw, 0.35);
    assert.equal(parsed.constraints.minFrequencyMhz, 80);
    assert.equal(parsed.objective, OPTIMIZATION_OBJECTIVES.MINIMIZE_POWER);
  });

  test('detects objective MEET_POWER_BUDGET when user asks to maximize frequency', () => {
    const goal = 'Meet power budget of 0.400 mW while keeping clock frequency as high as possible.';
    const parsed = parseGoalToConfiguration(goal, fallback);

    assert.equal(parsed.constraints.maxPowerMw, 0.400);
    assert.equal(parsed.objective, OPTIMIZATION_OBJECTIVES.MEET_POWER_BUDGET);
  });

  test('detects voltage-only tuning when requested', () => {
    const goal = 'Optimize supply voltage down to 0.8 V under 0.50 mW with voltage only.';
    const parsed = parseGoalToConfiguration(goal, fallback);

    assert.equal(parsed.tunableParameters.voltage, true);
    assert.equal(parsed.tunableParameters.frequency, false);
  });
});

describe('Agentic AI Tools - Execution & Input Validation', () => {
  beforeEach(() => {
    clearExperiments();
  });

  test('toolCalculatePower validates inputs and calculates exact power', () => {
    assert.throws(() => toolCalculatePower(null), /requires an arguments object/);
    assert.throws(
      () => toolCalculatePower({ alpha: 1.5, effectiveCapacitancePf: 20, supplyVoltageV: 1.2, clockFrequencyMhz: 100 }),
      /Invalid inputs/
    );

    const result = toolCalculatePower({
      alpha: 0.20,
      effectiveCapacitancePf: 20,
      supplyVoltageV: 1.2,
      clockFrequencyMhz: 100,
    });

    assert.equal(result.success, true);
    assert.equal(result.powerMilliwatts, 0.576);
    assert.equal(result.powerWatts, 0.000576);
  });

  test('toolSearchConfigurations executes bounded deterministic search', () => {
    const result = toolSearchConfigurations({
      baseline: { alpha: 0.20, effectiveCapacitancePf: 20, supplyVoltageV: 1.2, clockFrequencyMhz: 100 },
      constraints: {
        minVoltageV: 0.8,
        maxVoltageV: 1.2,
        voltageStepV: 0.1,
        minFrequencyMhz: 80,
        maxFrequencySearchMhz: 100,
        frequencyStepMhz: 10,
        maxPowerMw: 0.400,
      },
    });

    assert.equal(result.success, true);
    assert.equal(result.hasFeasibleSolution, true);
    assert.equal(result.bestCandidate.voltageV, 0.8);
    assert.equal(result.bestCandidate.frequencyMhz, 80);
    assert.ok(Math.abs(result.bestCandidate.powerMilliwatts - 0.2048) < 1e-4);
  });

  test('toolVerifyCandidate independently recalculates and checks physical constraints', () => {
    const baseline = { alpha: 0.20, effectiveCapacitancePf: 20 };
    const constraints = { minVoltageV: 0.8, maxVoltageV: 1.2, minFrequencyMhz: 80, maxPowerMw: 0.300 };

    // Valid candidate: 0.8V @ 80MHz => 0.2048 mW (satisfies all)
    const valid = toolVerifyCandidate({
      candidate: { voltageV: 0.8, frequencyMhz: 80 },
      baseline,
      constraints,
    });
    assert.equal(valid.isVerified, true);
    assert.equal(valid.checks.minFrequency.passed, true);
    assert.equal(valid.checks.voltageRange.passed, true);
    assert.equal(valid.checks.powerBudget.passed, true);

    // Violation 1: Frequency too low (70 MHz < 80 MHz)
    const freqFail = toolVerifyCandidate({
      candidate: { voltageV: 0.8, frequencyMhz: 70 },
      baseline,
      constraints,
    });
    assert.equal(freqFail.isVerified, false);
    assert.equal(freqFail.checks.minFrequency.passed, false);
    assert.ok(freqFail.violations.some((v) => v.includes('violates required minimum 80 MHz')));

    // Violation 2: Voltage out of range (1.3V > 1.2V)
    const voltFail = toolVerifyCandidate({
      candidate: { voltageV: 1.3, frequencyMhz: 80 },
      baseline,
      constraints,
    });
    assert.equal(voltFail.isVerified, false);
    assert.equal(voltFail.checks.voltageRange.passed, false);

    // Violation 3: Power exceeds budget (1.2V @ 100MHz => 0.576 mW > 0.300 mW)
    const powerFail = toolVerifyCandidate({
      candidate: { voltageV: 1.2, frequencyMhz: 100 },
      baseline,
      constraints,
    });
    assert.equal(powerFail.isVerified, false);
    assert.equal(powerFail.checks.powerBudget.passed, false);
  });

  test('toolCompareConfigurations computes honest differences vs baseline', () => {
    const comparison = toolCompareConfigurations({
      baseline: { powerMilliwatts: 0.576, supplyVoltageV: 1.2, clockFrequencyMhz: 100 },
      candidate: { powerMilliwatts: 0.2048, voltageV: 0.8, frequencyMhz: 80 },
    });

    assert.equal(comparison.success, true);
    assert.equal(comparison.isPowerReduced, true);
    assert.equal(comparison.deltaPowerMw, 0.3712);
    assert.ok(Math.abs(comparison.percentageReduction - 64.44) < 0.1);
    assert.equal(comparison.deltaVoltageV, -0.4);
    assert.equal(comparison.deltaFrequencyMhz, -20);
  });

  test('toolRecordExperiment rejects unverified candidate and saves verified one', () => {
    const unverifiedAttempt = () =>
      toolRecordExperiment({
        experimentName: 'Unverified Run',
        baseline: {},
        candidate: {},
        verification: { isVerified: false },
      });
    assert.throws(unverifiedAttempt, /Cannot record unverified experiment/);

    const verifiedRecord = toolRecordExperiment({
      experimentName: 'Verified DVFS Run 1',
      goal: 'Reduce dynamic power below 0.35 mW',
      baseline: { powerMilliwatts: 0.576 },
      candidate: { voltageV: 0.8, frequencyMhz: 80, powerMilliwatts: 0.2048 },
      comparison: { deltaPowerMw: 0.3712, percentageReduction: 64.44 },
      verification: { isVerified: true },
      tags: ['DVFS', 'Verified'],
    });

    assert.equal(verifiedRecord.success, true);
    assert.ok(verifiedRecord.experimentId.startsWith('EXP-'));

    const all = getExperiments();
    assert.equal(all.length, 1);
    assert.equal(all[0].id, verifiedRecord.experimentId);
  });

  test('executeAgentTool dispatcher safely handles invalid tool name', () => {
    const invalid = executeAgentTool('nonExistentTool', {});
    assert.equal(invalid.success, false);
    assert.ok(invalid.error.includes('Unrecognized tool'));
  });

  test('REGRESSION: toolVerifyCandidate cleanly handles numeric strings from HTML form inputs', () => {
    const stringCandidate = {
      candidate: { voltageV: '0.8', frequencyMhz: '80' },
      baseline: { alpha: '0.20', effectiveCapacitancePf: '20' },
      constraints: { minVoltageV: '0.8', maxVoltageV: '1.2', minFrequencyMhz: '80', maxPowerMw: '0.350' },
    };
    const res = toolVerifyCandidate(stringCandidate);
    assert.equal(res.success, true);
    assert.equal(res.isVerified, true);
    assert.ok(Array.isArray(res.violations));
    assert.doesNotThrow(() => res.violations.join('; '));
  });

  test('REGRESSION: toolVerifyCandidate returns defined violations array on malformed input (never undefined for .join)', () => {
    const malformed1 = toolVerifyCandidate(null);
    assert.equal(malformed1.isVerified, false);
    assert.ok(Array.isArray(malformed1.violations));
    assert.doesNotThrow(() => malformed1.violations.join('; '));

    const malformed2 = toolVerifyCandidate({});
    assert.equal(malformed2.isVerified, false);
    assert.ok(Array.isArray(malformed2.violations));
    assert.doesNotThrow(() => malformed2.violations.join('; '));

    const malformed3 = toolVerifyCandidate({ candidate: { voltageV: 'not-a-number' } });
    assert.equal(malformed3.isVerified, false);
    assert.ok(Array.isArray(malformed3.violations));
    assert.doesNotThrow(() => malformed3.violations.join('; '));
  });

  test('REGRESSION: toolCompareConfigurations cleanly parses numeric strings from HTML inputs', () => {
    const res = toolCompareConfigurations({
      baseline: { powerMilliwatts: '0.576', supplyVoltageV: '1.2', clockFrequencyMhz: '100' },
      candidate: { powerMilliwatts: '0.2048', voltageV: '0.8', frequencyMhz: '80' },
    });
    assert.equal(res.success, true);
    assert.equal(res.isPowerReduced, true);
    assert.equal(res.deltaPowerMw, 0.3712);
  });
});
