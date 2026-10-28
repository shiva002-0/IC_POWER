import React from 'react';
import {
  Sparkles,
  ArrowLeft,
  GitBranch,
  Activity,
} from 'lucide-react';
import StatusBadge from '../common/StatusBadge';
import LowPowerOptimizationLab from '../optimization/LowPowerOptimizationLab';

/**
 * OptimizationLabView Component
 * Phase 3 Module: Deterministic Low-Power Optimization Engine
 * Evaluates candidate configurations across physical CMOS constraints,
 * providing the deterministic foundation for upcoming Agentic AI tool calling.
 */
export default function OptimizationLabView({ onNavigate, loadedExperiment, onClearLoadedExperiment }) {
  const agentRoles = [
    {
      role: 'Agent 1: Netlist Critic & Bottleneck Profiler',
      task: 'Scans design netlist for high-fanout registers with frequent idle cycles and high subthreshold leakage density.',
      objective: 'Identifies candidate register clusters for clock gating and cell replacement.',
    },
    {
      role: 'Agent 2: Clock-Gating Insertion Synthesizer',
      task: 'Identifies synchronous enable conditions and substitutes standard flip-flop banks with Integrated Clock Gating (ICG) cells.',
      objective: 'Eliminates redundant clock-tree toggling (P_dyn reduction up to 30-40%).',
    },
    {
      role: 'Agent 3: Multi-Threshold (Multi-Vt) Allocator',
      task: 'Analyzes timing slack paths; replaces high-leakage LVT cells on positive slack paths with low-leakage HVT cells.',
      objective: 'Reduces static leakage dissipation without violating setup timing constraints.',
    },
    {
      role: 'Agent 4: PPA Timing & Area Verifier (Deterministic Engine)',
      task: 'Invokes the deterministic power optimization engine to guarantee power budget and clock frequency compliance.',
      objective: 'Guarantees the optimization is physically viable for semiconductor tape-out.',
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
            <span className="text-xs font-mono text-cyan-700 font-medium">Optimization Lab</span>
          </div>
          <h1 className="text-xl lg:text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <Sparkles className="w-6 h-6 text-cyan-600" />
            Deterministic Low-Power Optimization Lab
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Bounded candidate space exploration, physical constraint evaluation, and objective-driven power minimization.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <StatusBadge variant="cyan" text="Optimization Engine Online" icon={Activity} />
          <StatusBadge variant="neutral" text="Deterministic Search" />
        </div>
      </div>

      {/* 1. Core Feature: Low-Power Deterministic Search Engine */}
      <LowPowerOptimizationLab
        onNavigate={onNavigate}
        loadedExperiment={loadedExperiment}
        onClearLoadedExperiment={onClearLoadedExperiment}
      />

      {/* 2. Upcoming Agentic AI Loop Integration Card */}
      <div className="ic-card p-6 bg-white border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-cyan-600" />
            <h3 className="text-sm font-semibold text-slate-900">
              Active Agentic AI Tool-Calling Architecture
            </h3>
          </div>
          <span className="text-xs font-mono text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200 font-semibold">
            Active Multi-Tool Agent
          </span>
        </div>

        <p className="text-xs text-slate-600 mb-5 leading-relaxed">
          The autonomous agent layer above coordinates verified deterministic engineering tools
          (<code>calculatePower</code>, <code>searchConfigurations</code>, <code>verifyCandidate</code>, <code>compareConfigurations</code>, and <code>recordExperiment</code>).
          The agent formulates execution plans and independently verifies every constraint before recommending architectural sign-off:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {agentRoles.map((agent, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/90 flex flex-col justify-between shadow-2xs"
            >
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-md bg-cyan-50 border border-cyan-200 text-cyan-700 flex items-center justify-center text-xs font-mono font-bold">
                    {idx + 1}
                  </div>
                  <h4 className="text-xs font-semibold text-slate-900">
                    {agent.role}
                  </h4>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed mb-3">
                  {agent.task}
                </p>
              </div>

              <div className="pt-2.5 border-t border-slate-200 flex items-start gap-1.5 text-[11px] font-mono text-cyan-800">
                <span className="text-slate-500 shrink-0">Role:</span>
                <span className="font-medium">{agent.objective}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
        <button
          onClick={() => onNavigate('power-analysis')}
          className="text-xs text-slate-600 hover:text-slate-900 transition-colors flex items-center gap-1 cursor-pointer font-medium"
        >
          <span>&larr;</span>
          <span>Review Power Analysis</span>
        </button>

        <button
          onClick={() => onNavigate('scenario-comparison')}
          className="text-xs font-medium text-cyan-700 hover:text-cyan-800 transition-colors flex items-center gap-1 cursor-pointer"
        >
          <span>Proceed to Scenario Comparison</span>
          <span>&rarr;</span>
        </button>
      </div>
    </div>
  );
}
