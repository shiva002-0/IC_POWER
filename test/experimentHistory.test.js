import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  saveExperiment,
  getExperiments,
  getExperimentById,
  deleteExperiment,
  clearExperiments,
} from '../src/utils/experimentStorage.js';

describe('Experiment History & Storage Architecture', () => {
  beforeEach(() => {
    clearExperiments();
  });

  test('saves and retrieves experiment records with generated ID and timestamps', () => {
    const record = {
      experimentName: 'DVFS Test Run 1',
      goal: 'Reduce dynamic power below 0.35 mW',
      baseline: { powerMilliwatts: 0.576 },
      candidate: { voltageV: 0.8, frequencyMhz: 80, powerMilliwatts: 0.2048 },
      comparison: { deltaPowerMw: 0.3712, percentageReduction: 64.44 },
      verification: { isVerified: true },
      tags: ['DVFS', 'Verified'],
    };

    const saved = saveExperiment(record);

    assert.ok(saved.id.startsWith('EXP-'));
    assert.ok(saved.timestamp > 0);
    assert.ok(saved.recordedAt);

    const all = getExperiments();
    assert.equal(all.length, 1);
    assert.equal(all[0].id, saved.id);
    assert.equal(all[0].experimentName, 'DVFS Test Run 1');
  });

  test('retrieves specific experiment by ID', () => {
    const exp1 = saveExperiment({ experimentName: 'Run A', verification: { isVerified: true } });
    const exp2 = saveExperiment({ experimentName: 'Run B', verification: { isVerified: true } });

    const found1 = getExperimentById(exp1.id);
    assert.ok(found1);
    assert.equal(found1.experimentName, 'Run A');

    const found2 = getExperimentById(exp2.id);
    assert.ok(found2);
    assert.equal(found2.experimentName, 'Run B');

    const notFound = getExperimentById('EXP-NON-EXISTENT');
    assert.equal(notFound, null);
  });

  test('deletes specific experiment by ID and updates registry count', () => {
    const exp1 = saveExperiment({ experimentName: 'To Keep', verification: { isVerified: true } });
    const exp2 = saveExperiment({ experimentName: 'To Delete', verification: { isVerified: true } });

    assert.equal(getExperiments().length, 2);

    const deleted = deleteExperiment(exp2.id);
    assert.equal(deleted, true);

    const remaining = getExperiments();
    assert.equal(remaining.length, 1);
    assert.equal(remaining[0].id, exp1.id);

    // Deleting again returns false
    const deleteAgain = deleteExperiment(exp2.id);
    assert.equal(deleteAgain, false);
  });

  test('clearExperiments removes all stored runs', () => {
    saveExperiment({ experimentName: 'Run 1', verification: { isVerified: true } });
    saveExperiment({ experimentName: 'Run 2', verification: { isVerified: true } });
    saveExperiment({ experimentName: 'Run 3', verification: { isVerified: true } });

    assert.equal(getExperiments().length, 3);

    clearExperiments();
    assert.equal(getExperiments().length, 0);
  });

  test('orders newest experiments first (LIFO order)', () => {
    const exp1 = saveExperiment({ experimentName: 'Oldest', timestamp: 1000, verification: { isVerified: true } });
    const exp2 = saveExperiment({ experimentName: 'Middle', timestamp: 2000, verification: { isVerified: true } });
    const exp3 = saveExperiment({ experimentName: 'Newest', timestamp: 3000, verification: { isVerified: true } });

    const list = getExperiments();
    assert.equal(list.length, 3);
    assert.equal(list[0].id, exp3.id);
    assert.equal(list[1].id, exp2.id);
    assert.equal(list[2].id, exp1.id);
  });

  test('rejects non-object experiment payload', () => {
    assert.throws(() => saveExperiment(null), /must be a valid object/);
    assert.throws(() => saveExperiment('not-an-object'), /must be a valid object/);
    assert.throws(() => saveExperiment(12345), /must be a valid object/);
  });

  test('user action: reopen experiment restores original baseline and candidate configuration', () => {
    const saved = saveExperiment({
      experimentName: 'DVFS Sign-Off Corner',
      goal: 'Lower power to 0.20 mW',
      baseline: {
        alpha: 0.20,
        effectiveCapacitancePf: 20,
        supplyVoltageV: 1.20,
        clockFrequencyMhz: 100,
        powerMilliwatts: 0.576,
      },
      candidate: {
        voltageV: 0.80,
        frequencyMhz: 80,
        powerMilliwatts: 0.2048,
      },
      comparison: {
        deltaPowerMw: 0.3712,
        percentageReduction: 64.44,
      },
      verification: {
        isVerified: true,
      },
    });

    const retrieved = getExperimentById(saved.id);
    assert.ok(retrieved);

    // Verify properties required by LowPowerOptimizationLab reopening hook
    assert.equal(retrieved.baseline.supplyVoltageV, 1.20);
    assert.equal(retrieved.baseline.clockFrequencyMhz, 100);
    assert.equal(retrieved.candidate.voltageV, 0.80);
    assert.equal(retrieved.candidate.frequencyMhz, 80);
  });

  test('user action: search and tag filtering filters registry records accurately', () => {
    saveExperiment({
      id: 'EXP-DVFS-001',
      experimentName: 'Aggressive DVFS',
      goal: 'Battery saving mode',
      tags: ['DVFS', 'Verified'],
      verification: { isVerified: true },
    });
    saveExperiment({
      id: 'EXP-ISO-002',
      experimentName: 'Iso-Performance Run',
      goal: 'Preserve 100MHz clock',
      tags: ['Voltage-Only'],
      verification: { isVerified: false },
    });

    const all = getExperiments();
    assert.equal(all.length, 2);

    // Simulate search query filter
    const matchesQuery = (exp, q) => {
      const lower = q.toLowerCase();
      return (
        exp.id.toLowerCase().includes(lower) ||
        exp.experimentName.toLowerCase().includes(lower) ||
        exp.goal.toLowerCase().includes(lower)
      );
    };

    assert.equal(all.filter((e) => matchesQuery(e, 'battery')).length, 1);
    assert.equal(all.filter((e) => matchesQuery(e, 'EXP-ISO')).length, 1);
    assert.equal(all.filter((e) => matchesQuery(e, 'non-existent')).length, 0);

    // Simulate tag filter
    const matchesTag = (exp, tag) => {
      if (tag === 'ALL') return true;
      if (tag === 'VERIFIED') return Boolean(exp.verification?.isVerified);
      if (tag === 'UNVERIFIED') return !exp.verification?.isVerified;
      return Array.isArray(exp.tags) && exp.tags.includes(tag);
    };

    assert.equal(all.filter((e) => matchesTag(e, 'VERIFIED')).length, 1);
    assert.equal(all.filter((e) => matchesTag(e, 'UNVERIFIED')).length, 1);
    assert.equal(all.filter((e) => matchesTag(e, 'DVFS')).length, 1);
  });

  test('safely saves experiment with missing optional fields without throwing', () => {
    const minimal = saveExperiment({
      experimentName: 'Minimal Test',
    });

    assert.ok(minimal.id);
    assert.ok(minimal.timestamp);
    assert.equal(minimal.experimentName, 'Minimal Test');

    const retrieved = getExperimentById(minimal.id);
    assert.ok(retrieved);
  });
});
