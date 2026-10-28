/**
 * Semiconductor Digital IC Power Calculator Utility
 * Implements standard CMOS Dynamic Power Estimation:
 *   P_dynamic = alpha * C_eff * V_dd^2 * f_clk
 *
 * Handles exact physical unit conversions:
 *   - Effective Capacitance: pF (picofarads) -> F (farads) = pF * 10^-12
 *   - Clock Frequency: MHz (megahertz) -> Hz (hertz) = MHz * 10^6
 */

/**
 * Converts picofarads (pF) to farads (F).
 * 1 pF = 1e-12 Farads
 * @param {number} pF
 * @returns {number} Farads
 */
export function convertCapacitanceToFarads(pF) {
  if (typeof pF !== 'number' || isNaN(pF)) {
    throw new TypeError('Capacitance must be a valid number.');
  }
  return pF * 1e-12;
}

/**
 * Converts megahertz (MHz) to hertz (Hz).
 * 1 MHz = 1e6 Hz
 * @param {number} mHz
 * @returns {number} Hertz
 */
export function convertFrequencyToHz(mHz) {
  if (typeof mHz !== 'number' || isNaN(mHz)) {
    throw new TypeError('Frequency must be a valid number.');
  }
  return mHz * 1e6;
}

/**
 * Validates the raw inputs for dynamic power calculation.
 * Returns an object with { isValid: boolean, errors: Record<string, string> }.
 *
 * Rules:
 * - alpha: required, must be a number, 0 <= alpha <= 1
 * - capacitance: required, must be a number > 0
 * - voltage: required, must be a number > 0
 * - frequency: required, must be a number > 0
 *
 * @param {Object} inputs
 * @param {string|number} inputs.alpha
 * @param {string|number} inputs.effectiveCapacitancePf
 * @param {string|number} inputs.supplyVoltageV
 * @param {string|number} inputs.clockFrequencyMhz
 * @returns {{ isValid: boolean, errors: Record<string, string> }}
 */
export function validatePowerInputs({
  alpha,
  effectiveCapacitancePf,
  supplyVoltageV,
  clockFrequencyMhz,
}) {
  const errors = {};

  // 1. Validate Alpha (Switching Activity Factor)
  if (alpha === '' || alpha === null || alpha === undefined) {
    errors.alpha = 'Switching activity factor (α) is required.';
  } else {
    const numAlpha = Number(alpha);
    if (isNaN(numAlpha)) {
      errors.alpha = 'Switching activity factor (α) must be a valid number.';
    } else if (numAlpha < 0 || numAlpha > 1) {
      errors.alpha = 'Switching activity factor (α) must be between 0.0 and 1.0.';
    }
  }

  // 2. Validate Effective Capacitance (pF)
  if (
    effectiveCapacitancePf === '' ||
    effectiveCapacitancePf === null ||
    effectiveCapacitancePf === undefined
  ) {
    errors.effectiveCapacitancePf = 'Effective capacitance is required.';
  } else {
    const numCap = Number(effectiveCapacitancePf);
    if (isNaN(numCap)) {
      errors.effectiveCapacitancePf = 'Effective capacitance must be a valid number.';
    } else if (numCap <= 0) {
      errors.effectiveCapacitancePf = 'Effective capacitance must be greater than 0 pF.';
    }
  }

  // 3. Validate Supply Voltage (V)
  if (
    supplyVoltageV === '' ||
    supplyVoltageV === null ||
    supplyVoltageV === undefined
  ) {
    errors.supplyVoltageV = 'Supply voltage is required.';
  } else {
    const numVolt = Number(supplyVoltageV);
    if (isNaN(numVolt)) {
      errors.supplyVoltageV = 'Supply voltage must be a valid number.';
    } else if (numVolt <= 0) {
      errors.supplyVoltageV = 'Supply voltage must be greater than 0 V.';
    }
  }

  // 4. Validate Clock Frequency (MHz)
  if (
    clockFrequencyMhz === '' ||
    clockFrequencyMhz === null ||
    clockFrequencyMhz === undefined
  ) {
    errors.clockFrequencyMhz = 'Clock frequency is required.';
  } else {
    const numFreq = Number(clockFrequencyMhz);
    if (isNaN(numFreq)) {
      errors.clockFrequencyMhz = 'Clock frequency must be a valid number.';
    } else if (numFreq <= 0) {
      errors.clockFrequencyMhz = 'Clock frequency must be greater than 0 MHz.';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Calculates CMOS Dynamic Power Dissipation:
 *   P_dynamic = alpha * C_eff * V_dd^2 * f_clk
 *
 * @param {Object} inputs
 * @param {number|string} inputs.alpha - Switching activity (0 to 1)
 * @param {number|string} inputs.effectiveCapacitancePf - Capacitance in pF
 * @param {number|string} inputs.supplyVoltageV - Voltage in Volts
 * @param {number|string} inputs.clockFrequencyMhz - Frequency in MHz
 * @returns {{
 *   watts: number,
 *   milliwatts: number,
 *   microWatts: number,
 *   capacitanceFarads: number,
 *   frequencyHz: number,
 *   voltageSquared: number
 * }}
 */
export function calculateDynamicPower({
  alpha,
  effectiveCapacitancePf,
  supplyVoltageV,
  clockFrequencyMhz,
}) {
  const validation = validatePowerInputs({
    alpha,
    effectiveCapacitancePf,
    supplyVoltageV,
    clockFrequencyMhz,
  });

  if (!validation.isValid) {
    const firstErrorMessage = Object.values(validation.errors)[0];
    const err = new Error(firstErrorMessage);
    err.validationErrors = validation.errors;
    throw err;
  }

  const numAlpha = Number(alpha);
  const numCapPf = Number(effectiveCapacitancePf);
  const numVolt = Number(supplyVoltageV);
  const numFreqMhz = Number(clockFrequencyMhz);

  // Unit conversions
  const capacitanceFarads = convertCapacitanceToFarads(numCapPf);
  const frequencyHz = convertFrequencyToHz(numFreqMhz);
  const voltageSquared = numVolt * numVolt;

  // P_dynamic = alpha * C_farads * V^2 * f_hz
  const watts = numAlpha * capacitanceFarads * voltageSquared * frequencyHz;
  const milliwatts = watts * 1000;
  const microWatts = watts * 1e6;

  return {
    watts,
    milliwatts,
    microWatts,
    powerWatts: watts,
    powerMilliwatts: milliwatts,
    powerMicroWatts: microWatts,
    capacitanceFarads,
    frequencyHz,
    voltageSquared,
  };
}
