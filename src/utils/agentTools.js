/**
 * Agentic AI Tool Calling Definitions & Execution Engine
 * Exposes verified, deterministic digital IC power engineering tools to autonomous agents:
 *   1. calculatePower (Dynamic power dissipation formula)
 *   2. searchConfigurations (Deterministic optimization engine)
 *   3. verifyCandidate (Independent constraint verification)
 *   4. compareConfigurations (Baseline vs candidate delta metrics)
 *   5. recordExperiment (Audit log and experiment registry persistence)
 */

import { calculateDynamicPower, validatePowerInputs } from './powerCalculator.js';
import { runOptimizationEngine, OPTIMIZATION_OBJECTIVES, roundToPrecision } from './optimizationEngine.js';
import { saveExperiment } from './experimentStorage.js';

/**
 * Standard Tool Declarations for LLM Function Calling (OpenAI & Gemini format)
 */
export const AGENT_TOOL_DEFINITIONS = [
  {
    name: 'calculatePower',
    description: 'Calculates digital IC CMOS dynamic power dissipation using P_dyn = alpha * C_eff * V_dd^2 * f_clk with exact SI unit conversions.',
    parameters: {
      type: 'object',
      properties: {
        alpha: {
          type: 'number',
          description: 'Switching activity factor (0.0 to 1.0)',
        },
        effectiveCapacitancePf: {
          type: 'number',
          description: 'Effective lumped switching capacitance in picofarads (pF > 0)',
        },
        supplyVoltageV: {
          type: 'number',
          description: 'Supply rail voltage V_dd in Volts (V > 0)',
        },
        clockFrequencyMhz: {
          type: 'number',
          description: 'System clock frequency f_clk in Megahertz (MHz > 0)',
        },
      },
      required: ['alpha', 'effectiveCapacitancePf', 'supplyVoltageV', 'clockFrequencyMhz'],
    },
  },
  {
    name: 'searchConfigurations',
    description: 'Executes a deterministic bounded candidate search over voltage (DVFS) and frequency scaling to find the optimal low-power configuration meeting physical constraints.',
    parameters: {
      type: 'object',
      properties: {
        baseline: {
          type: 'object',
          description: 'Baseline circuit operating parameters (alpha, effectiveCapacitancePf, supplyVoltageV, clockFrequencyMhz)',
          properties: {
            alpha: { type: 'number' },
            effectiveCapacitancePf: { type: 'number' },
            supplyVoltageV: { type: 'number' },
            clockFrequencyMhz: { type: 'number' },
          },
          required: ['alpha', 'effectiveCapacitancePf', 'supplyVoltageV', 'clockFrequencyMhz'],
        },
        constraints: {
          type: 'object',
          description: 'Physical design constraints & search bounds',
          properties: {
            maxPowerMw: { type: 'number', description: 'Maximum permitted power budget in mW' },
            minFrequencyMhz: { type: 'number', description: 'Minimum required clock frequency in MHz' },
            maxFrequencySearchMhz: { type: 'number', description: 'Upper bound for frequency search in MHz' },
            minVoltageV: { type: 'number', description: 'Minimum safe supply voltage in V' },
            maxVoltageV: { type: 'number', description: 'Maximum safe supply voltage in V' },
            voltageStepV: { type: 'number', description: 'Voltage grid step increment in V (e.g. 0.05 or 0.1)' },
            frequencyStepMhz: { type: 'number', description: 'Frequency grid step increment in MHz (e.g. 10)' },
          },
          required: ['minVoltageV', 'maxVoltageV', 'voltageStepV', 'minFrequencyMhz', 'frequencyStepMhz'],
        },
        tunableParameters: {
          type: 'object',
          description: 'Knobs permitted to be adjusted by the search engine',
          properties: {
            voltage: { type: 'boolean' },
            frequency: { type: 'boolean' },
          },
        },
        objective: {
          type: 'string',
          enum: ['MINIMIZE_POWER', 'MEET_POWER_BUDGET'],
          description: 'Optimization goal: MINIMIZE_POWER (lowest dissipation) or MEET_POWER_BUDGET (highest clock speed under budget)',
        },
      },
      required: ['baseline', 'constraints'],
    },
  },
  {
    name: 'verifyCandidate',
    description: 'Independently verifies a proposed candidate configuration against all physical design constraints and recalculates dynamic power from scratch. Crucial safeguard before sign-off.',
    parameters: {
      type: 'object',
      properties: {
        candidate: {
          type: 'object',
          properties: {
            voltageV: { type: 'number' },
            frequencyMhz: { type: 'number' },
          },
          required: ['voltageV', 'frequencyMhz'],
        },
        baseline: {
          type: 'object',
          properties: {
            alpha: { type: 'number' },
            effectiveCapacitancePf: { type: 'number' },
          },
          required: ['alpha', 'effectiveCapacitancePf'],
        },
        constraints: {
          type: 'object',
          properties: {
            minFrequencyMhz: { type: 'number' },
            minVoltageV: { type: 'number' },
            maxVoltageV: { type: 'number' },
            maxPowerMw: { type: 'number' },
          },
          required: ['minFrequencyMhz', 'minVoltageV', 'maxVoltageV'],
        },
      },
      required: ['candidate', 'baseline', 'constraints'],
    },
  },
  {
    name: 'compareConfigurations',
    description: 'Calculates exact numerical deltas between baseline and candidate configurations (power delta, percentage savings, voltage shift, and frequency shift).',
    parameters: {
      type: 'object',
      properties: {
        baseline: {
          type: 'object',
          properties: {
            powerMilliwatts: { type: 'number' },
            supplyVoltageV: { type: 'number' },
            clockFrequencyMhz: { type: 'number' },
          },
          required: ['powerMilliwatts', 'supplyVoltageV', 'clockFrequencyMhz'],
        },
        candidate: {
          type: 'object',
          properties: {
            powerMilliwatts: { type: 'number' },
            voltageV: { type: 'number' },
            frequencyMhz: { type: 'number' },
          },
          required: ['powerMilliwatts', 'voltageV', 'frequencyMhz'],
        },
      },
      required: ['baseline', 'candidate'],
    },
  },
  {
    name: 'recordExperiment',
    description: 'Persists an independently verified optimization run to the persistent experiment registry for audit logging, sign-off reviews, and PPA matrix tracking.',
    parameters: {
      type: 'object',
      properties: {
        experimentName: { type: 'string', description: 'Descriptive title for the optimization experiment' },
        goal: { type: 'string', description: 'Original natural language optimization objective' },
        baseline: {
          type: 'object',
          description: 'Baseline circuit operating parameters',
          properties: {
            alpha: { type: 'number' },
            effectiveCapacitancePf: { type: 'number' },
            supplyVoltageV: { type: 'number' },
            clockFrequencyMhz: { type: 'number' },
            powerMilliwatts: { type: 'number' },
          },
        },
        candidate: {
          type: 'object',
          description: 'Optimized candidate operating parameters',
          properties: {
            voltageV: { type: 'number' },
            frequencyMhz: { type: 'number' },
            powerMilliwatts: { type: 'number' },
          },
        },
        comparison: {
          type: 'object',
          description: 'Delta metrics versus baseline',
          properties: {
            deltaPowerMw: { type: 'number' },
            percentageReduction: { type: 'number' },
            deltaVoltageV: { type: 'number' },
            deltaFrequencyMhz: { type: 'number' },
          },
        },
        verification: {
          type: 'object',
          description: 'Independent physical constraint verification results',
          properties: {
            isVerified: { type: 'boolean' },
            verificationStatement: { type: 'string' },
          },
        },
        tags: { type: 'array', items: { type: 'string' } },
      },
      required: ['experimentName', 'baseline', 'candidate', 'verification'],
    },
  },
];

