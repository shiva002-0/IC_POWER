import React from 'react';
import {
  LayoutDashboard,
  Zap,
  Sparkles,
  GitCompare,
  History,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

/**
 * Sidebar Component
 * Primary navigation for the 5 project modules with clean white aesthetic
 * and electric-cyan active highlights.
 */
export default function Sidebar({ activeTab, onSelectTab }) {
  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: 'Active',
      description: 'Project overview & roadmap',
    },
    {
      id: 'power-analysis',
      label: 'Power Analysis',
      icon: Zap,
      badge: 'Active',
      description: 'Dynamic power calculator engine',
    },
    {
      id: 'ai-optimization',
      label: 'AI Optimization Lab',
      icon: Sparkles,
      badge: 'Active',
      description: 'Deterministic low-power search',
    },
    {
      id: 'scenario-comparison',
      label: 'Scenario Comparison',
      icon: GitCompare,
      badge: 'Active',
      description: 'PPA trade-off & Pareto matrix',
    },
    {
      id: 'experiment-history',
      label: 'Experiment History',
      icon: History,
      badge: 'Active',
      description: 'Run registry & parameter audits',
    },
  ];

  return (
    <aside className="w-full lg:w-72 bg-white border-r border-slate-200/90 flex flex-col justify-between shrink-0 min-h-[calc(100vh-65px)] shadow-xs">
      {/* Navigation Links */}
      <div className="p-4 space-y-1.5">
        <div className="px-3 py-2 text-[11px] font-mono uppercase tracking-wider text-slate-500 font-semibold flex items-center justify-between">
          <span>Navigation Modules</span>
          <span className="text-[10px] text-cyan-600 font-semibold bg-cyan-50 px-1.5 py-0.5 rounded border border-cyan-100">
            5 Views
          </span>
        </div>

        <nav className="space-y-1" aria-label="Main Navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full text-left px-3.5 py-3 rounded-lg text-sm transition-all duration-150 flex items-center justify-between group cursor-pointer ${
                  isActive
                    ? 'bg-cyan-50/80 text-cyan-900 border border-cyan-200/80 shadow-xs font-semibold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`p-1.5 rounded-md transition-colors ${
                      isActive
                        ? 'bg-cyan-100 text-cyan-700'
                        : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200/70 group-hover:text-slate-700'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                  </div>
                  <div className="truncate">
                    <div className="text-xs font-semibold leading-snug truncate">
                      {item.label}
                    </div>
                    <div className="text-[11px] text-slate-500 font-normal truncate">
                      {item.description}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                      isActive
                        ? 'bg-cyan-100 text-cyan-800 font-bold border border-cyan-200'
                        : 'bg-slate-100 text-slate-500 border border-slate-200/60'
                    }`}
                  >
                    {item.badge}
                  </span>
                  <ChevronRight
                    className={`w-3.5 h-3.5 transition-transform duration-150 ${
                      isActive
                        ? 'text-cyan-600 translate-x-0.5'
                        : 'text-slate-400 group-hover:text-slate-600'
                    }`}
                  />
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Sidebar Footer Information Card */}
      <div className="p-4 border-t border-slate-200 m-3 bg-slate-50/80 rounded-xl border border-slate-200">
        <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-slate-900">
          <ShieldCheck className="w-4 h-4 text-cyan-600" />
          <span>Engineering Integrity</span>
        </div>
        <p className="text-[11px] text-slate-600 leading-relaxed mb-3">
          All 5 EDA modules active &amp; verified: Dynamic Power Analysis, AI Optimization Lab, PPA Trade-Off Matrix, and Persistent Registry.
        </p>
        <div className="space-y-1 text-[11px] font-mono text-slate-500 pt-2 border-t border-slate-200">
          <div className="flex justify-between">
            <span>Discipline:</span>
            <span className="text-slate-800 font-medium">ECE / VLSI EDA</span>
          </div>
          <div className="flex justify-between">
            <span>Framework:</span>
            <span className="text-cyan-700 font-semibold">React 19 + Vite</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
