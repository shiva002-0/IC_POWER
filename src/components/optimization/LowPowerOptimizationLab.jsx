import React, { useState, useMemo, useEffect } from 'react';
import {
  Sliders,
  CheckCircle2,
  AlertTriangle,
  TrendingDown,
  Scale,
  Cpu,
  Info,
  Filter,
  Database,
} from 'lucide-react';
import {
  runOptimizationEngine,
  validateOptimizationConfig,
  OPTIMIZATION_OBJECTIVES,
} from '../../utils/optimizationEngine.js';
import { saveExperiment } from '../../utils/experimentStorage.js';
import StatusBadge from '../common/StatusBadge.jsx';
import AgenticAssistantPanel from './AgenticAssistantPanel.jsx';

/**
 * LowPowerOptimizationLab Component
 * Deterministic low-power search engine with user-defined constraints,
 * dual objectives, candidate ranking, and transparent constraint verification.
 */
export default function LowPowerOptimizationLab({ onNavigate, loadedExperiment, onClearLoadedExperiment }) {
  // Baseline design parameters
  const [baseline, setBaseline] = useState({
    alpha: '0.20',
    effectiveCapacitancePf: '20',
    supplyVoltageV: '1.2',
    clockFrequencyMhz: '100',
  });

  // Constraints & search space
  const [constraints, setConstraints] = useState({
    maxPowerMw: '0.400',
    minFrequencyMhz: '80',
    maxFrequencySearchMhz: '100',
    minVoltageV: '0.8',
    maxVoltageV: '1.2',
    voltageStepV: '0.1',
    frequencyStepMhz: '10',
  });

  // Allowed optimization knobs
  const [tunableParameters, setTunableParameters] = useState({
    voltage: true,
    frequency: true,
  });

  // Active objective
  const [objective, setObjective] = useState(OPTIMIZATION_OBJECTIVES.MINIMIZE_POWER);

  // Table filter toggle (all vs feasible only)
  const [showAllCandidates, setShowAllCandidates] = useState(false);

  // Persistent registry save state
  const [savedRunId, setSavedRunId] = useState(null);

  // Input change helpers
  const handleBaselineChange = (field, value) => {
    setBaseline((prev) => ({ ...prev, [field]: value }));
    setSavedRunId(null);
  };

  const handleConstraintChange = (field, value) => {
    setConstraints((prev) => ({ ...prev, [field]: value }));
    setSavedRunId(null);
  };

  const handleTunableToggle = (field) => {
    setTunableParameters((prev) => ({ ...prev, [field]: !prev[field] }));
    setSavedRunId(null);
  };

  const handleSetObjective = (newObjective) => {
    setObjective(newObjective);
    setSavedRunId(null);
  };

  // Quick Preset Handlers
  const loadPreset = (presetName) => {
    setSavedRunId(null);
    if (presetName === 'aggressive') {
      setBaseline({ alpha: '0.20', effectiveCapacitancePf: '20', supplyVoltageV: '1.2', clockFrequencyMhz: '100' });
      setConstraints({
        maxPowerMw: '0.400',
        minFrequencyMhz: '80',
        maxFrequencySearchMhz: '100',
        minVoltageV: '0.8',
        maxVoltageV: '1.2',
        voltageStepV: '0.05',
        frequencyStepMhz: '10',
      });
      setTunableParameters({ voltage: true, frequency: true });
      setObjective(OPTIMIZATION_OBJECTIVES.MINIMIZE_POWER);
    } else if (presetName === 'powerBudget') {
      setBaseline({ alpha: '0.20', effectiveCapacitancePf: '20', supplyVoltageV: '1.2', clockFrequencyMhz: '100' });
      setConstraints({
        maxPowerMw: '0.350',
        minFrequencyMhz: '80',
        maxFrequencySearchMhz: '100',
        minVoltageV: '0.8',
        maxVoltageV: '1.2',
        voltageStepV: '0.1',
        frequencyStepMhz: '10',
      });
      setTunableParameters({ voltage: true, frequency: true });
      setObjective(OPTIMIZATION_OBJECTIVES.MEET_POWER_BUDGET);
    } else if (presetName === 'unfeasible') {
      // Demonstrates honest constraint failure handling
      setBaseline({ alpha: '0.20', effectiveCapacitancePf: '20', supplyVoltageV: '1.2', clockFrequencyMhz: '100' });
      setConstraints({
        maxPowerMw: '0.100', // Impossible: Lowest power @ 0.8V, 90MHz is 0.2304 mW
        minFrequencyMhz: '90',
        maxFrequencySearchMhz: '100',
        minVoltageV: '0.8',
        maxVoltageV: '1.2',
        voltageStepV: '0.1',
        frequencyStepMhz: '10',
      });
      setTunableParameters({ voltage: true, frequency: true });
      setObjective(OPTIMIZATION_OBJECTIVES.MINIMIZE_POWER);
    } else if (presetName === 'voltageOnly') {
      setBaseline({ alpha: '0.20', effectiveCapacitancePf: '20', supplyVoltageV: '1.2', clockFrequencyMhz: '100' });
      setConstraints({
        maxPowerMw: '0.500',
        minFrequencyMhz: '100',
        maxFrequencySearchMhz: '100',
        minVoltageV: '0.9',
        maxVoltageV: '1.2',
        voltageStepV: '0.05',
        frequencyStepMhz: '10',
      });
      setTunableParameters({ voltage: true, frequency: false });
      setObjective(OPTIMIZATION_OBJECTIVES.MINIMIZE_POWER);
    }
  };

  // Run validation
  const config = useMemo(() => ({
    baseline,
    constraints,
    tunableParameters,
    objective,
  }), [baseline, constraints, tunableParameters, objective]);

  const validation = useMemo(() => validateOptimizationConfig(config), [config]);

  // Run engine deterministically when valid
  const optimizationResult = useMemo(() => {
    if (!validation.isValid) return null;
    try {
      return runOptimizationEngine(config);
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, [config, validation.isValid]);

  const handleApplyAgentCandidate = (cand) => {
    if (!cand) return;
    if (cand.voltageV !== undefined) {
      setBaseline((prev) => ({ ...prev, supplyVoltageV: String(cand.voltageV) }));
    }
    if (cand.frequencyMhz !== undefined) {
      setBaseline((prev) => ({ ...prev, clockFrequencyMhz: String(cand.frequencyMhz) }));
    }
    setSavedRunId(null);
  };

  const handleSaveRunToRegistry = () => {
    if (!optimizationResult || !optimizationResult.bestCandidate) return;
    const cand = optimizationResult.bestCandidate;
    const saved = saveExperiment({
      experimentName: `Deterministic Search (${cand.voltageV.toFixed(2)}V @ ${cand.frequencyMhz}MHz)`,
      goal:
        objective === OPTIMIZATION_OBJECTIVES.MEET_POWER_BUDGET
          ? `Meet power budget <= ${constraints.maxPowerMw} mW and maximize frequency`
          : `Minimize dynamic power within [${constraints.minVoltageV}V - ${constraints.maxVoltageV}V]`,
      baseline: {
        alpha: Number(baseline.alpha),
        effectiveCapacitancePf: Number(baseline.effectiveCapacitancePf),
        supplyVoltageV: Number(baseline.supplyVoltageV),
        clockFrequencyMhz: Number(baseline.clockFrequencyMhz),
        powerMilliwatts: optimizationResult.baseline.powerMilliwatts,
      },
      candidate: {
        voltageV: cand.voltageV,
        frequencyMhz: cand.frequencyMhz,
        powerMilliwatts: cand.powerMilliwatts,
      },
      comparison: {
        deltaPowerMw: cand.deltaPowerMw,
        percentageReduction: cand.percentageReduction,
        deltaVoltageV: cand.deltaVoltageV,
        deltaFrequencyMhz: cand.deltaFrequencyMhz,
      },
      verification: {
        isVerified: true,
        verificationStatement: `Verified by deterministic engine: ${cand.powerMilliwatts.toFixed(3)} mW <= ${constraints.maxPowerMw} mW budget, f >= ${constraints.minFrequencyMhz} MHz.`,
        violations: [],
      },
      tags: ['Deterministic', 'Lab-Run', 'Verified'],
    });
    setSavedRunId(saved.id);
  };

  // Reopen experiment parameters from registry
  useEffect(() => {
    if (loadedExperiment) {
      if (loadedExperiment.baseline) {
        setBaseline({
          alpha: String(loadedExperiment.baseline.alpha ?? '0.20'),
          effectiveCapacitancePf: String(loadedExperiment.baseline.effectiveCapacitancePf ?? '20'),
          supplyVoltageV: String(loadedExperiment.baseline.supplyVoltageV ?? '1.2'),
          clockFrequencyMhz: String(loadedExperiment.baseline.clockFrequencyMhz ?? '100'),
        });
      }
      if (loadedExperiment.candidate) {
        const candV = loadedExperiment.candidate.voltageV || loadedExperiment.candidate.supplyVoltageV;
        const candF = loadedExperiment.candidate.frequencyMhz || loadedExperiment.candidate.clockFrequencyMhz;
        if (candV && candF) {
          setConstraints((prev) => ({
            ...prev,
            minVoltageV: String(Math.min(Number(candV), Number(prev.minVoltageV))),
            maxVoltageV: String(Math.max(Number(candV), Number(prev.maxVoltageV))),
            minFrequencyMhz: String(Math.min(Number(candF), Number(prev.minFrequencyMhz))),
          }));
        }
      }
    }
  }, [loadedExperiment]);

  return (
    <div className="space-y-6">
      {/* Reopened Experiment Notice Banner */}
      {loadedExperiment && (
        <div className="p-4 rounded-xl bg-cyan-50/90 border border-cyan-300 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-600 text-white shadow-2xs">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-mono text-cyan-800 font-bold uppercase tracking-wider block">
                Active Reopened Experiment: {loadedExperiment.id}
              </span>
              <p className="text-xs font-semibold text-slate-900">
                "{loadedExperiment.experimentName || 'Registry Run'}" &mdash; Baseline and parameters restored to the optimization workspace.
              </p>
            </div>
          </div>
          {onClearLoadedExperiment && (
            <button
              onClick={onClearLoadedExperiment}
              className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-cyan-200 text-cyan-800 font-mono text-xs font-semibold cursor-pointer shadow-2xs transition-colors shrink-0"
            >
              Clear Reopened State
            </button>
          )}
        </div>
      )}

      {/* 0. Autonomous Agentic AI Layer */}
      <AgenticAssistantPanel
        baseline={baseline}
        constraints={constraints}
        onApplyCandidate={handleApplyAgentCandidate}
      />

      {/* Top Controls Card: Objectives & Presets */}
      <div className="ic-card p-5 bg-white border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-50 border border-cyan-200 text-cyan-600 shadow-2xs">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Deterministic Low-Power Optimization Engine
              </h2>
              <p className="text-xs text-slate-500 font-mono">
                Exhaustive Bounded Candidate Search with Physical Constraint Enforcement
              </p>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => loadPreset('aggressive')}
              className="px-2.5 py-1.5 rounded-md bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border border-cyan-200 text-[11px] font-mono font-semibold transition-colors cursor-pointer shadow-2xs"
            >
              Balanced DVFS
            </button>
            <button
              onClick={() => loadPreset('powerBudget')}
              className="px-2.5 py-1.5 rounded-md bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-mono transition-colors cursor-pointer"
            >
              Strict Budget (0.35 mW)
            </button>
            <button
              onClick={() => loadPreset('voltageOnly')}
              className="px-2.5 py-1.5 rounded-md bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-mono transition-colors cursor-pointer"
            >
              Voltage Scaling Only
            </button>
            <button
              onClick={() => loadPreset('unfeasible')}
              className="px-2.5 py-1.5 rounded-md bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-[11px] font-mono transition-colors cursor-pointer"
              title="Loads constraints that cannot be satisfied to test honest reporting"
            >
              Test Unfeasible Case
            </button>
          </div>
        </div>

        {/* Objective & Tunable Knobs Selector */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-4">
          {/* Optimization Objective Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-800 block">
              1. Optimization Objective
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleSetObjective(OPTIMIZATION_OBJECTIVES.MINIMIZE_POWER)}
                className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                  objective === OPTIMIZATION_OBJECTIVES.MINIMIZE_POWER
                    ? 'bg-cyan-50/80 border-cyan-300 text-cyan-900 shadow-2xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="text-xs font-semibold flex items-center justify-between">
                  <span>Minimize Dynamic Power</span>
                  {objective === OPTIMIZATION_OBJECTIVES.MINIMIZE_POWER && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-600" />
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Find the lowest power candidate satisfying minimum frequency and voltage bounds.
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleSetObjective(OPTIMIZATION_OBJECTIVES.MEET_POWER_BUDGET)}
                className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                  objective === OPTIMIZATION_OBJECTIVES.MEET_POWER_BUDGET
                    ? 'bg-cyan-50/80 border-cyan-300 text-cyan-900 shadow-2xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="text-xs font-semibold flex items-center justify-between">
                  <span>Meet Budget &amp; Maximize Freq</span>
                  {objective === OPTIMIZATION_OBJECTIVES.MEET_POWER_BUDGET && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-600" />
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Ensure power &le; budget while keeping clock frequency as high as possible.
                </p>
              </button>
            </div>
          </div>

          {/* Permitted Parameter Tuning Knobs */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-800 block">
              2. Permitted Optimization Variables
            </label>
            <div className="p-3 rounded-lg bg-slate-50/80 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-800 font-medium">
                  <input
                    type="checkbox"
                    checked={tunableParameters.voltage}
                    onChange={() => handleTunableToggle('voltage')}
                    className="accent-cyan-600 rounded cursor-pointer"
                  />
                  <span>Permit Supply Voltage Tuning (DVFS)</span>
                </label>
                <span className="text-[10px] font-mono text-cyan-700 bg-cyan-50 px-1.5 py-0.5 rounded border border-cyan-200">
                  V<sub>dd</sub><sup>2</sup> quadratic impact
                </span>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-800 font-medium">
                  <input
                    type="checkbox"
                    checked={tunableParameters.frequency}
                    onChange={() => handleTunableToggle('frequency')}
                    className="accent-cyan-600 rounded cursor-pointer"
                  />
                  <span>Permit Clock Frequency Tuning</span>
                </label>
                <span className="text-[10px] font-mono text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200">
                  Linear f<sub>clk</sub> impact
                </span>
              </div>

              <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-200/80 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                <span>Switching activity (α) and capacitance (C<sub>eff</sub>) are held fixed as circuit constants.</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Inputs Configuration Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Baseline Circuit Configuration */}
        <div className="ic-card p-5 bg-white border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-cyan-600" />
              <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                Baseline Circuit Operating State
              </h3>
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              Reference Benchmark
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-medium text-slate-700 block mb-1">
                Activity Factor (α)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="1"
                value={baseline.alpha}
                onChange={(e) => handleBaselineChange('alpha', e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-md bg-white border border-slate-200 font-mono text-xs text-slate-900 shadow-2xs focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-medium text-slate-700 block mb-1">
                Capacitance C<sub>eff</sub> (pF)
              </label>
              <input
                type="number"
                step="any"
                min="0.1"
                value={baseline.effectiveCapacitancePf}
                onChange={(e) => handleBaselineChange('effectiveCapacitancePf', e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-md bg-white border border-slate-200 font-mono text-xs text-slate-900 shadow-2xs focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-medium text-slate-700 block mb-1">
                Baseline Voltage V<sub>dd</sub> (V)
              </label>
              <input
                type="number"
                step="0.05"
                min="0.1"
                value={baseline.supplyVoltageV}
                onChange={(e) => handleBaselineChange('supplyVoltageV', e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-md bg-white border border-slate-200 font-mono text-xs text-slate-900 shadow-2xs focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-medium text-slate-700 block mb-1">
                Baseline Freq f<sub>clk</sub> (MHz)
              </label>
              <input
                type="number"
                step="1"
                min="1"
                value={baseline.clockFrequencyMhz}
                onChange={(e) => handleBaselineChange('clockFrequencyMhz', e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-md bg-white border border-slate-200 font-mono text-xs text-slate-900 shadow-2xs focus:border-cyan-500"
              />
            </div>
          </div>

          {optimizationResult && optimizationResult.baseline && (
            <div className="p-2.5 rounded-md bg-slate-50 border border-slate-200 flex items-center justify-between text-xs font-mono">
              <span className="text-slate-500">Computed Baseline Power:</span>
              <span className="font-bold text-slate-900">
                {optimizationResult.baseline.powerMilliwatts.toFixed(3)} mW{' '}
                <span className="text-[10px] text-slate-500 font-normal">
                  ({optimizationResult.baseline.powerWatts.toFixed(6)} W)
                </span>
              </span>
            </div>
          )}
        </div>

        {/* User-Defined Constraints & Search Bounds */}
        <div className="ic-card p-5 bg-white border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-cyan-600" />
              <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                User Constraints &amp; Search Space
              </h3>
            </div>
            <span className="text-[10px] font-mono text-cyan-700 font-medium">
              Physical Guardrails
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Power Budget */}
            <div>
              <label className="text-[11px] font-medium text-slate-700 block mb-1">
                Max Power Budget (mW)
              </label>
              <input
                type="number"
                step="0.02"
                min="0.01"
                value={constraints.maxPowerMw}
                onChange={(e) => handleConstraintChange('maxPowerMw', e.target.value)}
                placeholder="e.g. 0.400"
                className="w-full px-2.5 py-1.5 rounded-md bg-white border border-slate-200 font-mono text-xs text-slate-900 shadow-2xs focus:border-cyan-500"
              />
            </div>

            {/* Minimum Required Frequency */}
            <div>
              <label className="text-[11px] font-medium text-slate-700 block mb-1">
                Min Required Freq (MHz)
              </label>
              <input
                type="number"
                step="5"
                min="1"
                value={constraints.minFrequencyMhz}
                onChange={(e) => handleConstraintChange('minFrequencyMhz', e.target.value)}
                placeholder="e.g. 80"
                className="w-full px-2.5 py-1.5 rounded-md bg-white border border-slate-200 font-mono text-xs text-slate-900 shadow-2xs focus:border-cyan-500"
              />
            </div>

            {/* Voltage Bounds */}
            <div>
              <label className="text-[11px] font-medium text-slate-700 block mb-1">
                Voltage Range [Min - Max] (V)
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  step="0.05"
                  min="0.1"
                  value={constraints.minVoltageV}
                  onChange={(e) => handleConstraintChange('minVoltageV', e.target.value)}
                  className="w-1/2 px-2 py-1.5 rounded-md bg-white border border-slate-200 font-mono text-xs text-slate-900 shadow-2xs"
                />
                <span className="text-slate-400 text-xs">-</span>
                <input
                  type="number"
                  step="0.05"
                  min="0.1"
                  value={constraints.maxVoltageV}
                  onChange={(e) => handleConstraintChange('maxVoltageV', e.target.value)}
                  className="w-1/2 px-2 py-1.5 rounded-md bg-white border border-slate-200 font-mono text-xs text-slate-900 shadow-2xs"
                />
              </div>
            </div>

            {/* Increments / Resolution */}
            <div>
              <label className="text-[11px] font-medium text-slate-700 block mb-1">
                Steps [ΔV (V) / Δf (MHz)]
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={constraints.voltageStepV}
                  onChange={(e) => handleConstraintChange('voltageStepV', e.target.value)}
                  title="Voltage increment step"
                  className="w-1/2 px-2 py-1.5 rounded-md bg-white border border-slate-200 font-mono text-xs text-slate-900 shadow-2xs"
                />
                <span className="text-slate-400 text-xs">/</span>
                <input
                  type="number"
                  step="1"
                  min="1"
                  value={constraints.frequencyStepMhz}
                  onChange={(e) => handleConstraintChange('frequencyStepMhz', e.target.value)}
                  title="Frequency increment step"
                  className="w-1/2 px-2 py-1.5 rounded-md bg-white border border-slate-200 font-mono text-xs text-slate-900 shadow-2xs"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Validation Errors If Any */}
      {!validation.isValid && (
        <div className="ic-card p-4 bg-rose-50 border border-rose-200 rounded-xl">
          <div className="flex items-center gap-2 text-rose-800 font-semibold text-xs mb-1">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>Optimization Parameters Require Correction:</span>
          </div>
          <ul className="list-disc list-inside text-xs text-rose-700 font-mono space-y-0.5">
            {Object.values(validation.errors).map((err, idx) => (
              <li key={idx}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Optimization Results Section */}
      {optimizationResult && (
        <div className="space-y-5">
          {optimizationResult.hasFeasibleSolution ? (
            /* Feasible Solution Found */
            <div className="ic-card p-6 bg-gradient-to-br from-white via-cyan-50/20 to-slate-50 border border-cyan-200 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-cyan-500 status-pulse" />
                  <h3 className="text-sm font-semibold text-slate-900 tracking-wide uppercase">
                    Optimal Feasible Configuration Identified
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-slate-500">
                    Evaluated: <strong className="text-slate-800">{optimizationResult.totalEvaluated}</strong> candidates ({optimizationResult.feasibleCount} feasible, {optimizationResult.rejectedCount} rejected)
                  </span>
                  <StatusBadge variant="green" text="Constraints Met" icon={CheckCircle2} />
                </div>
              </div>

              {/* 4 Summary Stat Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {/* 1. Optimized Power */}
                <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">
                    Optimized Power (P<sub>opt</sub>)
                  </span>
                  <div className="text-xl font-mono font-bold text-cyan-700 mt-1">
                    {optimizationResult.bestCandidate.powerMilliwatts.toFixed(3)} mW
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">
                    {optimizationResult.bestCandidate.powerWatts.toFixed(6)} W
                  </span>
                </div>

                {/* 2. Absolute & Percent Reduction */}
                <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">
                    Dynamic Power Savings
                  </span>
                  <div className={`text-xl font-mono font-bold mt-1 flex items-center gap-1 ${
                    optimizationResult.bestCandidate.isPowerReduced ? 'text-emerald-700' : 'text-slate-700'
                  }`}>
                    {optimizationResult.bestCandidate.isPowerReduced && (
                      <TrendingDown className="w-4 h-4 text-emerald-600" />
                    )}
                    <span>
                      {optimizationResult.bestCandidate.isPowerReduced
                        ? `-${optimizationResult.bestCandidate.percentageReduction}%`
                        : '0.0%'}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">
                    ΔP: -{optimizationResult.bestCandidate.deltaPowerMw.toFixed(3)} mW
                  </span>
                </div>

                {/* 3. Voltage Tuning Delta */}
                <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">
                    Optimal Voltage (V<sub>DD</sub>)
                  </span>
                  <div className="text-xl font-mono font-bold text-slate-900 mt-1">
                    {optimizationResult.bestCandidate.voltageV.toFixed(2)} V
                  </div>
                  <span className="text-[10px] font-mono text-cyan-700">
                    ΔV: {optimizationResult.bestCandidate.deltaVoltageV > 0 ? '+' : ''}
                    {optimizationResult.bestCandidate.deltaVoltageV.toFixed(2)} V
                  </span>
                </div>

                {/* 4. Frequency Tuning Delta */}
                <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">
                    Optimal Frequency (f<sub>clk</sub>)
                  </span>
                  <div className="text-xl font-mono font-bold text-slate-900 mt-1">
                    {optimizationResult.bestCandidate.frequencyMhz} MHz
                  </div>
                  <span className="text-[10px] font-mono text-sky-700">
                    Δf: {optimizationResult.bestCandidate.deltaFrequencyMhz > 0 ? '+' : ''}
                    {optimizationResult.bestCandidate.deltaFrequencyMhz} MHz
                  </span>
                </div>
              </div>

              {/* Individual Constraint Checks Pill Row */}
              <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2">
                <span className="text-xs font-semibold text-slate-800 block">
                  Individual Physical Constraint Checks for Optimal Candidate:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono">
                  {/* Frequency check */}
                  <div className="p-2 rounded bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="text-slate-500 block text-[10px]">Frequency Constraint:</span>
                      <span className="text-slate-800 font-semibold">
                        {optimizationResult.bestCandidate.frequencyMhz} MHz &ge; {constraints.minFrequencyMhz} MHz
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                      PASSED
                    </span>
                  </div>

                  {/* Voltage check */}
                  <div className="p-2 rounded bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="text-slate-500 block text-[10px]">Voltage Bound:</span>
                      <span className="text-slate-800 font-semibold">
                        {optimizationResult.bestCandidate.voltageV} V &isin; [{constraints.minVoltageV}V - {constraints.maxVoltageV}V]
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                      PASSED
                    </span>
                  </div>

                  {/* Power check */}
                  <div className="p-2 rounded bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="text-slate-500 block text-[10px]">Power Budget:</span>
                      <span className="text-slate-800 font-semibold">
                        {optimizationResult.bestCandidate.powerMilliwatts.toFixed(3)} mW &le; {constraints.maxPowerMw} mW
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                      PASSED
                    </span>
                  </div>
                </div>
              </div>

              {/* Summary note */}
              <p className="text-xs text-slate-600 font-medium">
                {optimizationResult.summaryMessage}
              </p>

              {/* Save to Experiment Registry & Multi-Module Actions */}
              <div className="pt-3 border-t border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={handleSaveRunToRegistry}
                    disabled={savedRunId !== null}
                    className={`px-3 py-1.5 rounded-lg font-mono text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs ${
                      savedRunId
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                        : 'bg-cyan-600 hover:bg-cyan-700 text-white'
                    }`}
                  >
                    <Database className="w-3.5 h-3.5" />
                    <span>{savedRunId ? `Saved as ${savedRunId}` : 'Save Run to Experiment Registry'}</span>
                  </button>

                  {savedRunId && onNavigate && (
                    <button
                      onClick={() => onNavigate('experiment-history')}
                      className="text-xs text-cyan-700 hover:text-cyan-900 font-semibold underline font-mono cursor-pointer"
                    >
                      View in Experiment History &rarr;
                    </button>
                  )}
                </div>

                {onNavigate && (
                  <button
                    onClick={() => onNavigate('scenario-comparison')}
                    className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-mono text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                  >
                    <span>Inspect in Scenario Comparison &rarr;</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Honest Unfeasible State Display */
            <div className="ic-card p-6 bg-amber-50/60 border border-amber-200 text-center rounded-xl space-y-3">
              <div className="w-12 h-12 rounded-xl bg-amber-100 border border-amber-200 text-amber-700 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold text-slate-900">
                No Feasible Configuration Exists Within Current Constraints
              </h3>
              <p className="text-xs text-slate-600 max-w-xl mx-auto leading-relaxed">
                {optimizationResult.message}
              </p>
              <div className="text-[11px] font-mono text-slate-500 bg-white/80 p-2.5 rounded-lg border border-amber-200 max-w-md mx-auto">
                Evaluated: <strong>{optimizationResult.totalEvaluated}</strong> candidates &bull; Feasible: <strong>0</strong> &bull; Rejected: <strong>{optimizationResult.rejectedCount}</strong>
              </div>
              <p className="text-[11px] text-slate-500 italic">
                Suggestion: Relax the maximum power budget, allow lower supply voltage, or permit lower clock frequency.
              </p>
            </div>
          )}

          {/* Candidate Explorer Table */}
          {optimizationResult.evaluatedCandidates && (
            <div className="ic-card p-5 bg-white border border-slate-200 shadow-sm space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-cyan-600" />
                  <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                    Candidate Configurations Explorer
                  </h4>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowAllCandidates(!showAllCandidates)}
                    className="text-xs text-cyan-700 hover:text-cyan-800 font-medium underline cursor-pointer"
                  >
                    {showAllCandidates ? 'Show Feasible Only' : `Show All (${optimizationResult.totalEvaluated} Candidates)`}
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500">
                      <th className="py-2 px-2.5">ID</th>
                      <th className="py-2 px-2.5">Voltage (V)</th>
                      <th className="py-2 px-2.5">Freq (MHz)</th>
                      <th className="py-2 px-2.5">Dynamic Power</th>
                      <th className="py-2 px-2.5">Δ vs Baseline</th>
                      <th className="py-2 px-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(showAllCandidates
                      ? optimizationResult.evaluatedCandidates
                      : optimizationResult.rankedCandidates || []
                    ).slice(0, 15).map((cand) => {
                      const isBest = optimizationResult.bestCandidate && optimizationResult.bestCandidate.id === cand.id;
                      const deltaMw = optimizationResult.baseline.powerMilliwatts - cand.powerMilliwatts;
                      return (
                        <tr
                          key={cand.id}
                          className={`${
                            isBest
                              ? 'bg-cyan-50/70 font-semibold'
                              : cand.isFeasible
                              ? 'hover:bg-slate-50'
                              : 'bg-rose-50/20 text-slate-400'
                          }`}
                        >
                          <td className="py-2 px-2.5 flex items-center gap-1.5">
                            <span>{cand.id}</span>
                            {isBest && (
                              <span className="text-[10px] bg-cyan-600 text-white px-1.5 py-0.2 rounded font-sans font-bold">
                                BEST
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-2.5 text-slate-800">{cand.voltageV.toFixed(2)} V</td>
                          <td className="py-2 px-2.5 text-slate-800">{cand.frequencyMhz} MHz</td>
                          <td className="py-2 px-2.5 font-bold text-cyan-700">
                            {cand.powerMilliwatts.toFixed(3)} mW
                          </td>
                          <td className="py-2 px-2.5">
                            {deltaMw > 0 ? (
                              <span className="text-emerald-700">-{deltaMw.toFixed(3)} mW</span>
                            ) : deltaMw < 0 ? (
                              <span className="text-rose-600">+{Math.abs(deltaMw).toFixed(3)} mW</span>
                            ) : (
                              <span className="text-slate-400">0.000 mW</span>
                            )}
                          </td>
                          <td className="py-2 px-2.5">
                            {cand.isFeasible ? (
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                FEASIBLE
                              </span>
                            ) : (
                              <span
                                className="text-[10px] text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200"
                                title={Array.isArray(cand.violations) && cand.violations.length > 0 ? cand.violations.join('; ') : 'Violations detected'}
                              >
                                VIOLATED
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
