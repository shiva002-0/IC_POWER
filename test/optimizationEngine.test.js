import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  generateCandidateConfigurations,
  validateOptimizationConfig,
  runOptimizationEngine,
  roundToPrecision,
  OPTIMIZATION_OBJECTIVES,
} from '../src/utils/optimizationEngine.js';

describe('Deterministic Optimization Engine - Candidate Generation', () => {
  const baseConfig = {
    baseline: {
      alpha: 0.20,
      effectiveCapacitancePf: 20,
      supplyVoltageV: 1.2,
      clockFrequencyMhz: 100,
    },
    constraints: {
      minVoltageV: 0.8,
      maxVoltageV: 1.2,
      voltageStepV: 0.2, // 0.8, 1.0, 1.2 (3 voltages)
      minFrequencyMhz: 80,
      maxFrequencySearchMhz: 100,
      frequencyStepMhz: 10, // 80, 90, 100 (3 frequencies)
      maxPowerMw: 0.6,
    },
    tunableParameters: {
      voltage: true,
      frequency: true,
    },
    objective: OPTIMIZATION_OBJECTIVES.MINIMIZE_POWER,
  };

  test('generateCandidateConfigurations creates exact 3x3 = 9 candidate grid', () => {
    const candidates = generateCandidateConfigurations(baseConfig);
    assert.equal(candidates.length, 9);

    // Verify voltage levels
    const voltages = [...new Set(candidates.map((c) => c.voltageV))].sort((a, b) => a - b);
    assert.deepEqual(voltages, [0.8, 1.0, 1.2]);

    // Verify frequency levels
    const frequencies = [...new Set(candidates.map((c) => c.frequencyMhz))].sort((a, b) => a - b);
    assert.deepEqual(frequencies, [80, 90, 100]);
  });

  test('generates only 1 candidate when both voltage and frequency are fixed', () => {
    const fixedConfig = {
      ...baseConfig,
      tunableParameters: {
        voltage: false,
        frequency: false,
      },
    };
    const candidates = generateCandidateConfigurations(fixedConfig);
    assert.equal(candidates.length, 1);
    assert.equal(candidates[0].voltageV, 1.2);
    assert.equal(candidates[0].frequencyMhz, 100);
  });

  test('generates voltage-only search when frequency tuning is disabled', () => {
    const voltOnlyConfig = {
      ...baseConfig,
      tunableParameters: {
        voltage: true,
        frequency: false,
      },
    };
    const candidates = generateCandidateConfigurations(voltOnlyConfig);
    assert.equal(candidates.length, 3);
    candidates.forEach((c) => {
      assert.equal(c.frequencyMhz, 100); // Fixed at baseline
    });
  });

  test('roundToPrecision avoids floating point imprecision', () => {
    assert.equal(roundToPrecision(0.7000000000000001, 2), 0.7);
    assert.equal(roundToPrecision(0.1 + 0.2, 4), 0.3);
  });
});