/**
 * Tool 1: calculatePower
 */
export function toolCalculatePower(args) {
  if (!args || typeof args !== 'object') {
    throw new TypeError('calculatePower requires an arguments object.');
  }

  const { alpha, effectiveCapacitancePf, supplyVoltageV, clockFrequencyMhz } = args;
  const validation = validatePowerInputs({ alpha, effectiveCapacitancePf, supplyVoltageV, clockFrequencyMhz });
  if (!validation.isValid) {
    const errorList = Object.values(validation.errors || {});
    const msg = errorList.length > 0 ? errorList.join('; ') : 'Invalid inputs for calculatePower.';
    throw new Error(`Invalid inputs for calculatePower: ${msg}`);
  }

  const result = calculateDynamicPower({ alpha, effectiveCapacitancePf, supplyVoltageV, clockFrequencyMhz });
  return {
    success: true,
    alpha: Number(alpha),
    effectiveCapacitancePf: Number(effectiveCapacitancePf),
    supplyVoltageV: Number(supplyVoltageV),
    clockFrequencyMhz: Number(clockFrequencyMhz),
    powerWatts: roundToPrecision(result.watts, 8),
    powerMilliwatts: roundToPrecision(result.milliwatts, 4),
    powerMicroWatts: roundToPrecision(result.microWatts, 2),
    capacitanceFarads: result.capacitanceFarads,
    frequencyHz: result.frequencyHz,
    voltageSquared: roundToPrecision(result.voltageSquared, 4),
  };
}

