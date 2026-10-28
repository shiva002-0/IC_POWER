import React from 'react';
import { Cpu, Activity, Layers } from 'lucide-react';
import StatusBadge from '../common/StatusBadge';

/**
 * Header Component
 * Top-level application bar with clean white surface, electric-cyan branding,
 * and high-contrast engineering metadata.
 */
export default function Header() {
  return (
    <header className="w-full bg-white/95 border-b border-slate-200/90 px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-40 backdrop-blur-md shadow-xs">
      {/* Left: Project Branding */}
      <div className="flex items-center gap-3.5">
        <div className="w-10 h-10 rounded-lg bg-cyan-50 border border-cyan-200 flex items-center justify-center text-cyan-600 shadow-xs">
          <Cpu className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-semibold tracking-wide text-slate-900 uppercase">
              Digital IC Power Lab
            </h1>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-50 text-cyan-700 border border-cyan-200 font-medium">
              v1.0-alpha
            </span>
          </div>
          <p className="text-xs text-slate-500 font-normal">
            Agentic AI-Based Power Estimation &amp; Low-Power Optimization
          </p>
        </div>
      </div>

      {/* Right: Engineering Metadata & Status */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-50 border border-slate-200 text-xs text-slate-700">
          <Layers className="w-3.5 h-3.5 text-cyan-600" />
          <span className="text-slate-500">Node Targets:</span>
          <span className="font-mono text-slate-900 font-medium">28nm / 14nm FinFET</span>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-50 border border-slate-200 text-xs">
          <div className="w-2 h-2 rounded-full bg-cyan-500 status-pulse" />
          <span className="text-slate-500">Platform:</span>
          <span className="font-mono text-cyan-700 font-semibold">5 Modules Active</span>
        </div>

        <StatusBadge variant="cyan" text="Engine Online" icon={Activity} />
      </div>
    </header>
  );
}