describe('Deterministic Optimization Engine - Constraint Enforcement & Ranking', () => {
  const standardConfig = {
    baseline: {
      alpha: 0.20,
      effectiveCapacitancePf: 20,
      supplyVoltageV: 1.2,
      clockFrequencyMhz: 100,
    },
    constraints: {
      minVoltageV: 0.8,
      maxVoltageV: 1.2,
      voltageStepV: 0.1, // 0.8, 0.9, 1.0, 1.1, 1.2 (5 points)
      minFrequencyMhz: 80,
      maxFrequencySearchMhz: 100,
      frequencyStepMhz: 10, // 80, 90, 100 (3 points) => 15 total candidates
      maxPowerMw: 0.400, // Budget rejects baseline (0.576 mW)
    },
    tunableParameters: {
      voltage: true,
      frequency: true,
    },
    objective: OPTIMIZATION_OBJECTIVES.MINIMIZE_POWER,
  };

  test('successfully finds optimal low-power candidate meeting all constraints', () => {
    const report = runOptimizationEngine(standardConfig);

    assert.equal(report.success, true);
    assert.equal(report.hasFeasibleSolution, true);
    assert.equal(report.totalEvaluated, 15);

    // Baseline: P = 0.20 * 20pF * (1.2V)^2 * 100MHz = 0.576 mW
    assert.ok(Math.abs(report.baseline.powerMilliwatts - 0.576) < 1e-6);

    // Lowest power candidate must have lowest voltage (0.8V) and lowest frequency (80MHz)
    // P = 0.20 * (20 * 1e-12) * (0.8)^2 * (80 * 1e6) = 0.20 * 20 * 0.64 * 80 * 1e-6 = 0.2048 mW
    const best = report.bestCandidate;
    assert.equal(best.voltageV, 0.8);
    assert.equal(best.frequencyMhz, 80);
    assert.ok(Math.abs(best.powerMilliwatts - 0.2048) < 1e-6);

    // Power reduction checks
    assert.equal(best.isPowerReduced, true);
    const expectedDelta = 0.576 - 0.2048; // 0.3712 mW
    assert.ok(Math.abs(best.deltaPowerMw - expectedDelta) < 1e-4);
    const expectedPct = (expectedDelta / 0.576) * 100; // ~64.44%
    assert.ok(Math.abs(best.percentageReduction - expectedPct) < 0.1);

    // Check individual constraint checks
    assert.equal(best.checks.minFrequency.passed, true);
    assert.equal(best.checks.voltageRange.passed, true);
    assert.equal(best.checks.powerBudget.passed, true);
  });

  test('objective MEET_POWER_BUDGET maximizes clock frequency while satisfying budget', () => {
    const budgetConfig = {
      ...standardConfig,
      objective: OPTIMIZATION_OBJECTIVES.MEET_POWER_BUDGET,
      constraints: {
        ...standardConfig.constraints,
        maxPowerMw: 0.350, // Budget allows 100MHz at 0.9V (P = 0.20 * 20 * 0.81 * 100 * 1e-6 = 0.324 mW)
      },
    };

    const report = runOptimizationEngine(budgetConfig);
    assert.equal(report.success, true);
    assert.equal(report.hasFeasibleSolution, true);

    const best = report.bestCandidate;
    // Should choose the highest frequency (100MHz) that meets the 0.350 mW budget!
    assert.equal(best.frequencyMhz, 100);
    assert.ok(best.powerMilliwatts <= 0.350);
  });

  test('determinism: running engine repeatedly produces strictly identical results', () => {
    const run1 = runOptimizationEngine(standardConfig);
    const run2 = runOptimizationEngine(standardConfig);

    assert.equal(run1.totalEvaluated, run2.totalEvaluated);
    assert.equal(run1.feasibleCount, run2.feasibleCount);
    assert.equal(run1.bestCandidate.voltageV, run2.bestCandidate.voltageV);
    assert.equal(run1.bestCandidate.frequencyMhz, run2.bestCandidate.frequencyMhz);
    assert.equal(run1.bestCandidate.powerMilliwatts, run2.bestCandidate.powerMilliwatts);
    assert.equal(run1.bestCandidate.deltaPowerMw, run2.bestCandidate.deltaPowerMw);
  });
});

describe('Deterministic Optimization Engine - Unfeasible Scenarios & Honest Reporting', () => {
  test('honestly reports no feasible solution when power budget is impossible to meet', () => {
    const unfeasibleConfig = {
      baseline: {
        alpha: 0.20,
        effectiveCapacitancePf: 20,
        supplyVoltageV: 1.2,
        clockFrequencyMhz: 100,
      },
      constraints: {
        minVoltageV: 0.8,
        maxVoltageV: 1.2,
        voltageStepV: 0.1,
        minFrequencyMhz: 90,
        maxFrequencySearchMhz: 100,
        frequencyStepMhz: 10,
        maxPowerMw: 0.100, // Impossibly tight budget: lowest possible power is 0.8V @ 90MHz = 0.2304 mW
      },
      tunableParameters: {
        voltage: true,
        frequency: true,
      },
      objective: OPTIMIZATION_OBJECTIVES.MINIMIZE_POWER,
    };

    const report = runOptimizationEngine(unfeasibleConfig);

    assert.equal(report.success, false);
    assert.equal(report.hasFeasibleSolution, false);
    assert.equal(report.bestCandidate, null);
    assert.equal(report.feasibleCount, 0);
    assert.ok(report.rejectedCount > 0);
    assert.ok(report.message.includes('No feasible candidate'));
  });

  test('never claims power reduction when optimal feasible candidate has higher power than baseline', () => {
    const higherPowerConfig = {
      baseline: {
        alpha: 0.20,
        effectiveCapacitancePf: 20,
        supplyVoltageV: 0.8,
        clockFrequencyMhz: 50, // Baseline is very low power: P = 0.20 * 20 * 0.64 * 50 * 1e-6 = 0.128 mW
      },
      constraints: {
        minVoltageV: 0.8,
        maxVoltageV: 1.2,
        voltageStepV: 0.1,
        minFrequencyMhz: 100, // Forces higher frequency than baseline
        maxFrequencySearchMhz: 100,
        frequencyStepMhz: 10,
        maxPowerMw: 1.0,
      },
      tunableParameters: {
        voltage: true,
        frequency: true,
      },
      objective: OPTIMIZATION_OBJECTIVES.MINIMIZE_POWER,
    };

    const report = runOptimizationEngine(higherPowerConfig);
    assert.equal(report.success, true);
    assert.equal(report.hasFeasibleSolution, true);

    const best = report.bestCandidate;
    // Power at 0.8V, 100MHz = 0.256 mW > baseline 0.128 mW
    assert.equal(best.isPowerReduced, false);
    assert.equal(best.percentageReduction, 0);
    assert.ok(report.summaryMessage.includes('power increased'));
  });
});