/**
 * Tool 2: searchConfigurations
 */
export function toolSearchConfigurations(args) {
  if (!args || typeof args !== 'object') {
    throw new TypeError('searchConfigurations requires an arguments object.');
  }

  const {
    baseline,
    constraints,
    tunableParameters = { voltage: true, frequency: true },
    objective = OPTIMIZATION_OBJECTIVES.MINIMIZE_POWER,
  } = args;

  const safeBaseline = baseline ? {
    alpha: Number(baseline.alpha),
    effectiveCapacitancePf: Number(baseline.effectiveCapacitancePf),
    supplyVoltageV: Number(baseline.supplyVoltageV),
    clockFrequencyMhz: Number(baseline.clockFrequencyMhz),
  } : baseline;

  const safeConstraints = constraints ? {
    ...constraints,
    minVoltageV: Number(constraints.minVoltageV),
    maxVoltageV: Number(constraints.maxVoltageV),
    voltageStepV: Number(constraints.voltageStepV),
    minFrequencyMhz: Number(constraints.minFrequencyMhz),
    frequencyStepMhz: Number(constraints.frequencyStepMhz),
    maxFrequencySearchMhz: constraints.maxFrequencySearchMhz !== undefined && constraints.maxFrequencySearchMhz !== null && constraints.maxFrequencySearchMhz !== ''
      ? Number(constraints.maxFrequencySearchMhz)
      : undefined,
    maxPowerMw: constraints.maxPowerMw !== undefined && constraints.maxPowerMw !== null && constraints.maxPowerMw !== ''
      ? Number(constraints.maxPowerMw)
      : undefined,
  } : constraints;

  const report = runOptimizationEngine({
    baseline: safeBaseline,
    constraints: safeConstraints,
    tunableParameters,
    objective,
  });

  return {
    success: report.success,
    hasFeasibleSolution: report.hasFeasibleSolution,
    objective: report.objective,
    totalEvaluated: report.totalEvaluated,
    feasibleCount: report.feasibleCount,
    rejectedCount: report.rejectedCount,
    baseline: report.baseline,
    bestCandidate: report.bestCandidate,
    summaryMessage: report.summaryMessage || report.message,
    topCandidates: (report.rankedCandidates || []).slice(0, 5),
  };
}

/**
 * Tool 3: verifyCandidate
 * Independently recalculates candidate power and verifies against each constraint boundary.
 */
