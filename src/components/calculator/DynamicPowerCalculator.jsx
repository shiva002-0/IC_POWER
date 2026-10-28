import React, { useState, useId } from 'react';
import {
  Zap,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  Info,
} from 'lucide-react';
import {
  validatePowerInputs,
  calculateDynamicPower,
} from '../../utils/powerCalculator';

/**
 * DynamicPowerCalculator Component
 * Interactive CMOS Dynamic Power Dissipation engine.
 * Professional engineering light-theme dashboard with electric-cyan accents.
 * Formula: P_dynamic = alpha * C_eff * V_dd^2 * f_clk
 */
export default function DynamicPowerCalculator() {
  const alphaInputId = useId();
  const capInputId = useId();
  const voltInputId = useId();
  const freqInputId = useId();

  // Initial state initialized to Requirement 7 standard test case
  const [inputs, setInputs] = useState({
    alpha: '0.20',
    effectiveCapacitancePf: '20',
    supplyVoltageV: '1.2',
    clockFrequencyMhz: '100',
  });

  // Handle direct input changes (live update)
  const handleInputChange = (field, value) => {
    setInputs((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Preset loader for requirement test case and standard ECE benchmarks
  const loadPreset = (preset) => {
    setInputs(preset);
  };

  const clearAll = () => {
    setInputs({
      alpha: '',
      effectiveCapacitancePf: '',
      supplyVoltageV: '',
      clockFrequencyMhz: '',
    });
  };

  // Perform validation on current inputs
  const validation = validatePowerInputs(inputs);

  // Calculate dynamic power only when all inputs are completely valid
  let calculationResult = null;
  let calculationError = null;

  if (validation.isValid) {
    try {
      calculationResult = calculateDynamicPower(inputs);
    } catch (err) {
      calculationError = err.message;
    }
  }

  // Format numbers cleanly
  const formatWatts = (w) => {
    if (w === 0) return '0.000000 W';
    if (w < 0.0001) {
      return `${w.toExponential(6)} W`;
    }
    return `${w.toFixed(6)} W`;
  };

  const formatMilliwatts = (mw) => {
    if (mw === 0) return '0.000 mW';
    if (mw < 0.001) {
      return `${mw.toExponential(4)} mW`;
    }
    return `${mw.toFixed(3)} mW`;
  };

  const formatMicroWatts = (uw) => {
    if (uw === 0) return '0.00 µW';
    return `${uw.toFixed(2)} µW`;
  };

  return (
    <div className="space-y-6">
      {/* Calculator Header & Preset Bar */}
      <div className="ic-card p-5 bg-white border border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-50 border border-cyan-200 text-cyan-600 shadow-2xs">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Interactive Dynamic Power Calculator
              </h2>
              <p className="text-xs text-slate-500 font-mono">
                P<sub>dynamic</sub> = α · C<sub>eff</sub> · V<sub>dd</sub><sup>2</sup> · f<sub>clk</sub>
              </p>
            </div>
          </div>

          {/* Quick Preset Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() =>
                loadPreset({
                  alpha: '0.20',
                  effectiveCapacitancePf: '20',
                  supplyVoltageV: '1.2',
                  clockFrequencyMhz: '100',
                })
              }
              className="px-2.5 py-1.5 rounded-md bg-cyan-50 hover:bg-cyan-100/80 border border-cyan-200 text-[11px] font-mono text-cyan-800 font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="Verify standard test case: alpha=0.20, C=20pF, Vdd=1.2V, f=100MHz"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-600" />
              <span>Load Req. 7 Test Case</span>
            </button>

            <button
              onClick={() =>
                loadPreset({
                  alpha: '0.10',
                  effectiveCapacitancePf: '8',
                  supplyVoltageV: '0.8',
                  clockFrequencyMhz: '24',
                })
              }
              className="px-2.5 py-1.5 rounded-md bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[11px] font-mono text-slate-700 transition-colors cursor-pointer"
            >
              <span>IoT Low-Power (0.8V, 24MHz)</span>
            </button>

            <button
              onClick={clearAll}
              className="px-2 py-1.5 rounded-md bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-[11px] font-mono text-slate-600 hover:text-rose-700 transition-colors flex items-center gap-1 cursor-pointer"
              title="Clear all fields to test validation errors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Input Parameters Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4">
          {/* 1. Switching Activity Factor (Alpha) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor={alphaInputId} className="text-xs font-semibold text-slate-800">
                Switching Activity Factor (α)
              </label>
              <span className="text-[10px] font-mono text-slate-500">
                Range: [0.0 - 1.0]
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Average probability of output node logic transition per clock cycle.
            </p>

            <div className="relative">
              <input
                id={alphaInputId}
                type="number"
                step="0.01"
                min="0"
                max="1"
                value={inputs.alpha}
                onChange={(e) => handleInputChange('alpha', e.target.value)}
                placeholder="e.g. 0.20"
                className={`w-full px-3 py-2 rounded-lg bg-white font-mono text-xs text-slate-900 placeholder:text-slate-400 border transition-all shadow-2xs ${
                  validation.errors.alpha
                    ? 'border-rose-300 bg-rose-50/20 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20'
                    : 'border-slate-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20'
                }`}
              />
              <span className="absolute right-3 top-2 text-xs font-mono text-cyan-600 font-semibold">
                α
              </span>
            </div>

            {/* Slider control for convenient tuning */}
            <div className="flex items-center gap-2 pt-1">
              <span className="text-[10px] font-mono text-slate-400">0.0</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={
                  isNaN(Number(inputs.alpha)) || inputs.alpha === ''
                    ? 0
                    : Math.max(0, Math.min(1, Number(inputs.alpha)))
                }
                onChange={(e) => handleInputChange('alpha', e.target.value)}
                className="w-full accent-cyan-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
              />
              <span className="text-[10px] font-mono text-slate-400">1.0</span>
            </div>

            {validation.errors.alpha && (
              <div className="flex items-center gap-1.5 text-xs text-rose-600 font-mono pt-0.5">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>{validation.errors.alpha}</span>
              </div>
            )}
          </div>

          {/* 2. Effective Capacitance (pF) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor={capInputId} className="text-xs font-semibold text-slate-800">
                Effective Capacitance (C<sub>eff</sub>)
              </label>
              <span className="text-[10px] font-mono text-cyan-700 font-medium">
                1 pF = 10<sup>-12</sup> F
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Lumped physical capacitance: wire interconnects plus gate load.
            </p>

            <div className="relative">
              <input
                id={capInputId}
                type="number"
                step="any"
                min="0.001"
                value={inputs.effectiveCapacitancePf}
                onChange={(e) =>
                  handleInputChange('effectiveCapacitancePf', e.target.value)
                }
                placeholder="e.g. 20"
                className={`w-full px-3 py-2 rounded-lg bg-white font-mono text-xs text-slate-900 placeholder:text-slate-400 border transition-all shadow-2xs ${
                  validation.errors.effectiveCapacitancePf
                    ? 'border-rose-300 bg-rose-50/20 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20'
                    : 'border-slate-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20'
                }`}
              />
              <span className="absolute right-3 top-2 text-xs font-mono text-cyan-600 font-semibold">
                pF
              </span>
            </div>

            {/* Conversion indicator */}
            {!validation.errors.effectiveCapacitancePf &&
              inputs.effectiveCapacitancePf !== '' && (
                <div className="text-[10px] font-mono text-slate-500 pt-0.5">
                  Conversion: {Number(inputs.effectiveCapacitancePf)} pF ={' '}
                  <span className="text-cyan-700 font-medium">
                    {(Number(inputs.effectiveCapacitancePf) * 1e-12).toExponential(3)} Farads
                  </span>
                </div>
              )}

            {validation.errors.effectiveCapacitancePf && (
              <div className="flex items-center gap-1.5 text-xs text-rose-600 font-mono pt-0.5">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>{validation.errors.effectiveCapacitancePf}</span>
              </div>
            )}
          </div>

          {/* 3. Supply Voltage (V) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor={voltInputId} className="text-xs font-semibold text-slate-800">
                Supply Voltage (V<sub>dd</sub>)
              </label>
              <span className="text-[10px] font-mono text-cyan-700 font-medium">
                Quadratic: V<sub>dd</sub><sup>2</sup>
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Core rail voltage. Dynamic power scales quadratically with V<sub>dd</sub>.
            </p>

            <div className="relative">
              <input
                id={voltInputId}
                type="number"
                step="0.05"
                min="0.1"
                value={inputs.supplyVoltageV}
                onChange={(e) => handleInputChange('supplyVoltageV', e.target.value)}
                placeholder="e.g. 1.2"
                className={`w-full px-3 py-2 rounded-lg bg-white font-mono text-xs text-slate-900 placeholder:text-slate-400 border transition-all shadow-2xs ${
                  validation.errors.supplyVoltageV
                    ? 'border-rose-300 bg-rose-50/20 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20'
                    : 'border-slate-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20'
                }`}
              />
              <span className="absolute right-3 top-2 text-xs font-mono text-cyan-600 font-semibold">
                Volts
              </span>
            </div>

            {/* Quadratic note */}
            {!validation.errors.supplyVoltageV && inputs.supplyVoltageV !== '' && (
              <div className="text-[10px] font-mono text-slate-500 pt-0.5">
                Quadratic term: V<sub>dd</sub><sup>2</sup> ={' '}
                <span className="text-cyan-700 font-medium">
                  {(Number(inputs.supplyVoltageV) ** 2).toFixed(4)} V<sup>2</sup>
                </span>
              </div>
            )}

            {validation.errors.supplyVoltageV && (
              <div className="flex items-center gap-1.5 text-xs text-rose-600 font-mono pt-0.5">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>{validation.errors.supplyVoltageV}</span>
              </div>
            )}
          </div>

          {/* 4. Clock Frequency (MHz) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor={freqInputId} className="text-xs font-semibold text-slate-800">
                Clock Frequency (f<sub>clk</sub>)
              </label>
              <span className="text-[10px] font-mono text-cyan-700 font-medium">
                1 MHz = 10<sup>6</sup> Hz
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Operating clock rate driving the synchronous logic domain.
            </p>

            <div className="relative">
              <input
                id={freqInputId}
                type="number"
                step="any"
                min="0.1"
                value={inputs.clockFrequencyMhz}
                onChange={(e) =>
                  handleInputChange('clockFrequencyMhz', e.target.value)
                }
                placeholder="e.g. 100"
                className={`w-full px-3 py-2 rounded-lg bg-white font-mono text-xs text-slate-900 placeholder:text-slate-400 border transition-all shadow-2xs ${
                  validation.errors.clockFrequencyMhz
                    ? 'border-rose-300 bg-rose-50/20 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20'
                    : 'border-slate-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20'
                }`}
              />
              <span className="absolute right-3 top-2 text-xs font-mono text-cyan-600 font-semibold">
                MHz
              </span>
            </div>

            {/* Conversion indicator */}
            {!validation.errors.clockFrequencyMhz &&
              inputs.clockFrequencyMhz !== '' && (
                <div className="text-[10px] font-mono text-slate-500 pt-0.5">
                  Conversion: {Number(inputs.clockFrequencyMhz)} MHz ={' '}
                  <span className="text-cyan-700 font-medium">
                    {(Number(inputs.clockFrequencyMhz) * 1e6).toExponential(3)} Hz
                  </span>
                </div>
              )}

            {validation.errors.clockFrequencyMhz && (
              <div className="flex items-center gap-1.5 text-xs text-rose-600 font-mono pt-0.5">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>{validation.errors.clockFrequencyMhz}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dynamic Power Calculation Results Display */}
      {validation.isValid && calculationResult ? (
        <div className="ic-card p-6 bg-gradient-to-br from-white via-cyan-50/20 to-slate-50 border border-cyan-200 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200/80">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-cyan-500 status-pulse" />
              <h3 className="text-sm font-semibold text-slate-900 tracking-wide uppercase">
                Calculated Dynamic Power Dissipation (P<sub>dynamic</sub>)
              </h3>
            </div>

            {/* Exact match indicator for test case */}
            {Math.abs(calculationResult.watts - 0.000576) < 1e-10 && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-50 border border-emerald-200 text-[11px] font-mono text-emerald-800 font-semibold shadow-2xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Requirement 7 Verified (0.000576 W = 0.576 mW)
              </span>
            )}
          </div>

          {/* Dual Unit Big Readouts: Watts & Milliwatts */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-5">
            {/* Primary Readout 1: Watts */}
            <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs flex flex-col justify-between">
              <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider block font-medium">
                Total Dissipation in Watts (W)
              </span>
              <div className="my-2">
                <div className="text-2xl lg:text-3xl font-mono font-bold text-cyan-700 tracking-tight">
                  {formatWatts(calculationResult.watts)}
                </div>
                <div className="text-[11px] font-mono text-slate-500 mt-1">
                  Scientific: {calculationResult.watts.toExponential(6)} W
                </div>
              </div>
              <span className="text-[10px] font-mono text-slate-400 border-t border-slate-100 pt-2">
                Standard SI Base Unit (Joules/sec)
              </span>
            </div>

            {/* Primary Readout 2: Milliwatts */}
            <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs flex flex-col justify-between">
              <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider block font-medium">
                Total Dissipation in Milliwatts (mW)
              </span>
              <div className="my-2">
                <div className="text-2xl lg:text-3xl font-mono font-bold text-sky-700 tracking-tight">
                  {formatMilliwatts(calculationResult.milliwatts)}
                </div>
                <div className="text-[11px] font-mono text-slate-500 mt-1">
                  1 mW = 10<sup>-3</sup> W
                </div>
              </div>
              <span className="text-[10px] font-mono text-slate-400 border-t border-slate-100 pt-2">
                Primary Semiconductor Metric
              </span>
            </div>

            {/* Secondary Readout 3: Microwatts (VLSI standard cell scale) */}
            <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs flex flex-col justify-between">
              <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider block font-medium">
                Scale in Microwatts (µW)
              </span>
              <div className="my-2">
                <div className="text-2xl lg:text-3xl font-mono font-bold text-slate-800 tracking-tight">
                  {formatMicroWatts(calculationResult.microWatts)}
                </div>
                <div className="text-[11px] font-mono text-slate-500 mt-1">
                  1 µW = 10<sup>-6</sup> W
                </div>
              </div>
              <span className="text-[10px] font-mono text-slate-400 border-t border-slate-100 pt-2">
                Standard Cell Power Library Units
              </span>
            </div>
          </div>

          {/* Mathematical Step-by-Step Substitution Trace */}
          <div className="mt-5 p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                <Info className="w-3.5 h-3.5 text-cyan-600" />
                <span>Physical Computation Trace</span>
              </div>
              <span className="text-[10px] font-mono text-slate-500">
                SI Unit Conversions Applied
              </span>
            </div>

            <div className="font-mono text-xs text-slate-600 space-y-1.5 overflow-x-auto py-1">
              <div className="text-slate-500">
                P<sub>dynamic</sub> = α · [C<sub>eff</sub> × 10<sup>-12</sup> F] · (V<sub>dd</sub>)<sup>2</sup> · [f<sub>clk</sub> × 10<sup>6</sup> Hz]
              </div>
              <div className="text-cyan-800 font-medium">
                P<sub>dynamic</sub> = {inputs.alpha} · ({calculationResult.capacitanceFarads.toExponential(3)} F) · ({(Number(inputs.supplyVoltageV) ** 2).toFixed(4)} V<sup>2</sup>) · ({calculationResult.frequencyHz.toExponential(3)} Hz)
              </div>
              <div className="text-slate-900 font-semibold pt-1 border-t border-slate-100">
                P<sub>dynamic</sub> = {calculationResult.watts.toFixed(6)} W = {calculationResult.milliwatts.toFixed(3)} mW
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Validation Error / Incomplete Input State */
        <div className="ic-card p-6 bg-amber-50/50 border border-amber-200 text-center">
          <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-200 text-amber-700 flex items-center justify-center mx-auto mb-3">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900">
            {calculationError ? 'Calculation Error Occurred' : 'Calculation Suspended: Valid Inputs Required'}
          </h3>
          <p className="text-xs text-slate-600 mt-1 max-w-lg mx-auto">
            {calculationError ||
              'Dynamic power cannot be calculated because one or more input values are invalid or missing. Correct the fields highlighted above to compute real power values.'}
          </p>
          <div className="mt-3 inline-flex items-center gap-2">
            <button
              onClick={() =>
                loadPreset({
                  alpha: '0.20',
                  effectiveCapacitancePf: '20',
                  supplyVoltageV: '1.2',
                  clockFrequencyMhz: '100',
                })
              }
              className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-xs font-mono text-white font-medium transition-colors cursor-pointer shadow-2xs"
            >
              Restore Standard Test Case (0.576 mW)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