describe('Deterministic Optimization Engine - Input Validation', () => {
  test('rejects config when minVoltage > maxVoltage', () => {
    const invalidConfig = {
      baseline: { alpha: 0.2, effectiveCapacitancePf: 20, supplyVoltageV: 1.2, clockFrequencyMhz: 100 },
      constraints: {
        minVoltageV: 1.3,
        maxVoltageV: 1.0, // Invalid!
        voltageStepV: 0.1,
        minFrequencyMhz: 80,
        frequencyStepMhz: 10,
      },
      tunableParameters: { voltage: true, frequency: true },
    };

    const validation = validateOptimizationConfig(invalidConfig);
    assert.equal(validation.isValid, false);
    assert.ok(validation.errors.voltageRange.includes('cannot exceed'));
  });

  test('rejects config when no tunable parameters are enabled', () => {
    const noParamsConfig = {
      baseline: { alpha: 0.2, effectiveCapacitancePf: 20, supplyVoltageV: 1.2, clockFrequencyMhz: 100 },
      constraints: {
        minVoltageV: 0.8,
        maxVoltageV: 1.2,
        voltageStepV: 0.1,
        minFrequencyMhz: 80,
        frequencyStepMhz: 10,
      },
      tunableParameters: { voltage: false, frequency: false }, // Both disabled!
    };

    const validation = validateOptimizationConfig(noParamsConfig);
    assert.equal(validation.isValid, false);
    assert.ok(validation.errors.tunableParameters.includes('must be enabled'));
  });

  test('rejects negative step increments', () => {
    const negativeStepConfig = {
      baseline: { alpha: 0.2, effectiveCapacitancePf: 20, supplyVoltageV: 1.2, clockFrequencyMhz: 100 },
      constraints: {
        minVoltageV: 0.8,
        maxVoltageV: 1.2,
        voltageStepV: -0.1, // Negative!
        minFrequencyMhz: 80,
        frequencyStepMhz: -10, // Negative!
      },
      tunableParameters: { voltage: true, frequency: true },
    };

    const validation = validateOptimizationConfig(negativeStepConfig);
    assert.equal(validation.isValid, false);
    assert.ok(validation.errors.voltageStepV !== undefined);
    assert.ok(validation.errors.frequencyStepMhz !== undefined);
  });

  test('rejects zero step increments', () => {
    const zeroStepConfig = {
      baseline: { alpha: 0.2, effectiveCapacitancePf: 20, supplyVoltageV: 1.2, clockFrequencyMhz: 100 },
      constraints: {
        minVoltageV: 0.8,
        maxVoltageV: 1.2,
        voltageStepV: 0, // Zero!
        minFrequencyMhz: 80,
        frequencyStepMhz: 0, // Zero!
      },
      tunableParameters: { voltage: true, frequency: true },
    };

    const validation = validateOptimizationConfig(zeroStepConfig);
    assert.equal(validation.isValid, false);
    assert.ok(validation.errors.voltageStepV.includes('greater than 0'));
    assert.ok(validation.errors.frequencyStepMhz.includes('greater than 0'));
  });

  test('rejects config when minFrequencyMhz > maxFrequencySearchMhz', () => {
    const invalidFreqConfig = {
      baseline: { alpha: 0.2, effectiveCapacitancePf: 20, supplyVoltageV: 1.2, clockFrequencyMhz: 100 },
      constraints: {
        minVoltageV: 0.8,
        maxVoltageV: 1.2,
        voltageStepV: 0.1,
        minFrequencyMhz: 120, // Exceeds max search!
        maxFrequencySearchMhz: 100,
        frequencyStepMhz: 10,
      },
      tunableParameters: { voltage: true, frequency: true },
    };

    const validation = validateOptimizationConfig(invalidFreqConfig);
    assert.equal(validation.isValid, false);
    assert.ok(validation.errors.frequencyRange.includes('cannot exceed'));
  });

  test('rejects null or undefined config object', () => {
    const val1 = validateOptimizationConfig(null);
    assert.equal(val1.isValid, false);
    assert.ok(val1.errors.general !== undefined);

    const val2 = validateOptimizationConfig(undefined);
    assert.equal(val2.isValid, false);
    assert.ok(val2.errors.general !== undefined);
  });

  test('rejects config with missing baseline or constraints', () => {
    const missingBaseline = {
      constraints: { minVoltageV: 0.8, maxVoltageV: 1.2, voltageStepV: 0.1, minFrequencyMhz: 80, frequencyStepMhz: 10 },
      tunableParameters: { voltage: true, frequency: true },
    };
    const val1 = validateOptimizationConfig(missingBaseline);
    assert.equal(val1.isValid, false);
    assert.ok(val1.errors.baseline !== undefined);

    const missingConstraints = {
      baseline: { alpha: 0.2, effectiveCapacitancePf: 20, supplyVoltageV: 1.2, clockFrequencyMhz: 100 },
      tunableParameters: { voltage: true, frequency: true },
    };
    const val2 = validateOptimizationConfig(missingConstraints);
    assert.equal(val2.isValid, false);
    assert.ok(val2.errors.constraints !== undefined);
  });

  test('rejects config when baseline parameters fail power validation', () => {
    const invalidBaseConfig = {
      baseline: { alpha: 1.5, effectiveCapacitancePf: -5, supplyVoltageV: 0, clockFrequencyMhz: 100 },
      constraints: { minVoltageV: 0.8, maxVoltageV: 1.2, voltageStepV: 0.1, minFrequencyMhz: 80, frequencyStepMhz: 10 },
      tunableParameters: { voltage: true, frequency: true },
    };
    const validation = validateOptimizationConfig(invalidBaseConfig);
    assert.equal(validation.isValid, false);
    assert.ok(validation.errors.baseline_alpha !== undefined);
    assert.ok(validation.errors.baseline_effectiveCapacitancePf !== undefined);
    assert.ok(validation.errors.baseline_supplyVoltageV !== undefined);
  });

  test('runOptimizationEngine throws Error with validationErrors attached for invalid config', () => {
    assert.throws(
      () => runOptimizationEngine({}),
      (err) => {
        assert.ok(err instanceof Error);
        assert.ok(err.validationErrors !== undefined);
        return true;
      }
    );
  });
});