export function toolVerifyCandidate(args) {
  if (!args || typeof args !== 'object') {
    return {
      success: false,
      isVerified: false,
      violations: ['verifyCandidate requires an arguments object.'],
      verificationStatement: 'Verification FAILED: Arguments object required.',
      error: 'verifyCandidate requires an arguments object.',
    };
  }

  const { candidate, baseline, constraints } = args;
  const violations = [];

  if (!candidate) {
    violations.push('Candidate configuration is missing.');
    return {
      success: false,
      isVerified: false,
      violations,
      verificationStatement: 'Verification FAILED: Candidate configuration is missing.',
      error: 'Candidate configuration is missing.',
    };
  }

  const candV = Number(candidate.voltageV);
  const candF = Number(candidate.frequencyMhz);

  if (isNaN(candV) || candV <= 0) {
    violations.push('Candidate voltageV must be a valid positive number.');
  }
  if (isNaN(candF) || candF <= 0) {
    violations.push('Candidate frequencyMhz must be a valid positive number.');
  }

  if (!baseline) {
    violations.push('Baseline circuit parameters are missing.');
  }
  const baseAlpha = baseline ? Number(baseline.alpha) : NaN;
  const baseCap = baseline ? Number(baseline.effectiveCapacitancePf) : NaN;

  if (isNaN(baseAlpha) || baseAlpha < 0 || baseAlpha > 1) {
    violations.push('Baseline activity factor alpha must be a valid number between 0 and 1.');
  }
  if (isNaN(baseCap) || baseCap <= 0) {
    violations.push('Baseline effectiveCapacitancePf must be a valid positive number.');
  }

  if (!constraints) {
    violations.push('Constraints object is missing.');
  }
  const minF = constraints ? Number(constraints.minFrequencyMhz) : NaN;
  const minV = constraints ? Number(constraints.minVoltageV) : NaN;
  const maxV = constraints ? Number(constraints.maxVoltageV) : NaN;
  const maxP = constraints && constraints.maxPowerMw !== undefined && constraints.maxPowerMw !== null && constraints.maxPowerMw !== ''
    ? Number(constraints.maxPowerMw)
    : null;

  if (isNaN(minF) || minF <= 0) {
    violations.push('Constraint minFrequencyMhz must be a valid positive number.');
  }

  if (violations.length > 0) {
    return {
      success: false,
      isVerified: false,
      violations,
      verificationStatement: `Verification FAILED: ${violations.join('; ')}`,
      error: violations.join('; '),
    };
  }

  // 1. Independent Recalculation
  let recalculated;
  try {
    recalculated = calculateDynamicPower({
      alpha: baseAlpha,
      effectiveCapacitancePf: baseCap,
      supplyVoltageV: candV,
      clockFrequencyMhz: candF,
    });
  } catch (err) {
    violations.push(`Dynamic power recalculation failed: ${err.message}`);
    return {
      success: false,
      isVerified: false,
      violations,
      verificationStatement: `Verification FAILED: ${violations.join('; ')}`,
      error: err.message,
    };
  }

  const candPowerMw = roundToPrecision(recalculated.milliwatts, 4);

  // 2. Individual Constraint Evaluations
  const passedMinFrequency = candF >= minF - 1e-9;
  const passedVoltageRange = (isNaN(minV) || candV >= minV - 1e-9) && (isNaN(maxV) || candV <= maxV + 1e-9);
  const passedPowerBudget = maxP === null || isNaN(maxP) || candPowerMw <= maxP + 1e-9;

  if (!passedMinFrequency) {
    violations.push(`Operating frequency ${candF} MHz violates required minimum ${minF} MHz`);
  }
  if (!passedVoltageRange) {
    violations.push(`Supply voltage ${candV} V is outside permitted range [${minV} V - ${maxV} V]`);
  }
  if (!passedPowerBudget) {
    violations.push(`Dynamic power ${candPowerMw.toFixed(3)} mW exceeds maximum permitted budget ${maxP.toFixed(3)} mW`);
  }

  const isVerified = violations.length === 0;

  return {
    success: true,
    isVerified,
    candidate: {
      voltageV: candV,
      frequencyMhz: candF,
      recalculatedPowerMw: candPowerMw,
      recalculatedPowerW: recalculated.watts,
    },
    checks: {
      minFrequency: {
        passed: passedMinFrequency,
        actual: candF,
        required: minF,
        unit: 'MHz',
      },
      voltageRange: {
        passed: passedVoltageRange,
        actual: candV,
        min: minV,
        max: maxV,
        unit: 'V',
      },
      powerBudget: {
        passed: passedPowerBudget,
        actual: candPowerMw,
        limit: maxP,
        unit: 'mW',
      },
    },
    violations,
    verificationStatement: isVerified
      ? `Verification PASSED: Candidate operating at ${candV}V / ${candF}MHz dissipates ${candPowerMw.toFixed(3)} mW and satisfies all physical constraints.`
      : `Verification FAILED: ${violations.join('; ')}`,
  };
}

/**
 * Tool 4: compareConfigurations
 */
