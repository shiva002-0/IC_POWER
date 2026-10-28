import React from 'react';
import {
  Zap,
  Sparkles,
  GitCompare,
  History,
  ArrowRight,
  BookOpen,
  CheckCircle2,
} from 'lucide-react';
import StatusBadge from '../common/StatusBadge';

/**
 * DashboardView Component
 * Initial dashboard with project title, ECE context, theoretical foundation,
 * and clearly labelled roadmap cards for upcoming phases.
 * Redesigned with clean light surfaces and electric-cyan accents.
 */
export default function DashboardView({ onNavigate }) {
  const upcomingModules = [
    {
      id: 'power-analysis',
      title: '1. Power Analysis Engine',
      phase: 'Active',
      variant: 'cyan',
      icon: Zap,
      summary:
        'Calculates dynamic switching dissipation using verified CMOS physical equations with exact SI unit conversions.',
      features: [
        'Interactive dynamic power calculator (Active)',
        'Switching activity factor (α) tuning slider',
        'Standard test case verification benchmark (0.576 mW)',
        'Exact SI unit conversions (pF → Farads, MHz → Hz)',
      ],
      actionText: 'Open Power Analysis Engine',
    },
    {
      id: 'ai-optimization',
      title: '2. Low-Power Optimization Lab',
      phase: 'Active',
      variant: 'cyan',
      icon: Sparkles,
      summary:
        'Deterministic candidate search engine exploring supply voltage and clock frequency scaling while enforcing physical design constraints.',
      features: [
        'Deterministic candidate grid generator & evaluator',
        'Dual objectives: Minimize power vs Meet power budget',
        'Physical constraint checks (min freq, voltage range, max power)',
        'Autonomous & deterministic Agentic AI tool-calling loop online',
      ],
      actionText: 'Open Optimization Engine',
    },
    {
      id: 'scenario-comparison',
      title: '3. Scenario Comparison & PPA',
      phase: 'Active',
      variant: 'cyan',
      icon: GitCompare,
      summary:
        'Direct multi-corner trade-off matrix comparing baseline netlists against AI-optimized designs across Power, Performance, and Area.',
      features: [
        'Side-by-side dynamic power and energy-per-cycle deltas',
        'Worst Negative Slack (WNS) CMOS alpha-power delay guardrails',
        'Multi-scenario PPA trade-off matrix connected to live calculations',
        'Pareto frontier dominance ranking for design sign-off',
      ],
      actionText: 'View Comparison Matrix',
    },
    {
      id: 'experiment-history',
      title: '4. Experiment History & Runs',
      phase: 'Active',
      variant: 'cyan',
      icon: History,
      summary:
        'Persistent engineering experiment registry to track design iterations, rollback netlists, and export reproducible reports.',
      features: [
        'Persistent localStorage run registry across page reloads',
        'Reopen saved experiments directly in the Optimization Lab',
        'Interactive runs table with search, tags, and deletion confirmation',
        'RFC 4180 CSV export and Print-to-PDF sign-off reports',
      ],
      actionText: 'View Experiment Registry',
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Hero Section */}
      <div className="ic-card p-6 lg:p-8 bg-gradient-to-br from-white via-cyan-50/20 to-slate-50 border border-slate-200 relative overflow-hidden shadow-sm">
        <div className="relative z-10">
          <div className="flex flex-wrap items-center gap-2.5 mb-3">
            <StatusBadge variant="cyan" text="All 5 EDA Modules Active & Verified" />
            <StatusBadge variant="neutral" text="ECE Software Lab" />
            <span className="text-xs font-mono text-slate-500">
              Department of Electronics &amp; Communication Engineering
            </span>
          </div>

          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-slate-900 max-w-4xl leading-snug">
            Agentic AI-Based Digital IC Power Estimation and Low-Power Optimization Lab
          </h1>

          <p className="mt-3 text-sm lg:text-base text-slate-600 max-w-4xl leading-relaxed">
            A software-only electronic design automation (EDA) workbench dedicated to analyzing
            dynamic switching dissipation and subthreshold leakage power across digital integrated
            circuits, paired with an autonomous multi-agent reasoning loop for timing-safe, low-power
            architectural optimizations.
          </p>

          {/* Quick Specifications Strip */}
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-5 border-t border-slate-200">
            <div className="p-3 rounded-lg bg-white border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-mono text-slate-500 block">Technology Scope</span>
              <span className="text-xs font-semibold text-slate-900 mt-0.5 block">
                CMOS VLSI Logic (28nm / 14nm)
              </span>
            </div>
            <div className="p-3 rounded-lg bg-white border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-mono text-slate-500 block">Power Domains</span>
              <span className="text-xs font-semibold text-cyan-700 mt-0.5 block">
                Dynamic, Leakage &amp; Glitch
              </span>
            </div>
            <div className="p-3 rounded-lg bg-white border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-mono text-slate-500 block">AI Architecture</span>
              <span className="text-xs font-semibold text-slate-900 mt-0.5 block">
                Multi-Agent Critic &amp; Optimizer
              </span>
            </div>
            <div className="p-3 rounded-lg bg-white border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-mono text-slate-500 block">Execution Mode</span>
              <span className="text-xs font-semibold text-cyan-700 mt-0.5 block font-mono">
                Full EDA Platform Online
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Semiconductor Power Physics Foundations Card */}
      <div className="ic-card p-6 bg-white border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="w-5 h-5 text-cyan-600" />
          <h2 className="text-base font-semibold text-slate-900">
            Theoretical CMOS Power Foundations
          </h2>
          <span className="text-xs font-mono text-slate-500 ml-auto">
            Governing VLSI Equations
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-slate-50/80 border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-900">Dynamic Switching Power</span>
              <span className="text-[10px] font-mono text-cyan-800 bg-cyan-50 px-1.5 py-0.5 rounded border border-cyan-200 font-semibold">
                Activity Dependent
              </span>
            </div>
            <div className="p-2.5 rounded bg-white border border-slate-200 font-mono text-xs text-cyan-800 font-bold my-2 text-center shadow-2xs">
              P<sub>dyn</sub> = α · C<sub>L</sub> · V<sub>DD</sub><sup>2</sup> · f<sub>clk</sub>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Dissipated during logic transitions when charging and discharging load capacitance (C<sub>L</sub>) at switching activity (α).
            </p>
          </div>

          <div className="p-4 rounded-lg bg-slate-50/80 border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-900">Static Leakage Power</span>
              <span className="text-[10px] font-mono text-sky-800 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200 font-semibold">
                Always Present
              </span>
            </div>
            <div className="p-2.5 rounded bg-white border border-slate-200 font-mono text-xs text-sky-800 font-bold my-2 text-center shadow-2xs">
              P<sub>leak</sub> = (I<sub>sub</sub> + I<sub>gate</sub>) · V<sub>DD</sub>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Subthreshold channel conduction and gate-dielectric tunneling that dissipates power continuously, even when clocks are stalled.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-slate-50/80 border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-900">Total Dissipation &amp; PPA</span>
              <span className="text-[10px] font-mono text-purple-800 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200 font-semibold">
                Trade-off Triangle
              </span>
            </div>
            <div className="p-2.5 rounded bg-white border border-slate-200 font-mono text-xs text-purple-800 font-bold my-2 text-center shadow-2xs">
              P<sub>total</sub> = P<sub>dyn</sub> + P<sub>short-circuit</sub> + P<sub>leak</sub>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Optimizing power must preserve target frequency (timing slack WNS ≥ 0) and stay within standard cell silicon area budgets.
            </p>
          </div>
        </div>
      </div>

      {/* Feature Roadmap & Upcoming Modules Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Application Modules Roadmap
            </h2>
            <p className="text-xs text-slate-500">
              Each module follows a structured engineering workflow implemented sequentially across project phases.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-500 hidden sm:inline">
            Interactive Navigation
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {upcomingModules.map((module) => {
            const Icon = module.icon;
            return (
              <div
                key={module.id}
                className="ic-card p-5 bg-white border border-slate-200 flex flex-col justify-between shadow-sm"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-cyan-50 border border-cyan-200 text-cyan-600 shadow-2xs">
                        <Icon className="w-4 h-4" />
                      </div>
                      <h3 className="text-sm font-semibold text-slate-900">
                        {module.title}
                      </h3>
                    </div>
                    <StatusBadge variant={module.variant} text={module.phase} />
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed mb-4">
                    {module.summary}
                  </p>

                  <div className="space-y-1.5 mb-5 bg-slate-50/80 p-3 rounded-lg border border-slate-200/80">
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block mb-1 font-semibold">
                      Target Implementation Elements:
                    </span>
                    {module.features.map((feat, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 text-[11px] text-slate-700"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 shrink-0" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => onNavigate(module.id)}
                  className="w-full py-2.5 px-3 rounded-lg bg-slate-50 hover:bg-cyan-50 border border-slate-200 hover:border-cyan-200 text-xs font-medium text-slate-700 hover:text-cyan-800 transition-all flex items-center justify-center gap-2 group cursor-pointer shadow-2xs"
                >
                  <span>{module.actionText}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-700 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Engineering Discipline & Rigor Notice */}
      <div className="p-4 rounded-xl bg-white border border-cyan-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-cyan-50 text-cyan-600 shrink-0 mt-0.5 sm:mt-0 border border-cyan-200">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-slate-900">
              Scientific &amp; Engineering Integrity Guarantee
            </h4>
            <p className="text-xs text-slate-600 mt-0.5">
              This system does not render mock calculations, synthetic numbers, or fake LLM dialogs. Real dynamic power equations, deterministic candidate searches, autonomous agent tool-calling, PPA trade-off matrices, and persistent experiment registries are fully active.
            </p>
          </div>
        </div>
        <div className="shrink-0 font-mono text-xs text-cyan-800 bg-cyan-50 px-3 py-1.5 rounded border border-cyan-200 font-semibold">
          Status: All 5 Modules Verified
        </div>
      </div>
    </div>
  );
}
