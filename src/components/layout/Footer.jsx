import React from 'react';

/**
 * Footer Component
 * Displays system status bar with light theme styling and electric-cyan status indicator.
 */
export default function Footer() {
  return (
    <footer className="w-full bg-white border-t border-slate-200/90 px-6 py-3 text-xs text-slate-500 flex flex-wrap items-center justify-between gap-4 shadow-2xs">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-cyan-500 status-pulse" />
        <span className="font-semibold text-slate-800">Platform Status:</span>
        <span className="text-slate-600">All 5 Modules Active (Power Analysis, AI Lab, PPA Matrix, Registry &amp; Exports)</span>
      </div>

      <div className="flex items-center gap-4 text-[11px] font-mono text-slate-500">
        <span className="hidden sm:inline">React 19 • Vite • JavaScript • Modern CSS</span>
        <span className="text-slate-300 hidden sm:inline">|</span>
        <span className="text-cyan-700 font-semibold">ECE EDA Software Lab</span>
      </div>
    </footer>
  );
}