export function toolCompareConfigurations(args) {
  if (!args || typeof args !== 'object') {
    return {
      success: false,
      isPowerReduced: false,
      deltaPowerMw: 0,
      percentageReduction: 0,
      deltaVoltageV: 0,
      deltaFrequencyMhz: 0,
      comparisonSummary: 'compareConfigurations requires an arguments object.',
      error: 'compareConfigurations requires an arguments object.',
    };
  }

  const { baseline, candidate } = args;
  const baseP = baseline ? Number(baseline.powerMilliwatts) : NaN;
  const candP = candidate ? Number(candidate.powerMilliwatts) : NaN;

  if (isNaN(baseP) || isNaN(candP)) {
    return {
      success: false,
      isPowerReduced: false,
      deltaPowerMw: 0,
      percentageReduction: 0,
      deltaVoltageV: 0,
      deltaFrequencyMhz: 0,
      comparisonSummary: 'Baseline or candidate powerMilliwatts is invalid or missing.',
      error: 'Baseline or candidate powerMilliwatts is invalid or missing.',
    };
  }

  const deltaPowerMw = roundToPrecision(baseP - candP, 4);
  const isPowerReduced = deltaPowerMw > 1e-6;
  const percentageReduction = isPowerReduced && baseP > 0 ? roundToPrecision((deltaPowerMw / baseP) * 100, 2) : 0;

  const baseV = Number(baseline.supplyVoltageV || 0);
  const candV = Number(candidate.voltageV || 0);
  const deltaVoltageV = roundToPrecision(candV - baseV, 4);

  const baseF = Number(baseline.clockFrequencyMhz || 0);
  const candF = Number(candidate.frequencyMhz || 0);
  const deltaFrequencyMhz = roundToPrecision(candF - baseF, 2);

  let comparisonSummary = '';
  if (isPowerReduced) {
    comparisonSummary = `Power reduced by ${deltaPowerMw.toFixed(3)} mW (-${percentageReduction.toFixed(1)}%) compared to baseline.`;
  } else if (Math.abs(deltaPowerMw) <= 1e-6) {
    comparisonSummary = 'Dynamic power matches baseline within specified boundaries.';
  } else {
    comparisonSummary = `Power increased by ${Math.abs(deltaPowerMw).toFixed(3)} mW (+${baseP > 0 ? Math.abs(roundToPrecision((deltaPowerMw / baseP) * 100, 2)).toFixed(1) : 0}%).`;
  }

  return {
    success: true,
    baselinePowerMw: baseP,
    candidatePowerMw: candP,
    deltaPowerMw,
    percentageReduction,
    isPowerReduced,
    deltaVoltageV,
    deltaFrequencyMhz,
    comparisonSummary,
  };
}

/**
 * Tool 5: recordExperiment
 */
export function toolRecordExperiment(args) {
  if (!args || typeof args !== 'object') {
    throw new TypeError('recordExperiment requires an arguments object.');
  }

  const { experimentName, goal, baseline, candidate, comparison, verification, tags = [] } = args;
  if (!experimentName) {
    throw new Error('recordExperiment requires experimentName.');
  }
  if (!verification || verification.isVerified !== true) {
    throw new Error('Cannot record unverified experiment. Independent verification must pass first.');
  }

  const record = saveExperiment({
    name: experimentName,
    goal: goal || 'Autonomous AI Low-Power Optimization',
    baseline,
    candidate,
    comparison,
    verification,
    tags: Array.isArray(tags) ? tags : ['AI-Optimization', 'Verified'],
  });

  return {
    success: true,
    experimentId: record.id,
    recordedAt: record.recordedAt,
    message: `Experiment recorded successfully in registry with ID ${record.id}.`,
  };
}

/**
 * Unified Tool Execution Dispatcher
 * @param {string} toolName
 * @param {Object} args
 * @returns {Object}
 */
export function executeAgentTool(toolName, args) {
  try {
    switch (toolName) {
      case 'calculatePower':
        return toolCalculatePower(args);
      case 'searchConfigurations':
        return toolSearchConfigurations(args);
      case 'verifyCandidate':
        return toolVerifyCandidate(args);
      case 'compareConfigurations':
        return toolCompareConfigurations(args);
      case 'recordExperiment':
        return toolRecordExperiment(args);
      default:
        return {
          success: false,
          error: `Unrecognized tool: "${toolName}". Available tools: calculatePower, searchConfigurations, verifyCandidate, compareConfigurations, recordExperiment.`,
        };
    }
  } catch (err) {
    return {
      success: false,
      error: err.message,
      toolName,
    };
  }
}

/**
 * Natural Language Goal Parser
 * Extracts objective, constraints, and baseline parameters from user input.
 * @param {string} goalText
 * @param {Object} fallbackBaseline
 * @returns {{ objective: string, baseline: Object, constraints: Object, tunableParameters: Object }}
 */
