/**
 * Scenario Analysis & PPA Trade-Off Engine
 * CMOS Alpha-Power Delay model, Worst Negative Slack (WNS) timing closure,
 * and 2-Objective Pareto Frontier Dominance evaluation.
 */

import { calculateDynamicPower } from './powerCalculator.js';
import { toolCompareConfigurations } from './agentTools.js';

/**
 * Calculates Worst Negative Slack (WNS) using the CMOS Alpha-Power Delay model.
 * Delay equation: t_delay(V) = T_nom * (V_nom / V) * ((V - Vt) / (V_nom - Vt))^(-alpha)
 *
 * @param {number|string} voltageV - Supply rail voltage in Volts
 * @param {number|string} frequencyMhz - Clock frequency in MHz
 * @param {Object} [options] - Model calibration constants
 * @param {number} [options.vNom=1.20] - Nominal sign-off voltage in Volts
 * @param {number} [options.tNom=10.0] - Nominal propagation delay in nanoseconds (100 MHz target)
 * @param {number} [options.vt=0.35] - Threshold voltage in Volts (14nm typical)
 * @param {number} [options.alpha=1.3] - Velocity saturation exponent (alpha-power law)
 * @returns {{ delayNs: number, periodNs: number, wnsNs: number, isMet: boolean }}
 */
export function calculateTimingSlack(voltageV, frequencyMhz, options = {}) {
  const v = Number(voltageV);
  const f = Number(frequencyMhz);

  if (isNaN(v) || v <= 0 || isNaN(f) || f <= 0) {
    return { delayNs: 0, periodNs: 0, wnsNs: 0, isMet: false };
  }

  const vNom = options.vNom ?? 1.20;
  const tNom = options.tNom ?? 10.0;
  const vt = options.vt ?? 0.35;
  const alpha = options.alpha ?? 1.3;

  let delayNs = tNom;
  if (v > vt) {
    const vFactor = vNom / v;
    const overdriveFactor = Math.pow((v - vt) / (vNom - vt), -alpha);
    delayNs = tNom * vFactor * overdriveFactor;
  } else {
    // Near or subthreshold operating condition: severe delay explosion / stall
    delayNs = 999.0;
  }

  const periodNs = 1000.0 / f;
  const wnsNs = periodNs - delayNs;
  const isMet = wnsNs >= -0.001; // Epsilon tolerance for floating-point comparisons

  return {
    delayNs: Math.round(delayNs * 100) / 100,
    periodNs: Math.round(periodNs * 100) / 100,
    wnsNs: Math.round(wnsNs * 100) / 100,
    isMet,
  };
}

/**
 * Computes Pareto Dominance across a collection of scenarios for 2 objectives:
 * Objective 1: Minimize Dynamic Power (mW)
 * Objective 2: Maximize Clock Frequency (MHz)
 *
 * @param {Array<Object>} scenarioList
 * @returns {Array<Object>} scenarios enriched with paretoStatus and isParetoOptimal
 */
export function evaluateParetoFrontier(scenarioList) {
  if (!Array.isArray(scenarioList) || scenarioList.length === 0) {
    return [];
  }

  return scenarioList.map((cand, idx, all) => {
    // If timing is violated or invalid, candidate cannot reside on the viable Pareto frontier
    if (!cand || !cand.timing || !cand.timing.isMet) {
      return {
        ...cand,
        paretoStatus: 'TIMING_VIOLATED',
        isParetoOptimal: false,
      };
    }

    const candPower = Number(cand.powerMw ?? cand.powerMilliwatts ?? 0);
    const candFreq = Number(cand.frequencyMhz ?? cand.clockFrequencyMhz ?? 0);

    // Dominated if there exists another candidate with:
    // (P_other <= P_cand AND f_other >= f_cand) with at least one strict inequality
    const isDominated = all.some((other, oIdx) => {
      if (oIdx === idx || !other || !other.timing || !other.timing.isMet) {
        return false;
      }
      const otherPower = Number(other.powerMw ?? other.powerMilliwatts ?? 0);
      const otherFreq = Number(other.frequencyMhz ?? other.clockFrequencyMhz ?? 0);

      const betterOrEqualPower = otherPower <= candPower + 1e-5;
      const betterOrEqualFreq = otherFreq >= candFreq - 1e-5;
      const strictlyBetterPower = otherPower < candPower - 1e-5;
      const strictlyBetterFreq = otherFreq > candFreq + 1e-5;

      return betterOrEqualPower && betterOrEqualFreq && (strictlyBetterPower || strictlyBetterFreq);
    });

    return {
      ...cand,
      paretoStatus: isDominated ? 'DOMINATED' : 'PARETO_OPTIMAL',
      isParetoOptimal: !isDominated,
    };
  });
}

/**
 * Builds and evaluates scenarios against a baseline circuit configuration.
 * Uses exact physical calculations (zero fabricated numbers).
 *
 * @param {Object} baselineConfig - { alpha, effectiveCapacitancePf, supplyVoltageV, clockFrequencyMhz }
 * @param {Array<Object>} scenarioList - Raw scenario configurations to evaluate
 * @returns {Array<Object>} Evaluated scenarios with power, deltas, energy, timing, and Pareto rankings
 */
export function buildEvaluatedScenarios(baselineConfig, scenarioList) {
  if (!baselineConfig || !Array.isArray(scenarioList)) {
    return [];
  }

  const alpha = Number(baselineConfig.alpha ?? 0.20);
  const capPf = Number(baselineConfig.effectiveCapacitancePf ?? 20);
  const baseV = Number(baselineConfig.supplyVoltageV ?? 1.20);
  const baseF = Number(baselineConfig.clockFrequencyMhz ?? 100);

  const baselinePowerRes = calculateDynamicPower({
    alpha,
    effectiveCapacitancePf: capPf,
    supplyVoltageV: baseV,
    clockFrequencyMhz: baseF,
  });

  const populated = scenarioList.map((scen) => {
    const v = Number(scen.voltageV ?? scen.supplyVoltageV ?? baseV);
    const f = Number(scen.frequencyMhz ?? scen.clockFrequencyMhz ?? baseF);

    const pRes = calculateDynamicPower({
      alpha,
      effectiveCapacitancePf: capPf,
      supplyVoltageV: v,
      clockFrequencyMhz: f,
    });

    const comparison = toolCompareConfigurations({
      baseline: {
        powerMilliwatts: baselinePowerRes.milliwatts,
        supplyVoltageV: baseV,
        clockFrequencyMhz: baseF,
      },
      candidate: {
        powerMilliwatts: pRes.milliwatts,
        voltageV: v,
        frequencyMhz: f,
      },
    });

    // Energy per cycle: E = P_dyn / f = alpha * C * V^2 (in picojoules)
    const energyPj = alpha * (capPf * 1e-12) * Math.pow(v, 2) * 1e12;
    const timing = calculateTimingSlack(v, f);

    const powerMw = Math.round(pRes.milliwatts * 1e6) / 1e6;
    return {
      ...scen,
      voltageV: v,
      frequencyMhz: f,
      powerMw,
      powerMilliwatts: powerMw,
      powerWatts: pRes.watts,
      watts: pRes.watts,
      comparison,
      energyPj: Math.round(energyPj * 100) / 100,
      timing,
    };
  });

  return evaluateParetoFrontier(populated);
}