describe('Deterministic Optimization Engine - Advanced Search & Physical Boundary Limits', () => {
  test('generates frequency-only search when voltage tuning is disabled', () => {
    const freqOnlyConfig = {
      baseline: {
        alpha: 0.20,
        effectiveCapacitancePf: 20,
        supplyVoltageV: 1.2,
        clockFrequencyMhz: 100,
      },
      constraints: {
        minVoltageV: 0.8,
        maxVoltageV: 1.2,
        voltageStepV: 0.1,
        minFrequencyMhz: 50,
        maxFrequencySearchMhz: 100,
        frequencyStepMhz: 25, // 50, 75, 100 (3 frequencies)
        maxPowerMw: 0.6,
      },
      tunableParameters: {
        voltage: false, // Fixed at 1.2V
        frequency: true,
      },
      objective: OPTIMIZATION_OBJECTIVES.MINIMIZE_POWER,
    };

    const candidates = generateCandidateConfigurations(freqOnlyConfig);
    assert.equal(candidates.length, 3);
    candidates.forEach((c) => {
      assert.equal(c.voltageV, 1.2); // Kept fixed at baseline
    });
    const freqs = candidates.map((c) => c.frequencyMhz);
    assert.deepEqual(freqs, [50, 75, 100]);

    const report = runOptimizationEngine(freqOnlyConfig);
    assert.equal(report.success, true);
    assert.equal(report.bestCandidate.voltageV, 1.2);
    assert.equal(report.bestCandidate.frequencyMhz, 50);
  });

  test('supports unconstrained power optimization when maxPowerMw is omitted', () => {
    const unconstrainedConfig = {
      baseline: {
        alpha: 0.20,
        effectiveCapacitancePf: 20,
        supplyVoltageV: 1.2,
        clockFrequencyMhz: 100,
      },
      constraints: {
        minVoltageV: 0.8,
        maxVoltageV: 1.2,
        voltageStepV: 0.2, // 0.8, 1.0, 1.2
        minFrequencyMhz: 80,
        maxFrequencySearchMhz: 100,
        frequencyStepMhz: 20, // 80, 100
        // maxPowerMw intentionally omitted
      },
      tunableParameters: {
        voltage: true,
        frequency: true,
      },
      objective: OPTIMIZATION_OBJECTIVES.MINIMIZE_POWER,
    };

    const report = runOptimizationEngine(unconstrainedConfig);
    assert.equal(report.success, true);
    assert.equal(report.totalEvaluated, 6);
    assert.equal(report.feasibleCount, 6); // All 6 pass since power budget is unconstrained
    assert.equal(report.rejectedCount, 0);
    assert.equal(report.bestCandidate.checks.powerBudget.passed, true);
    assert.equal(report.bestCandidate.checks.powerBudget.limit, null);
  });

  test('flags voltage limit violation when voltage is fixed outside permitted boundaries', () => {
    const fixedVoltageViolationConfig = {
      baseline: {
        alpha: 0.20,
        effectiveCapacitancePf: 20,
        supplyVoltageV: 1.3, // Baseline voltage 1.3V is above max allowed 1.2V!
        clockFrequencyMhz: 100,
      },
      constraints: {
        minVoltageV: 0.8,
        maxVoltageV: 1.2,
        voltageStepV: 0.1,
        minFrequencyMhz: 80,
        maxFrequencySearchMhz: 100,
        frequencyStepMhz: 20,
        maxPowerMw: 1.0,
      },
      tunableParameters: {
        voltage: false, // Fixed at 1.3V (out of bounds)
        frequency: true,
      },
      objective: OPTIMIZATION_OBJECTIVES.MINIMIZE_POWER,
    };

    const report = runOptimizationEngine(fixedVoltageViolationConfig);
    assert.equal(report.success, false);
    assert.equal(report.hasFeasibleSolution, false);
    assert.equal(report.feasibleCount, 0);
    assert.ok(report.rejectedCount > 0);
    // All candidates must fail the voltage constraint check
    report.evaluatedCandidates.forEach((c) => {
      assert.equal(c.checks.voltageRange.passed, false);
      assert.ok(c.violations.some((v) => v.includes('Voltage 1.3 V is outside permitted range')));
    });
  });

  test('flags frequency limit violation when frequency is fixed below minFrequencyMhz', () => {
    const fixedFreqViolationConfig = {
      baseline: {
        alpha: 0.20,
        effectiveCapacitancePf: 20,
        supplyVoltageV: 1.0,
        clockFrequencyMhz: 60, // Baseline 60 MHz is below min required 80 MHz!
      },
      constraints: {
        minVoltageV: 0.8,
        maxVoltageV: 1.2,
        voltageStepV: 0.2,
        minFrequencyMhz: 80, // Requires at least 80 MHz
        frequencyStepMhz: 10,
        maxPowerMw: 1.0,
      },
      tunableParameters: {
        voltage: true,
        frequency: false, // Fixed at 60 MHz
      },
      objective: OPTIMIZATION_OBJECTIVES.MINIMIZE_POWER,
    };

    const report = runOptimizationEngine(fixedFreqViolationConfig);
    assert.equal(report.success, false);
    assert.equal(report.hasFeasibleSolution, false);
    assert.equal(report.feasibleCount, 0);
    report.evaluatedCandidates.forEach((c) => {
      assert.equal(c.checks.minFrequency.passed, false);
      assert.ok(c.violations.some((v) => v.includes('below required minimum 80 MHz')));
    });
  });
});