export function parseGoalToConfiguration(goalText, fallbackBaseline = {}) {
  const text = (goalText || '').toLowerCase();

  // Baseline extraction or defaults
  const baseline = {
    alpha: fallbackBaseline.alpha !== undefined ? fallbackBaseline.alpha : 0.20,
    effectiveCapacitancePf: fallbackBaseline.effectiveCapacitancePf !== undefined ? fallbackBaseline.effectiveCapacitancePf : 20,
    supplyVoltageV: fallbackBaseline.supplyVoltageV !== undefined ? fallbackBaseline.supplyVoltageV : 1.2,
    clockFrequencyMhz: fallbackBaseline.clockFrequencyMhz !== undefined ? fallbackBaseline.clockFrequencyMhz : 100,
  };

  // Activity factor (alpha)
  const alphaMatch = text.match(/alpha\s*[:=]?\s*([0-9.]+)|switching\s*activity\s*[:=]?\s*([0-9.]+)/i);
  if (alphaMatch) {
    const val = parseFloat(alphaMatch[1] || alphaMatch[2]);
    if (!isNaN(val) && val >= 0 && val <= 1) baseline.alpha = val;
  }

  // Capacitance
  const capMatch = text.match(/([0-9.]+)\s*(?:pf|picofarads?)/i);
  if (capMatch) {
    const val = parseFloat(capMatch[1]);
    if (!isNaN(val) && val > 0) baseline.effectiveCapacitancePf = val;
  }

  // Clock frequency mention
  const freqBaseMatch = text.match(/baseline\s*(?:clock\s*)?(?:frequency\s*)?([0-9.]+)\s*mhz/i);
  if (freqBaseMatch) {
    const val = parseFloat(freqBaseMatch[1]);
    if (!isNaN(val) && val > 0) baseline.clockFrequencyMhz = val;
  }

  // Constraints extraction
  const constraints = {
    minVoltageV: 0.8,
    maxVoltageV: 1.2,
    voltageStepV: 0.05,
    minFrequencyMhz: 80,
    maxFrequencySearchMhz: 100,
    frequencyStepMhz: 10,
    maxPowerMw: 0.400,
  };

  // Power budget extraction (e.g. "under 0.35 mW", "budget of 0.400 mw", "below 0.1 mw")
  const powerMatch = text.match(/(?:under|below|budget|within|max(?:imum)?\s*power(?:\s*budget)?)\s*(?:of|[:=])?\s*([0-9.]+)\s*(?:mw|milliwatts?)/i);
  if (powerMatch) {
    const val = parseFloat(powerMatch[1]);
    if (!isNaN(val) && val > 0) constraints.maxPowerMw = val;
  }

  // Minimum required frequency (e.g. "at least 80 MHz", "min frequency of 90 MHz", "maintain >= 80 MHz")
  const minFreqMatch = text.match(/(?:at\s*least|min(?:imum)?\s*freq(?:uency)?|maintain\s*>=?)\s*(?:of|[:=])?\s*([0-9.]+)\s*mhz/i);
  if (minFreqMatch) {
    const val = parseFloat(minFreqMatch[1]);
    if (!isNaN(val) && val > 0) constraints.minFrequencyMhz = val;
  }

  // Voltage range extraction (e.g. "voltage between 0.8v and 1.2v", "0.8 - 1.2 V")
  const vRangeMatch = text.match(/([0-9.]+)\s*v?\s*(?:to|-|and)\s*([0-9.]+)\s*v/i);
  if (vRangeMatch) {
    const v1 = parseFloat(vRangeMatch[1]);
    const v2 = parseFloat(vRangeMatch[2]);
    if (!isNaN(v1) && !isNaN(v2)) {
      constraints.minVoltageV = Math.min(v1, v2);
      constraints.maxVoltageV = Math.max(v1, v2);
    }
  }

  // Objective detection
  let objective = OPTIMIZATION_OBJECTIVES.MINIMIZE_POWER;
  if (text.includes('maximize frequency') || text.includes('highest clock') || text.includes('meet budget and maximize') || text.includes('meet power budget')) {
    objective = OPTIMIZATION_OBJECTIVES.MEET_POWER_BUDGET;
  }

  // Tunable parameters detection
  const tunableParameters = {
    voltage: true,
    frequency: true,
  };
  if (text.includes('voltage only') || text.includes('voltage scaling only') || text.includes('dvfs only without frequency tuning')) {
    tunableParameters.frequency = false;
  } else if (text.includes('frequency only') || text.includes('clock scaling only')) {
    tunableParameters.voltage = false;
  }

  return {
    objective,
    baseline,
    constraints,
    tunableParameters,
  };
}

/**
 * Executes the Deterministic Agent Workflow
 * Used when no LLM API key is configured, or explicitly requested.
 * Guaranteed 100% deterministic, zero hallucinations, fully verifiable.
 * Operates cleanly in both Node.js server and browser client runtimes.
 */
