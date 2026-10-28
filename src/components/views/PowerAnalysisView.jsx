import React from 'react';
import {
  Zap,
  FileCode,
  Activity,
  ArrowLeft,
  Sliders,
} from 'lucide-react';
import StatusBadge from '../common/StatusBadge';
import DynamicPowerCalculator from '../calculator/DynamicPowerCalculator';

/**
 * PowerAnalysisView Component
 * Phase 2 Active Module: Digital IC Power Analysis & Interactive Calculator.
 * Redesigned with clean light surfaces and electric-cyan accents.
 */
export default function PowerAnalysisView({ onNavigate }) {
  const plannedInputs = [
    {
      name: 'Synthesized Gate Netlist',
      extension: '.v / .sv',
      purpose: 'Structural description of interconnected standard cells and flip-flops.',
    },
    {
      name: 'Switching Activity Interchange Format',
      extension: '.saif / .vcd',
      purpose: 'Simulation dump containing toggle counts and static duty cycle for every net.',
    },
    {
      name: 'Liberty Timing & Power Library',
      extension: '.lib',
      purpose: 'Cell-level leakage tables and internal dynamic energy lookups (nW/MHz).',
    },
    {
      name: 'Synopsys Design Constraints',
      extension: '.sdc',
      purpose: 'Target clock period, input/output delays, and multi-cycle paths.',
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <button
              onClick={() => onNavigate('dashboard')}
              className="text-xs text-slate-500 hover:text-cyan-700 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Dashboard</span>
            </button>
            <span className="text-slate-300">/</span>
            <span className="text-xs font-mono text-cyan-700 font-medium">Power Analysis</span>
          </div>
          <h1 className="text-xl lg:text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <Zap className="w-6 h-6 text-cyan-600" />
            Digital IC Power Analysis &amp; Dynamic Calculator
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Real-time CMOS dynamic switching power estimation with exact SI unit conversions and validation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <StatusBadge variant="cyan" text="Phase 2 Active" icon={Activity} />
          <StatusBadge variant="neutral" text="Dynamic Engine Online" />
        </div>
      </div>

      {/* 1. Core Feature: Interactive Dynamic Power Calculator */}
      <DynamicPowerCalculator />

      {/* 2. Physical & Architectural Context: Upcoming Automation Pipeline */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
        {/* Input Pipeline Blueprint */}
        <div className="ic-card p-5 bg-white border border-slate-200">
          <div className="flex items-center gap-2 mb-3">
            <FileCode className="w-4 h-4 text-cyan-600" />
            <h3 className="text-sm font-semibold text-slate-900">
              EDA Input Pipeline &amp; File Formats
            </h3>
          </div>
          <p className="text-xs text-slate-600 mb-4">
            In later phases, the calculator parameters will be extracted directly from automated EDA simulation artifacts:
          </p>

          <div className="space-y-2.5">
            {plannedInputs.map((item, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg bg-slate-50/80 border border-slate-200/80 flex items-start justify-between gap-3 shadow-2xs"
              >
                <div>
                  <div className="text-xs font-medium text-slate-900">{item.name}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{item.purpose}</div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white text-cyan-800 border border-slate-200 shrink-0 font-medium">
                  {item.extension}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Estimation Breakdown Methodology */}
        <div className="ic-card p-5 bg-white border border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Sliders className="w-4 h-4 text-cyan-600" />
              <h3 className="text-sm font-semibold text-slate-900">
                Semiconductor Power Breakdown Taxonomy
              </h3>
            </div>
            <p className="text-xs text-slate-600 mb-4">
              Physical partitioning of integrated circuit energy dissipation:
            </p>

            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-slate-50/80 border border-slate-200/80 shadow-2xs">
                <div className="text-xs font-semibold text-cyan-800 mb-1 flex items-center justify-between">
                  <span>1. Dynamic Switching Power (P<sub>dyn</sub>)</span>
                  <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 font-semibold">
                    Active in Phase 2
                  </span>
                </div>
                <p className="text-[11px] text-slate-600">
                  Charging and discharging interconnect capacitances and gate oxides as computed in the calculator above.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-50/80 border border-slate-200/80 shadow-2xs">
                <div className="text-xs font-semibold text-slate-800 mb-1 flex items-center justify-between">
                  <span>2. Clock-Tree Buffer Power (P<sub>clk</sub>)</span>
                  <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                    Phase 3 Synthesis
                  </span>
                </div>
                <p className="text-[11px] text-slate-600">
                  High-frequency clock distribution network toggling, targeted by Integrated Clock Gating (ICG).
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-50/80 border border-slate-200/80 shadow-2xs">
                <div className="text-xs font-semibold text-slate-800 mb-1 flex items-center justify-between">
                  <span>3. Static Subthreshold Leakage (P<sub>leak</sub>)</span>
                  <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                    Phase 3 Multi-Vt
                  </span>
                </div>
                <p className="text-[11px] text-slate-600">
                  Subthreshold channel conduction and gate tunneling leakage determined by LVT/SVT/HVT library tables.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">Next milestone: AI optimization engine</span>
            <button
              onClick={() => onNavigate('ai-optimization')}
              className="text-xs font-medium text-cyan-700 hover:text-cyan-800 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>Explore AI Optimization Lab Blueprint</span>
              <span>&rarr;</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
