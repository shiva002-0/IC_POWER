/**
 * Deterministic Low-Power Optimization Engine for Digital ICs
 * Searches candidate configurations (Voltage, Frequency) to minimize dynamic power
 * or meet a power budget while strictly satisfying physical design constraints.
 *
 * Reuses the verified CMOS dynamic power equation:
 *   P_dynamic = alpha * C_eff * V_dd^2 * f_clk
 */

import { calculateDynamicPower, validatePowerInputs } from './powerCalculator.js';

export const OPTIMIZATION_OBJECTIVES = {
  MINIMIZE_POWER: 'MINIMIZE_POWER',
  MEET_POWER_BUDGET: 'MEET_POWER_BUDGET',
};

/**
 * Validates optimization constraints and parameters.
 * @param {Object} config
 * @returns {{ isValid: boolean, errors: Record<string, string> }}
 */
export function validateOptimizationConfig(config) {
  const errors = {};

  if (!config) {
    return { isValid: false, errors: { general: 'Configuration object is required.' } };
  }

  const { baseline, constraints, tunableParameters } = config;

  // 1. Validate baseline parameters using existing power calculator validation
  if (!baseline) {
    errors.baseline = 'Baseline configuration is required.';
  } else {
    const baseValidation = validatePowerInputs(baseline);
    if (!baseValidation.isValid) {
      Object.entries(baseValidation.errors).forEach(([k, msg]) => {
        errors[`baseline_${k}`] = `Baseline ${msg}`;
      });
    }
  }

  // 2. Validate tunable parameters (at least one parameter must be tunable)
  if (!tunableParameters || (!tunableParameters.voltage && !tunableParameters.frequency)) {
    errors.tunableParameters = 'At least one optimization parameter (Voltage or Frequency) must be enabled.';
  }

  // 3. Validate constraints
  if (!constraints) {
    errors.constraints = 'Optimization constraints are required.';
  } else {
    const minV = Number(constraints.minVoltageV);
    const maxV = Number(constraints.maxVoltageV);
    const stepV = Number(constraints.voltageStepV);
    const minF = Number(constraints.minFrequencyMhz);
    const stepF = Number(constraints.frequencyStepMhz);

    if (isNaN(minV) || minV <= 0) {
      errors.minVoltageV = 'Minimum voltage must be a positive number (> 0 V).';
    }
    if (isNaN(maxV) || maxV <= 0) {
      errors.maxVoltageV = 'Maximum voltage must be a positive number (> 0 V).';
    }
    if (!isNaN(minV) && !isNaN(maxV) && minV > maxV) {
      errors.voltageRange = 'Minimum voltage cannot exceed maximum voltage.';
    }
    if (isNaN(stepV) || stepV <= 0) {
      errors.voltageStepV = 'Voltage step increment must be greater than 0 V.';
    }

    if (isNaN(minF) || minF <= 0) {
      errors.minFrequencyMhz = 'Minimum required frequency must be a positive number (> 0 MHz).';
    }
    if (isNaN(stepF) || stepF <= 0) {
      errors.frequencyStepMhz = 'Frequency step increment must be greater than 0 MHz.';
    }

    if (constraints.maxFrequencySearchMhz !== undefined && constraints.maxFrequencySearchMhz !== null && constraints.maxFrequencySearchMhz !== '') {
      const maxF = Number(constraints.maxFrequencySearchMhz);
      if (isNaN(maxF) || maxF <= 0) {
        errors.maxFrequencySearchMhz = 'Maximum frequency search bound must be a positive number (> 0 MHz).';
      } else if (!isNaN(minF) && minF > maxF) {
        errors.frequencyRange = 'Minimum frequency cannot exceed maximum search frequency.';
      }
    }

    if (constraints.maxPowerMw !== undefined && constraints.maxPowerMw !== null && constraints.maxPowerMw !== '') {
      const maxP = Number(constraints.maxPowerMw);
      if (isNaN(maxP) || maxP <= 0) {
        errors.maxPowerMw = 'Maximum permitted power budget must be greater than 0 mW.';
      }
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Rounds numbers to specified decimal places to avoid floating point anomalies (e.g. 0.7000000000000001).
 * @param {number} val
 * @param {number} decimals
 * @returns {number}
 */
export function roundToPrecision(val, decimals = 4) {
  const factor = 10 ** decimals;
  return Math.round((val + Number.EPSILON) * factor) / factor;
}

/**
 * Generates discrete candidate points for voltage and frequency.
 * @param {Object} config
 * @returns {Array<{ voltageV: number, frequencyMhz: number }>}
 */
export function generateCandidateConfigurations(config) {
  const { baseline, constraints, tunableParameters } = config;

  // Voltage range
  let voltages = [];
  if (tunableParameters.voltage) {
    const minV = Number(constraints.minVoltageV);
    const maxV = Number(constraints.maxVoltageV);
    const stepV = Number(constraints.voltageStepV);

    for (let v = minV; v <= maxV + 1e-9; v += stepV) {
      voltages.push(roundToPrecision(v, 4));
    }
  } else {
    voltages = [Number(baseline.supplyVoltageV)];
  }

  // Frequency range
  let frequencies = [];
  if (tunableParameters.frequency) {
    const minF = Number(constraints.minFrequencyMhz);
    // Upper frequency bound is maxFrequencySearchMhz if provided, or baseline frequency
    const maxF = constraints.maxFrequencySearchMhz !== undefined && constraints.maxFrequencySearchMhz !== null
      ? Number(constraints.maxFrequencySearchMhz)
      : Math.max(Number(baseline.clockFrequencyMhz), minF);
    const stepF = Number(constraints.frequencyStepMhz);

    for (let f = minF; f <= maxF + 1e-9; f += stepF) {
      frequencies.push(roundToPrecision(f, 2));
    }
  } else {
    frequencies = [Number(baseline.clockFrequencyMhz)];
  }

  const candidates = [];
  for (const v of voltages) {
    for (const f of frequencies) {
      candidates.push({
        voltageV: v,
        frequencyMhz: f,
      });
    }
  }

  return candidates;
}

/**
 * Executes deterministic low-power optimization.
 * Evaluates candidate configurations against CMOS dynamic power equation and constraints.
 *
 * @param {Object} config
 * @returns {Object} Optimization report
 */
export function runOptimizationEngine(config) {
  const validation = validateOptimizationConfig(config);
  if (!validation.isValid) {
    const firstError = Object.values(validation.errors)[0];
    const errorObj = new Error(firstError);
    errorObj.validationErrors = validation.errors;
    throw errorObj;
  }

  const { baseline, constraints, objective = OPTIMIZATION_OBJECTIVES.MINIMIZE_POWER } = config;

  // 1. Calculate baseline power
  const baselineResult = calculateDynamicPower({
    alpha: baseline.alpha,
    effectiveCapacitancePf: baseline.effectiveCapacitancePf,
    supplyVoltageV: baseline.supplyVoltageV,
    clockFrequencyMhz: baseline.clockFrequencyMhz,
  });

  const baselineConfig = {
    alpha: Number(baseline.alpha),
    effectiveCapacitancePf: Number(baseline.effectiveCapacitancePf),
    supplyVoltageV: Number(baseline.supplyVoltageV),
    clockFrequencyMhz: Number(baseline.clockFrequencyMhz),
    powerWatts: baselineResult.watts,
    powerMilliwatts: baselineResult.milliwatts,
  };

  // 2. Generate candidate grid
  const rawCandidates = generateCandidateConfigurations(config);

  const minFrequency = Number(constraints.minFrequencyMhz);
  const minVoltage = Number(constraints.minVoltageV);
  const maxVoltage = Number(constraints.maxVoltageV);
  const maxPower = constraints.maxPowerMw !== undefined && constraints.maxPowerMw !== null && constraints.maxPowerMw !== ''
    ? Number(constraints.maxPowerMw)
    : null;

  // 3. Evaluate each candidate deterministically
  const evaluatedCandidates = rawCandidates.map((cand, index) => {
    const powerResult = calculateDynamicPower({
      alpha: baseline.alpha,
      effectiveCapacitancePf: baseline.effectiveCapacitancePf,
      supplyVoltageV: cand.voltageV,
      clockFrequencyMhz: cand.frequencyMhz,
    });

    const candPowerMw = powerResult.milliwatts;
    const candPowerW = powerResult.watts;

    // Constraint checks
    const passedMinFrequency = cand.frequencyMhz >= minFrequency - 1e-9;
    const passedVoltageRange = cand.voltageV >= minVoltage - 1e-9 && cand.voltageV <= maxVoltage + 1e-9;
    const passedPowerBudget = maxPower === null || candPowerMw <= maxPower + 1e-9;

    const violations = [];
    if (!passedMinFrequency) {
      violations.push(`Frequency ${cand.frequencyMhz} MHz is below required minimum ${minFrequency} MHz`);
    }
    if (!passedVoltageRange) {
      violations.push(`Voltage ${cand.voltageV} V is outside permitted range [${minVoltage} V - ${maxVoltage} V]`);
    }
    if (!passedPowerBudget) {
      violations.push(`Power ${candPowerMw.toFixed(3)} mW exceeds maximum permitted budget ${maxPower.toFixed(3)} mW`);
    }

    const isFeasible = violations.length === 0;

    return {
      id: `CAND-${index + 1}`,
      voltageV: cand.voltageV,
      frequencyMhz: cand.frequencyMhz,
      powerWatts: candPowerW,
      powerMilliwatts: candPowerMw,
      isFeasible,
      violations,
      checks: {
        minFrequency: {
          passed: passedMinFrequency,
          actual: cand.frequencyMhz,
          required: minFrequency,
          unit: 'MHz',
        },
        voltageRange: {
          passed: passedVoltageRange,
          actual: cand.voltageV,
          min: minVoltage,
          max: maxVoltage,
          unit: 'V',
        },
        powerBudget: {
          passed: passedPowerBudget,
          actual: candPowerMw,
          limit: maxPower,
          unit: 'mW',
        },
      },
    };
  });

  // 4. Filter feasible candidates
  const feasibleCandidates = evaluatedCandidates.filter((c) => c.isFeasible);

  // 5. Rank feasible candidates based on objective
  if (objective === OPTIMIZATION_OBJECTIVES.MEET_POWER_BUDGET) {
    // Goal: Meet power budget while maximizing clock frequency
    feasibleCandidates.sort((a, b) => {
      // Primary: Highest clock frequency
      if (Math.abs(b.frequencyMhz - a.frequencyMhz) > 1e-6) {
        return b.frequencyMhz - a.frequencyMhz;
      }
      // Tie-breaker: Lowest power
      return a.powerMilliwatts - b.powerMilliwatts;
    });
  } else {
    // Default: MINIMIZE_POWER
    feasibleCandidates.sort((a, b) => {
      // Primary: Lowest dynamic power
      if (Math.abs(a.powerMilliwatts - b.powerMilliwatts) > 1e-6) {
        return a.powerMilliwatts - b.powerMilliwatts;
      }
      // Tie-breaker: Highest clock frequency
      return b.frequencyMhz - a.frequencyMhz;
    });
  }

  // 6. Formulate result report
  const totalEvaluated = evaluatedCandidates.length;
  const feasibleCount = feasibleCandidates.length;
  const rejectedCount = totalEvaluated - feasibleCount;

  if (feasibleCount === 0) {
    return {
      success: false,
      hasFeasibleSolution: false,
      objective,
      totalEvaluated,
      feasibleCount: 0,
      rejectedCount,
      baseline: baselineConfig,
      bestCandidate: null,
      message: `No feasible candidate configuration satisfied all constraints. Evaluated ${totalEvaluated} configurations; all violated frequency or power limits.`,
      evaluatedCandidates,
    };
  }

  const best = feasibleCandidates[0];
  const deltaPowerMw = baselineConfig.powerMilliwatts - best.powerMilliwatts;
  const isPowerReduced = deltaPowerMw > 1e-6;
  const percentageReduction = isPowerReduced
    ? (deltaPowerMw / baselineConfig.powerMilliwatts) * 100
    : 0;

  const deltaVoltageV = best.voltageV - baselineConfig.supplyVoltageV;
  const deltaFrequencyMhz = best.frequencyMhz - baselineConfig.clockFrequencyMhz;

  let summaryMessage = '';
  if (isPowerReduced) {
    summaryMessage = `Optimal configuration found: Dynamic power reduced from ${baselineConfig.powerMilliwatts.toFixed(3)} mW to ${best.powerMilliwatts.toFixed(3)} mW (-${percentageReduction.toFixed(1)}%).`;
  } else if (Math.abs(deltaPowerMw) <= 1e-6) {
    summaryMessage = `Baseline already achieves optimal power within the specified constraint boundaries (${best.powerMilliwatts.toFixed(3)} mW).`;
  } else {
    summaryMessage = `Feasible configuration found meeting frequency constraints, but dynamic power increased to ${best.powerMilliwatts.toFixed(3)} mW (+${Math.abs((deltaPowerMw / baselineConfig.powerMilliwatts) * 100).toFixed(1)}%).`;
  }

  return {
    success: true,
    hasFeasibleSolution: true,
    objective,
    totalEvaluated,
    feasibleCount,
    rejectedCount,
    baseline: baselineConfig,
    bestCandidate: {
      ...best,
      deltaPowerMw: roundToPrecision(deltaPowerMw, 4),
      percentageReduction: roundToPrecision(percentageReduction, 2),
      isPowerReduced,
      deltaVoltageV: roundToPrecision(deltaVoltageV, 4),
      deltaFrequencyMhz: roundToPrecision(deltaFrequencyMhz, 2),
    },
    rankedCandidates: feasibleCandidates,
    evaluatedCandidates,
    summaryMessage,
  };
}