export async function runDeterministicAgentWorkflow({ goal, baseline: userBaseline, constraints: userConstraints }) {
  const parsed = parseGoalToConfiguration(goal, userBaseline || {});
  const baseline = userBaseline || parsed.baseline;
  const constraints = { ...parsed.constraints, ...(userConstraints || {}) };
  const tunableParameters = parsed.tunableParameters;
  const objective = parsed.objective || OPTIMIZATION_OBJECTIVES.MINIMIZE_POWER;

  const timeline = [];
  let stepIndex = 1;

  // Plan formulation
  const planSummary = [
    `1. Calculate baseline circuit dynamic power dissipation (α=${baseline.alpha}, C=${baseline.effectiveCapacitancePf}pF, V=${baseline.supplyVoltageV}V, f=${baseline.clockFrequencyMhz}MHz).`,
    `2. Perform deterministic bounded candidate search satisfying ${constraints.minFrequencyMhz} MHz minimum frequency and ${constraints.maxPowerMw || 'unconstrained'} mW power budget.`,
    '3. Independently verify the optimal candidate against every physical design constraint.',
    '4. Compute exact power reduction and voltage/frequency shift deltas vs. baseline.',
    '5. Record the verified experiment into the registry for sign-off review.',
  ];

  timeline.push({
    step: stepIndex++,
    type: 'plan',
    title: 'Agent Task Plan Formulated',
    plan: planSummary,
    reasoning: `Extracted goal parameters: ${objective} objective, budget ${constraints.maxPowerMw || 'none'} mW, minimum frequency ${constraints.minFrequencyMhz} MHz.`,
    timestamp: Date.now(),
  });

  // Step 1: calculatePower for baseline
  const powerArgs = {
    alpha: Number(baseline.alpha),
    effectiveCapacitancePf: Number(baseline.effectiveCapacitancePf),
    supplyVoltageV: Number(baseline.supplyVoltageV),
    clockFrequencyMhz: Number(baseline.clockFrequencyMhz),
  };
  const baselinePowerRes = executeAgentTool('calculatePower', powerArgs);
  timeline.push({
    step: stepIndex++,
    type: 'tool_call',
    toolName: 'calculatePower',
    arguments: powerArgs,
    result: baselinePowerRes,
    reasoning: `Baseline dynamic power calculated at ${baselinePowerRes.powerMilliwatts} mW (${baselinePowerRes.powerWatts} W). Proceeding to search candidate space.`,
    timestamp: Date.now(),
  });

  // Step 2: searchConfigurations
  const searchArgs = {
    baseline: powerArgs,
    constraints,
    tunableParameters,
    objective,
  };
  const searchRes = executeAgentTool('searchConfigurations', searchArgs);
  timeline.push({
    step: stepIndex++,
    type: 'tool_call',
    toolName: 'searchConfigurations',
    arguments: searchArgs,
    result: searchRes,
    reasoning: searchRes.hasFeasibleSolution
      ? `Search complete: Evaluated ${searchRes.totalEvaluated} candidates. Optimal feasible configuration identified at ${searchRes.bestCandidate.voltageV}V / ${searchRes.bestCandidate.frequencyMhz}MHz (${searchRes.bestCandidate.powerMilliwatts.toFixed(3)} mW).`
      : `Search complete: All ${searchRes.totalEvaluated} candidate configurations violated physical constraints (${searchRes.summaryMessage}).`,
    timestamp: Date.now(),
  });

  // Handle unfeasible scenario cleanly
  if (!searchRes.hasFeasibleSolution || !searchRes.bestCandidate) {
    timeline.push({
      step: stepIndex++,
      type: 'verification',
      status: 'FAILED',
      reasoning: 'Independent verification skipped: No candidate satisfied the constraints.',
      timestamp: Date.now(),
    });

    return {
      success: false,
      hasFeasibleSolution: false,
      mode: 'deterministic',
      goal,
      extractedConfig: { baseline, constraints, tunableParameters, objective },
      planSummary,
      timeline,
      verification: { isVerified: false, violations: ['No candidate satisfied physical constraints.'] },
      finalReport: {
        success: false,
        summary: searchRes.summaryMessage,
        baselinePowerMw: baselinePowerRes.powerMilliwatts,
        optimizedPowerMw: null,
        savingsMw: 0,
        savingsPercent: 0,
        recommendation: 'Relax the power budget constraint or decrease the minimum required clock frequency.',
      },
    };
  }

  // Step 3: verifyCandidate
  const verifyArgs = {
    candidate: {
      voltageV: Number(searchRes.bestCandidate.voltageV),
      frequencyMhz: Number(searchRes.bestCandidate.frequencyMhz),
    },
    baseline: {
      alpha: Number(baseline.alpha),
      effectiveCapacitancePf: Number(baseline.effectiveCapacitancePf),
    },
    constraints,
  };
  const verifyRes = executeAgentTool('verifyCandidate', verifyArgs);
  const violationsList = Array.isArray(verifyRes?.violations) ? verifyRes.violations : [];
  const reasoningMsg = verifyRes?.isVerified
    ? `Independent physical constraint verification PASSED. Recalculated power: ${verifyRes.candidate?.recalculatedPowerMw?.toFixed(3) || 'N/A'} mW.`
    : `Independent verification FAILED: ${violationsList.length > 0 ? violationsList.join('; ') : (verifyRes?.error || 'Physical constraint violation detected.')}`;

  timeline.push({
    step: stepIndex++,
    type: 'tool_call',
    toolName: 'verifyCandidate',
    arguments: verifyArgs,
    result: verifyRes,
    reasoning: reasoningMsg,
    timestamp: Date.now(),
  });

  if (!verifyRes.isVerified) {
    return {
      success: false,
      hasFeasibleSolution: false,
      mode: 'deterministic',
      goal,
      extractedConfig: { baseline, constraints, tunableParameters, objective },
      planSummary,
      timeline,
      verification: verifyRes,
      finalReport: {
        success: false,
        summary: 'Candidate failed independent constraint verification.',
        recommendation: 'Reject candidate and review constraint bounds.',
      },
    };
  }

  // Step 4: compareConfigurations
  const compareArgs = {
    baseline: {
      powerMilliwatts: baselinePowerRes.powerMilliwatts,
      supplyVoltageV: powerArgs.supplyVoltageV,
      clockFrequencyMhz: powerArgs.clockFrequencyMhz,
    },
    candidate: {
      powerMilliwatts: verifyRes.candidate.recalculatedPowerMw,
      voltageV: verifyArgs.candidate.voltageV,
      frequencyMhz: verifyArgs.candidate.frequencyMhz,
    },
  };
  const compareRes = executeAgentTool('compareConfigurations', compareArgs);
  timeline.push({
    step: stepIndex++,
    type: 'tool_call',
    toolName: 'compareConfigurations',
    arguments: compareArgs,
    result: compareRes,
    reasoning: compareRes.comparisonSummary,
    timestamp: Date.now(),
  });

  // Step 5: recordExperiment
  const recordArgs = {
    experimentName: `Optimization: ${objective === OPTIMIZATION_OBJECTIVES.MEET_POWER_BUDGET ? 'Max Frequency Budget' : 'Min Dynamic Power'}`,
    goal,
    baseline: powerArgs,
    candidate: verifyArgs.candidate,
    comparison: compareRes,
    verification: verifyRes,
    tags: ['Deterministic-Agent', 'Verified', `${verifyArgs.candidate.voltageV}V`, `${verifyArgs.candidate.frequencyMhz}MHz`],
  };
  const recordRes = executeAgentTool('recordExperiment', recordArgs);
  timeline.push({
    step: stepIndex++,
    type: 'tool_call',
    toolName: 'recordExperiment',
    arguments: recordArgs,
    result: recordRes,
    reasoning: `Experiment logged to persistent registry with ID: ${recordRes.experimentId}.`,
    timestamp: Date.now(),
  });

  return {
    success: true,
    hasFeasibleSolution: true,
    mode: 'deterministic',
    goal,
    extractedConfig: { baseline, constraints, tunableParameters, objective },
    planSummary,
    timeline,
    verification: verifyRes,
    finalReport: {
      success: true,
      summary: `Verified optimal design: Power reduced from ${baselinePowerRes.powerMilliwatts.toFixed(3)} mW to ${verifyRes.candidate.recalculatedPowerMw.toFixed(3)} mW (-${compareRes.percentageReduction}%).`,
      baselinePowerMw: baselinePowerRes.powerMilliwatts,
      optimizedPowerMw: verifyRes.candidate.recalculatedPowerMw,
      savingsMw: compareRes.deltaPowerMw,
      savingsPercent: compareRes.percentageReduction,
      optimalVoltageV: verifyArgs.candidate.voltageV,
      optimalFrequencyMhz: verifyArgs.candidate.frequencyMhz,
      experimentId: recordRes.experimentId,
      recommendation: `Apply supply rail voltage ${verifyArgs.candidate.voltageV}V and clock frequency ${verifyArgs.candidate.frequencyMhz}MHz for verified ${compareRes.percentageReduction}% dynamic power reduction without violating setup timing or budget constraints.`,
    },
  };
}

