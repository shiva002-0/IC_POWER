import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  convertCapacitanceToFarads,
  convertFrequencyToHz,
  validatePowerInputs,
  calculateDynamicPower,
} from '../src/utils/powerCalculator.js';

describe('Digital IC Dynamic Power Calculator - Unit Conversion Tests', () => {
  test('convertCapacitanceToFarads converts pF to Farads correctly (pF * 1e-12)', () => {
    assert.equal(convertCapacitanceToFarads(20), 20e-12);
    assert.equal(convertCapacitanceToFarads(1), 1e-12);
    assert.equal(convertCapacitanceToFarads(1000), 1e-9);
  });

  test('convertCapacitanceToFarads throws TypeError on non-numeric input', () => {
    assert.throws(() => convertCapacitanceToFarads('20'), TypeError);
    assert.throws(() => convertCapacitanceToFarads(NaN), TypeError);
  });

  test('convertFrequencyToHz converts MHz to Hz correctly (MHz * 1e6)', () => {
    assert.equal(convertFrequencyToHz(100), 100e6);
    assert.equal(convertFrequencyToHz(1), 1e6);
    assert.equal(convertFrequencyToHz(2500), 2.5e9);
  });

  test('convertFrequencyToHz throws TypeError on non-numeric input', () => {
    assert.throws(() => convertFrequencyToHz('100'), TypeError);
    assert.throws(() => convertFrequencyToHz(NaN), TypeError);
  });
});

describe('Digital IC Dynamic Power Calculator - Core Calculation Tests', () => {
  test('Requirement 7 Test Case: alpha=0.20, C=20pF, Vdd=1.2V, f=100MHz produces exactly 0.000576 W and 0.576 mW', () => {
    const result = calculateDynamicPower({
      alpha: 0.2,
      effectiveCapacitancePf: 20,
      supplyVoltageV: 1.2,
      clockFrequencyMhz: 100,
    });

    // P = 0.20 * (20 * 1e-12) * (1.2)^2 * (100 * 1e6)
    // P = 0.20 * 2e-11 * 1.44 * 1e8 = 5.76e-4 = 0.000576 W
    const expectedWatts = 0.000576;
    const expectedMilliwatts = 0.576;
    const expectedMicrowatts = 576;

    assert.ok(
      Math.abs(result.watts - expectedWatts) < 1e-10,
      `Expected watts to be ~${expectedWatts}, got ${result.watts}`
    );
    assert.ok(
      Math.abs(result.milliwatts - expectedMilliwatts) < 1e-7,
      `Expected milliwatts to be ~${expectedMilliwatts}, got ${result.milliwatts}`
    );
    assert.ok(
      Math.abs(result.microWatts - expectedMicrowatts) < 1e-5,
      `Expected microwatts to be ~${expectedMicrowatts}, got ${result.microWatts}`
    );
  });

  test('Accepts numeric strings cleanly (e.g. from text input fields)', () => {
    const result = calculateDynamicPower({
      alpha: '0.20',
      effectiveCapacitancePf: '20',
      supplyVoltageV: '1.2',
      clockFrequencyMhz: '100',
    });

    assert.ok(Math.abs(result.milliwatts - 0.576) < 1e-7);
    assert.ok(Math.abs(result.watts - 0.000576) < 1e-10);
  });

  test('Alpha = 0 (quiescent logic with zero switching) yields exactly 0 W dynamic power', () => {
    const result = calculateDynamicPower({
      alpha: 0,
      effectiveCapacitancePf: 50,
      supplyVoltageV: 1.0,
      clockFrequencyMhz: 200,
    });

    assert.equal(result.watts, 0);
    assert.equal(result.milliwatts, 0);
  });

  test('Alpha = 1.0 (maximum continuous clock-tree toggling) calculates correctly', () => {
    const result = calculateDynamicPower({
      alpha: 1.0,
      effectiveCapacitancePf: 10,
      supplyVoltageV: 1.0,
      clockFrequencyMhz: 1000,
    });

    // 1.0 * (10 * 1e-12) * (1.0)^2 * (1000 * 1e6) = 1e-11 * 1e9 = 0.01 W = 10 mW
    assert.ok(Math.abs(result.watts - 0.01) < 1e-10);
    assert.ok(Math.abs(result.milliwatts - 10) < 1e-7);
  });
});

