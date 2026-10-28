import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  Terminal,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  TrendingDown,
  ListOrdered,
  Sparkles,
} from 'lucide-react';

/**
 * AgentActivityTimeline Component
 * Renders the visible agent activity timeline:
 * - Goal & Plan Summary
 * - Step-by-Step Tool Invocations with verified deterministic outputs
 * - Concise engineering reasoning summaries
 * - Independent Physical Constraint Verification
 * - Final Verified Sign-Off Recommendation
 */
export default function AgentActivityTimeline({ runResult, onApplyCandidate }) {
  const [expandedSteps, setExpandedSteps] = useState({});

  if (!runResult) return null;

  const {
    goal,
    planSummary = [],
    timeline = [],
    verification,
    finalReport,
    mode,
    hasFeasibleSolution,
  } = runResult;

  const toggleStep = (step) => {
    setExpandedSteps((prev) => ({
      ...prev,
      [step]: !prev[step],
    }));
  };

  return (
    <div className="space-y-5 pt-2">
      {/* 1. Header & Execution Mode Pill */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold block">
            Agent Optimization Goal
          </span>
          <p className="text-xs font-mono font-medium text-slate-900 mt-0.5">
            "{goal}"
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] font-mono px-2 py-0.5 rounded border font-semibold bg-cyan-50 border-cyan-200 text-cyan-800">
            {mode === 'deterministic' ? 'Deterministic Rule Planner' : `Autonomous LLM (${mode})`}
          </span>
          {hasFeasibleSolution !== false ? (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded border font-semibold bg-emerald-50 border-emerald-200 text-emerald-800 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              Verified Solution
            </span>
          ) : (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded border font-semibold bg-amber-50 border-amber-200 text-amber-800 flex items-center gap-1">
              <XCircle className="w-3 h-3 text-amber-600" />
              No Feasible Solution
            </span>
          )}
        </div>
      </div>

      {/* 2. Plan Summary Card */}
      {planSummary && planSummary.length > 0 && (
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <ListOrdered className="w-4 h-4 text-cyan-600" />
            <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
              Agent Task Execution Plan
            </h4>
          </div>
          <ol className="space-y-1.5 text-xs text-slate-600 font-mono list-none">
            {planSummary.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-cyan-100 text-cyan-800 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <span>{item.replace(/^[0-9.]+\s*/, '')}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* 3. Step-by-Step Tool Activity Timeline */}
      <div className="space-y-3">
        <div className="flex items-center justify-between pb-1">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-cyan-600" />
            <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
              Tool Calling Execution Timeline
            </h4>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            {timeline.length} Step{timeline.length === 1 ? '' : 's'} Logged
          </span>
        </div>

        <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
          {timeline.map((entry, idx) => {
            const isExpanded = !!expandedSteps[entry.step || idx];
            const isToolCall = entry.type === 'tool_call';
            const isPlan = entry.type === 'plan';

            return (
              <div key={idx} className="relative group">
                {/* Node icon */}
                <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-white border-2 border-cyan-500 text-cyan-600 flex items-center justify-center shadow-2xs">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-600" />
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs hover:border-slate-300 transition-colors">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold text-slate-400">
                        STEP {entry.step || idx + 1}
                      </span>
                      {isToolCall && (
                        <span className="text-xs font-mono font-bold text-cyan-800 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200">
                          tool::{entry.toolName}()
                        </span>
                      )}
                      {isPlan && (
                        <span className="text-xs font-semibold text-slate-800">
                          {entry.title || 'Plan Formulated'}
                        </span>
                      )}
                    </div>

                    {isToolCall && (
                      <button
                        onClick={() => toggleStep(entry.step || idx)}
                        className="text-[11px] font-mono text-slate-500 hover:text-cyan-700 flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <span>{isExpanded ? 'Hide Payload' : 'View Payload'}</span>
                        {isExpanded ? (
                          <ChevronDown className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>

                  {/* Concise Engineering Reasoning Summary */}
                  {entry.reasoning && (
                    <p className="text-xs text-slate-700 font-medium mt-2 leading-relaxed">
                      {entry.reasoning}
                    </p>
                  )}

                  {/* Expandable Tool Arguments & Result Payload */}
                  {isToolCall && isExpanded && (
                    <div className="mt-3 pt-3 border-t border-slate-100 space-y-2 text-[11px] font-mono">
                      <div>
                        <span className="text-slate-400 block mb-0.5">Arguments:</span>
                        <pre className="p-2 rounded bg-slate-50 border border-slate-200 text-slate-700 overflow-x-auto text-[10px]">
                          {JSON.stringify(entry.arguments, null, 2)}
                        </pre>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-0.5">Deterministic Output:</span>
                        <pre className="p-2 rounded bg-slate-50 border border-slate-200 text-slate-800 overflow-x-auto text-[10px]">
                          {JSON.stringify(entry.result, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Independent Constraint Verification Card */}
      {verification && (
        <div className={`p-4 rounded-xl border ${
          verification.isVerified
            ? 'bg-emerald-50/40 border-emerald-200'
            : 'bg-amber-50/50 border-amber-200'
        } space-y-3`}>
          <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
            <div className="flex items-center gap-2">
              <ShieldCheck className={`w-4 h-4 ${verification.isVerified ? 'text-emerald-600' : 'text-amber-600'}`} />
              <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                Independent Physical Constraint Verification
              </h4>
            </div>
            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
              verification.isVerified
                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                : 'bg-amber-100 text-amber-800 border-amber-300'
            }`}>
              {verification.isVerified ? 'VERIFICATION PASSED' : 'VERIFICATION FAILED'}
            </span>
          </div>

          {verification.checks && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono">
              {/* Frequency check */}
              <div className="p-2 rounded bg-white border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-slate-400 text-[10px] block">Clock Frequency:</span>
                  <span className="text-slate-800 font-semibold">
                    {verification.checks.minFrequency?.actual} MHz &ge; {verification.checks.minFrequency?.required} MHz
                  </span>
                </div>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                  verification.checks.minFrequency?.passed
                    ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                    : 'text-rose-700 bg-rose-50 border-rose-200'
                }`}>
                  {verification.checks.minFrequency?.passed ? 'PASSED' : 'VIOLATED'}
                </span>
              </div>

              {/* Voltage check */}
              <div className="p-2 rounded bg-white border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-slate-400 text-[10px] block">Supply Voltage:</span>
                  <span className="text-slate-800 font-semibold">
                    {verification.checks.voltageRange?.actual} V &isin; [{verification.checks.voltageRange?.min}V - {verification.checks.voltageRange?.max}V]
                  </span>
                </div>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                  verification.checks.voltageRange?.passed
                    ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                    : 'text-rose-700 bg-rose-50 border-rose-200'
                }`}>
                  {verification.checks.voltageRange?.passed ? 'PASSED' : 'VIOLATED'}
                </span>
              </div>

              {/* Power budget check */}
              <div className="p-2 rounded bg-white border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-slate-400 text-[10px] block">Power Budget:</span>
                  <span className="text-slate-800 font-semibold">
                    {verification.checks.powerBudget?.actual?.toFixed(3)} mW &le; {verification.checks.powerBudget?.limit || 'N/A'} mW
                  </span>
                </div>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                  verification.checks.powerBudget?.passed
                    ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                    : 'text-rose-700 bg-rose-50 border-rose-200'
                }`}>
                  {verification.checks.powerBudget?.passed ? 'PASSED' : 'VIOLATED'}
                </span>
              </div>
            </div>
          )}

          <p className="text-xs text-slate-700 font-medium">
            {verification.verificationStatement ||
              (Array.isArray(verification.violations) && verification.violations.length > 0
                ? verification.violations.join('; ')
                : verification.error || 'Verification diagnostics unavailable.')}
          </p>
        </div>
      )}

      {/* 5. Final Verified Sign-Off Recommendation Card */}
      {finalReport && finalReport.success && (
        <div className="p-5 rounded-xl bg-gradient-to-br from-white via-cyan-50/30 to-slate-50 border border-cyan-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cyan-600" />
              <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                Agent Sign-Off Recommendation
              </h4>
            </div>
            {finalReport.experimentId && (
              <span className="text-[10px] font-mono text-cyan-800 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200">
                Log ID: {finalReport.experimentId}
              </span>
            )}
          </div>

          <p className="text-xs text-slate-800 leading-relaxed font-medium">
            {finalReport.recommendation || finalReport.summary}
          </p>

          {/* 4 Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
            <div className="p-3 rounded-lg bg-white border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-mono text-slate-400 block uppercase">
                Optimized Power
              </span>
              <span className="text-base font-mono font-bold text-cyan-700 mt-0.5 block">
                {finalReport.optimizedPowerMw?.toFixed(3)} mW
              </span>
            </div>

            <div className="p-3 rounded-lg bg-white border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-mono text-slate-400 block uppercase">
                Power Savings
              </span>
              <span className="text-base font-mono font-bold text-emerald-700 mt-0.5 flex items-center gap-1">
                <TrendingDown className="w-4 h-4 text-emerald-600" />
                <span>-{finalReport.savingsPercent}%</span>
              </span>
            </div>

            <div className="p-3 rounded-lg bg-white border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-mono text-slate-400 block uppercase">
                Optimal Voltage
              </span>
              <span className="text-base font-mono font-bold text-slate-900 mt-0.5 block">
                {finalReport.optimalVoltageV} V
              </span>
            </div>

            <div className="p-3 rounded-lg bg-white border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-mono text-slate-400 block uppercase">
                Optimal Clock
              </span>
              <span className="text-base font-mono font-bold text-slate-900 mt-0.5 block">
                {finalReport.optimalFrequencyMhz} MHz
              </span>
            </div>
          </div>

          {onApplyCandidate && (
            <div className="pt-2 flex justify-end">
              <button
                onClick={() =>
                  onApplyCandidate({
                    voltageV: finalReport.optimalVoltageV,
                    frequencyMhz: finalReport.optimalFrequencyMhz,
                  })
                }
                className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-xs font-mono font-semibold text-white transition-colors cursor-pointer shadow-2xs flex items-center gap-1.5"
              >
                <span>Apply to Manual Config</span>
                <span>&rarr;</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
