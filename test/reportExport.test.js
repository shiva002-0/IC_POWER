import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  escapeCsvField,
  generateExperimentCsv,
  generateRegistryCsv,
  downloadCsvFile,
  triggerPrintReport,
} from '../src/utils/reportExport.js';

describe('Report Export Utility - CSV Formatting', () => {
  test('escapeCsvField escapes quotes, commas, and newlines per RFC 4180', () => {
    assert.equal(escapeCsvField('simple'), 'simple');
    assert.equal(escapeCsvField(null), '');
    assert.equal(escapeCsvField(undefined), '');
    assert.equal(escapeCsvField(123), '123');

    // Commas
    assert.equal(escapeCsvField('alpha, beta'), '"alpha, beta"');

    // Double quotes
    assert.equal(escapeCsvField('say "hello"'), '"say ""hello"""');

    // Newlines
    assert.equal(escapeCsvField("line1\nline2"), '"line1\nline2"');
  });

  test('generateExperimentCsv generates complete RFC 4180 CSV for verified experiment', () => {
    const mockExp = {
      id: 'EXP-20261028-TEST',
      experimentName: 'DVFS Power Reduction Test',
      timestamp: 1730000000000,
      recordedAt: '2026-10-28T00:00:00.000Z',
      goal: 'Reduce dynamic power below 0.35 mW for a 20 pF block with at least 80 MHz clock.',
      baseline: {
        alpha: 0.20,
        effectiveCapacitancePf: 20,
        supplyVoltageV: 1.2,
        clockFrequencyMhz: 100,
        powerMilliwatts: 0.576,
      },
      candidate: {
        voltageV: 0.8,
        frequencyMhz: 80,
        powerMilliwatts: 0.2048,
      },
      comparison: {
        deltaPowerMw: 0.3712,
        percentageReduction: 64.44,
        deltaVoltageV: -0.4,
        deltaFrequencyMhz: -20,
      },
      verification: {
        isVerified: true,
        verificationStatement: 'All physical design constraints passed.',
        violations: [],
      },
      tags: ['DVFS', 'Verified', '0.8V', '80MHz'],
    };

    const csv = generateExperimentCsv(mockExp);

    assert.ok(typeof csv === 'string');
    assert.ok(csv.includes('Experiment ID,Experiment Title'));
    assert.ok(csv.includes('EXP-20261028-TEST'));
    assert.ok(csv.includes('0.5760'));
    assert.ok(csv.includes('0.2048'));
    assert.ok(csv.includes('64.44'));
    assert.ok(csv.includes('VERIFIED_PASSED'));
    assert.ok(csv.includes('DVFS; Verified; 0.8V; 80MHz'));
  });

  test('generateExperimentCsv safely handles missing or partial fields without throwing', () => {
    const partialExp = {
      id: 'EXP-PARTIAL-01',
      experimentName: 'Minimal Test',
    };

    const csv = generateExperimentCsv(partialExp);

    assert.ok(csv.includes('EXP-PARTIAL-01'));
    assert.ok(csv.includes('Minimal Test'));
    assert.ok(csv.includes('N/A'));
    assert.ok(csv.includes('UNVERIFIED_OR_FAILED'));
  });

  test('generateExperimentCsv throws TypeError on invalid argument', () => {
    assert.throws(() => generateExperimentCsv(null), /must be a valid object/);
    assert.throws(() => generateExperimentCsv('string'), /must be a valid object/);
  });

  test('generateRegistryCsv generates multi-row CSV for all experiments', () => {
    const expList = [
      {
        id: 'EXP-1',
        experimentName: 'Run 1',
        baseline: { alpha: 0.2, effectiveCapacitancePf: 20, supplyVoltageV: 1.2, clockFrequencyMhz: 100, powerMilliwatts: 0.576 },
        candidate: { voltageV: 0.8, frequencyMhz: 80, powerMilliwatts: 0.2048 },
        comparison: { deltaPowerMw: 0.3712, percentageReduction: 64.44 },
        verification: { isVerified: true },
        tags: ['Verified'],
      },
      {
        id: 'EXP-2',
        experimentName: 'Run 2',
        baseline: { alpha: 0.2, effectiveCapacitancePf: 20, supplyVoltageV: 1.2, clockFrequencyMhz: 100, powerMilliwatts: 0.576 },
        candidate: { voltageV: 0.9, frequencyMhz: 100, powerMilliwatts: 0.324 },
        comparison: { deltaPowerMw: 0.252, percentageReduction: 43.75 },
        verification: { isVerified: true },
        tags: ['Voltage-Only'],
      },
    ];

    const csv = generateRegistryCsv(expList);

    assert.ok(csv.includes('Experiment ID,Experiment Title'));
    assert.ok(csv.includes('EXP-1,Run 1'));
    assert.ok(csv.includes('EXP-2,Run 2'));
    assert.ok(csv.includes('64.44'));
    assert.ok(csv.includes('43.75'));
  });

  test('generateRegistryCsv throws TypeError on non-array argument', () => {
    assert.throws(() => generateRegistryCsv(null), /must be an array/);
  });

  test('downloadCsvFile and triggerPrintReport execute safely in non-browser environment', () => {
    assert.equal(downloadCsvFile('test', 'test.csv'), false);
    assert.equal(triggerPrintReport(), false);
  });
});