describe('Digital IC Dynamic Power Calculator - Input Validation Tests', () => {
  test('Flags missing / empty values with clear descriptive errors', () => {
    const validation = validatePowerInputs({
      alpha: '',
      effectiveCapacitancePf: '',
      supplyVoltageV: '',
      clockFrequencyMhz: '',
    });

    assert.equal(validation.isValid, false);
    assert.ok(validation.errors.alpha.includes('Switching activity factor'));
    assert.ok(validation.errors.effectiveCapacitancePf.includes('Effective capacitance'));
    assert.ok(validation.errors.supplyVoltageV.includes('Supply voltage'));
    assert.ok(validation.errors.clockFrequencyMhz.includes('Clock frequency'));
  });

  test('Rejects alpha < 0 (negative switching activity)', () => {
    const validation = validatePowerInputs({
      alpha: -0.1,
      effectiveCapacitancePf: 20,
      supplyVoltageV: 1.2,
      clockFrequencyMhz: 100,
    });

    assert.equal(validation.isValid, false);
    assert.ok(validation.errors.alpha.includes('between 0.0 and 1.0'));
  });

  test('Rejects alpha > 1 (switching activity exceeding 1.0)', () => {
    const validation = validatePowerInputs({
      alpha: 1.25,
      effectiveCapacitancePf: 20,
      supplyVoltageV: 1.2,
      clockFrequencyMhz: 100,
    });

    assert.equal(validation.isValid, false);
    assert.ok(validation.errors.alpha.includes('between 0.0 and 1.0'));
  });

  test('Rejects non-numeric strings (NaN)', () => {
    const validation = validatePowerInputs({
      alpha: 'invalid',
      effectiveCapacitancePf: 'xyz',
      supplyVoltageV: 'voltage',
      clockFrequencyMhz: 'freq',
    });

    assert.equal(validation.isValid, false);
    assert.ok(validation.errors.alpha.includes('valid number'));
    assert.ok(validation.errors.effectiveCapacitancePf.includes('valid number'));
    assert.ok(validation.errors.supplyVoltageV.includes('valid number'));
    assert.ok(validation.errors.clockFrequencyMhz.includes('valid number'));
  });

  test('Rejects zero or negative capacitance', () => {
    const zeroCap = validatePowerInputs({
      alpha: 0.2,
      effectiveCapacitancePf: 0,
      supplyVoltageV: 1.2,
      clockFrequencyMhz: 100,
    });
    assert.equal(zeroCap.isValid, false);
    assert.ok(zeroCap.errors.effectiveCapacitancePf.includes('greater than 0 pF'));

    const negCap = validatePowerInputs({
      alpha: 0.2,
      effectiveCapacitancePf: -15,
      supplyVoltageV: 1.2,
      clockFrequencyMhz: 100,
    });
    assert.equal(negCap.isValid, false);
    assert.ok(negCap.errors.effectiveCapacitancePf.includes('greater than 0 pF'));
  });

  test('Rejects zero or negative supply voltage', () => {
    const zeroVolt = validatePowerInputs({
      alpha: 0.2,
      effectiveCapacitancePf: 20,
      supplyVoltageV: 0,
      clockFrequencyMhz: 100,
    });
    assert.equal(zeroVolt.isValid, false);
    assert.ok(zeroVolt.errors.supplyVoltageV.includes('greater than 0 V'));

    const negVolt = validatePowerInputs({
      alpha: 0.2,
      effectiveCapacitancePf: 20,
      supplyVoltageV: -1.2,
      clockFrequencyMhz: 100,
    });
    assert.equal(negVolt.isValid, false);
    assert.ok(negVolt.errors.supplyVoltageV.includes('greater than 0 V'));
  });

  test('Rejects zero or negative clock frequency', () => {
    const zeroFreq = validatePowerInputs({
      alpha: 0.2,
      effectiveCapacitancePf: 20,
      supplyVoltageV: 1.2,
      clockFrequencyMhz: 0,
    });
    assert.equal(zeroFreq.isValid, false);
    assert.ok(zeroFreq.errors.clockFrequencyMhz.includes('greater than 0 MHz'));

    const negFreq = validatePowerInputs({
      alpha: 0.2,
      effectiveCapacitancePf: 20,
      supplyVoltageV: 1.2,
      clockFrequencyMhz: -100,
    });
    assert.equal(negFreq.isValid, false);
    assert.ok(negFreq.errors.clockFrequencyMhz.includes('greater than 0 MHz'));
  });

  test('calculateDynamicPower throws with validationErrors attached rather than silently substituting defaults', () => {
    assert.throws(
      () =>
        calculateDynamicPower({
          alpha: -0.5,
          effectiveCapacitancePf: 0,
          supplyVoltageV: -1,
          clockFrequencyMhz: 'bad',
        }),
      (err) => {
        assert.ok(err.validationErrors !== undefined);
        assert.ok(err.validationErrors.alpha !== undefined);
        return true;
      }
    );
  });
});
