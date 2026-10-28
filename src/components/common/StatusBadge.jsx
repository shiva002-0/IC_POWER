import React from 'react';

/**
 * StatusBadge Component
 * Displays a clean, technical status badge with high-contrast light theme styling.
 */
export default function StatusBadge({ variant = 'neutral', text, icon: Icon }) {
  const variantStyles = {
    teal: 'bg-cyan-50 text-cyan-800 border-cyan-200',
    cyan: 'bg-cyan-50 text-cyan-800 border-cyan-200',
    blue: 'bg-sky-50 text-sky-800 border-sky-200',
    amber: 'bg-amber-50 text-amber-800 border-amber-200',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200',
    purple: 'bg-purple-50 text-purple-800 border-purple-200',
    green: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  };

  const selectedStyle = variantStyles[variant] || variantStyles.neutral;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium border ${selectedStyle}`}
    >
      {Icon && <Icon className="w-3 h-3" />}
      {text}
    </span>
  );
}
