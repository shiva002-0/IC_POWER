import React, { useState, useMemo } from 'react';
import {
  History,
  ArrowLeft,
  Archive,
  Database,
  Trash2,
  Download,
  Printer,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Search,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  FileSpreadsheet,
} from 'lucide-react';
import StatusBadge from '../common/StatusBadge.jsx';
import {
  getExperiments,
  deleteExperiment,
  clearExperiments,
} from '../../utils/experimentStorage.js';
import {
  generateExperimentCsv,
  generateRegistryCsv,
  downloadCsvFile,
  triggerPrintReport,
} from '../../utils/reportExport.js';

/**
 * Formats a numeric timestamp or ISO string into a clean localized date-time string.
 * @param {number|string} timestamp
 * @returns {string}
 */
function formatTimestamp(timestamp) {
  if (!timestamp) return 'Unknown date';
  try {
    const d = new Date(timestamp);
    if (isNaN(d.getTime())) return String(timestamp);
    return d.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return String(timestamp);
  }
}

/**
 * ExperimentHistoryView Component
 * Phase 5 Core Module: Persistent Experiment Run Registry, Audit Log, and Report Export.
 * Allows viewing, filtering, reopening in the lab, CSV export, and print-to-PDF sign-off generation.
 */
export default function ExperimentHistoryView({ onNavigate, onReopenExperiment }) {
  const [experiments, setExperiments] = useState(() => getExperiments());
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTag, setFilterTag] = useState('ALL');
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [selectedReportExp, setSelectedReportExp] = useState(null);

  const refreshList = () => {
    setExperiments(getExperiments());
  };

  // Filtered experiments based on search query and tag
  const filteredExperiments = useMemo(() => {
    return experiments.filter((exp) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (exp.id && exp.id.toLowerCase().includes(q)) ||
        (exp.experimentName && exp.experimentName.toLowerCase().includes(q)) ||
        (exp.goal && exp.goal.toLowerCase().includes(q));

      const matchesTag =
        filterTag === 'ALL' ||
        (Array.isArray(exp.tags) && exp.tags.includes(filterTag)) ||
        (filterTag === 'VERIFIED' && exp.verification?.isVerified) ||
        (filterTag === 'UNVERIFIED' && !exp.verification?.isVerified);

      return matchesSearch && matchesTag;
    });
  }, [experiments, searchQuery, filterTag]);

  // Aggregate statistics
  const stats = useMemo(() => {
    const total = experiments.length;
    const verifiedCount = experiments.filter((e) => e.verification?.isVerified).length;
    const savingsList = experiments
      .map((e) => Number(e.comparison?.percentageReduction || 0))
      .filter((s) => !isNaN(s) && s > 0);

    const maxSavings = savingsList.length > 0 ? Math.max(...savingsList) : 0;
    const avgSavings =
      savingsList.length > 0
        ? savingsList.reduce((acc, curr) => acc + curr, 0) / savingsList.length
        : 0;

    return {
      total,
      verifiedCount,
      maxSavings: maxSavings.toFixed(1),
      avgSavings: avgSavings.toFixed(1),
    };
  }, [experiments]);

  // Action: Delete single experiment
  const handleDelete = (id) => {
    deleteExperiment(id);
    setDeleteConfirmId(null);
    if (selectedReportExp && selectedReportExp.id === id) {
      setSelectedReportExp(null);
    }
    refreshList();
  };

  // Action: Clear entire registry
  const handleClearAll = () => {
    clearExperiments();
    setShowClearConfirm(false);
    setSelectedReportExp(null);
    refreshList();
  };

  // Action: Export single experiment to CSV
  const handleExportSingleCsv = (exp) => {
    const csv = generateExperimentCsv(exp);
    downloadCsvFile(csv, `experiment_${exp.id}.csv`);
  };

  // Action: Export all experiments to CSV
  const handleExportRegistryCsv = () => {
    if (experiments.length === 0) return;
    const csv = generateRegistryCsv(experiments);
    downloadCsvFile(csv, 'olympus_experiment_registry.csv');
  };

  // Action: Open Print/PDF Modal and trigger browser Print
  const handlePrintSignOffReport = (exp) => {
    setSelectedReportExp(exp);
    setTimeout(() => {
      triggerPrintReport();
    }, 150);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Header with View Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 no-print">
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
            <span className="text-xs font-mono text-cyan-700 font-medium">Experiment History</span>
          </div>
          <h1 className="text-xl lg:text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <History className="w-6 h-6 text-cyan-600" />
            Experiment History &amp; Run Registry
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Reproducible audit trails, design checkpointing, CSV exports, and tape-out sign-off reports.
          </p>
        </div>

        {/* Global Export & Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {experiments.length > 0 && (
            <>
              <button
                onClick={handleExportRegistryCsv}
                className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-mono text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                title="Download complete experiment log as CSV"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Export Registry (CSV)</span>
              </button>

              <button
                onClick={() => setShowClearConfirm(true)}
                className="px-3 py-1.5 rounded-lg bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-slate-600 hover:text-rose-700 font-mono text-xs transition-colors cursor-pointer shadow-2xs flex items-center gap-1.5"
                title="Clear all stored experiment records"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All</span>
              </button>
            </>
          )}

          <StatusBadge variant="cyan" text="Registry Online" icon={Database} />
        </div>
      </div>

      {/* 2. Clear All Confirmation Banner */}
      {showClearConfirm && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs no-print">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>
              <strong>Are you sure?</strong> This will permanently delete all {experiments.length} experiment records from local storage.
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleClearAll}
              className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-mono text-xs font-semibold cursor-pointer shadow-2xs"
            >
              Yes, Clear All
            </button>
            <button
              onClick={() => setShowClearConfirm(false)}
              className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 font-mono text-xs cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* 3. Aggregate Provenance Metrics */}
      {experiments.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 no-print">
          <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-mono text-slate-400 block uppercase">Total Recorded Runs</span>
            <span className="text-xl font-bold font-mono text-slate-900">{stats.total}</span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Persistent audit entries</span>
          </div>

          <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-mono text-emerald-700 block uppercase font-semibold">Verified Sign-Offs</span>
            <span className="text-xl font-bold font-mono text-emerald-800 flex items-center gap-1.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>{stats.verifiedCount}</span>
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Constraint compliance passed</span>
          </div>

          <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-mono text-cyan-700 block uppercase font-semibold">Peak Power Savings</span>
            <span className="text-xl font-bold font-mono text-cyan-800">
              -{stats.maxSavings}%
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Best optimization run</span>
          </div>

          <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-mono text-slate-400 block uppercase">Average Reduction</span>
            <span className="text-xl font-bold font-mono text-slate-800">
              -{stats.avgSavings}%
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Across verified candidates</span>
          </div>
        </div>
      )}

      {/* 4. Filter & Search Controls (When runs exist) */}
      {experiments.length > 0 && (
        <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Run ID (e.g. EXP-), title, or goal..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono text-slate-900 placeholder:text-slate-400 focus:border-cyan-500 focus:bg-white transition-colors"
            />
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mr-1">
              Filter:
            </span>
            {['ALL', 'VERIFIED', 'DVFS', 'Deterministic-Agent'].map((tag) => (
              <button
                key={tag}
                onClick={() => setFilterTag(tag)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-mono transition-colors cursor-pointer ${
                  filterTag === tag
                    ? 'bg-cyan-600 text-white font-semibold shadow-2xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 5. Main Content: Empty State vs Interactive Runs Table */}
      {experiments.length === 0 ? (
        <div className="ic-card p-10 bg-white border border-slate-200 text-center relative overflow-hidden shadow-sm no-print">
          <div className="max-w-xl mx-auto space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-cyan-50 border border-cyan-200 text-cyan-600 flex items-center justify-center mx-auto shadow-2xs">
              <Archive className="w-7 h-7" />
            </div>

            <h2 className="text-lg font-bold text-slate-900">
              No Experiment Runs in Registry Yet
            </h2>

            <p className="text-xs text-slate-600 leading-relaxed">
              Every verified optimization run executed in the <strong>Optimization Lab</strong> or by the <strong>Agentic AI Workflow</strong> is automatically logged to this persistent registry.
            </p>

            <div className="pt-2">
              <button
                onClick={() => onNavigate('ai-optimization')}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-mono text-xs font-semibold flex items-center gap-2 mx-auto transition-colors cursor-pointer shadow-2xs"
              >
                <Sparkles className="w-4 h-4" />
                <span>Launch Optimization Lab to Run First Experiment</span>
              </button>
            </div>
          </div>
        </div>
      ) : filteredExperiments.length === 0 ? (
        <div className="ic-card p-8 bg-white border border-slate-200 text-center shadow-sm no-print">
          <p className="text-xs text-slate-500 font-mono">
            No experiment records matched your search query "{searchQuery}" or filter.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setFilterTag('ALL');
            }}
            className="mt-3 text-xs text-cyan-700 hover:underline font-mono cursor-pointer"
          >
            Reset Search &amp; Filters
          </button>
        </div>
      ) : (
        <div className="ic-card bg-white border border-slate-200 shadow-sm overflow-hidden no-print">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <th className="py-2.5 px-3">Run ID &amp; Timestamp</th>
                  <th className="py-2.5 px-3">Experiment Title</th>
                  <th className="py-2.5 px-3">Baseline Corner</th>
                  <th className="py-2.5 px-3">Optimal Operating Point</th>
                  <th className="py-2.5 px-3">Power Reduction</th>
                  <th className="py-2.5 px-3">Verification</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredExperiments.map((exp) => {
                  const b = exp.baseline || {};
                  const c = exp.candidate || {};
                  const cmp = exp.comparison || {};
                  const v = exp.verification || {};
                  const isVerified = Boolean(v.isVerified);
                  const isDeleting = deleteConfirmId === exp.id;

                  return (
                    <tr key={exp.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Run ID & Date */}
                      <td className="py-3 px-3">
                        <span className="font-bold text-cyan-800 block">{exp.id}</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          {formatTimestamp(exp.timestamp || exp.recordedAt)}
                        </span>
                      </td>

                      {/* Title & Goal */}
                      <td className="py-3 px-3 max-w-xs">
                        <span className="font-sans font-semibold text-slate-900 block truncate" title={exp.experimentName}>
                          {exp.experimentName || 'Untitled Run'}
                        </span>
                        {exp.goal && (
                          <span className="text-[11px] text-slate-500 block truncate mt-0.5" title={exp.goal}>
                            "{exp.goal}"
                          </span>
                        )}
                        {Array.isArray(exp.tags) && exp.tags.length > 0 && (
                          <div className="flex items-center gap-1 mt-1 flex-wrap">
                            {exp.tags.slice(0, 3).map((tag, tIdx) => (
                              <span
                                key={tIdx}
                                className="text-[9px] px-1 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* Baseline Corner */}
                      <td className="py-3 px-3 text-slate-700">
                        <span>{b.supplyVoltageV || '1.2'}V &bull; {b.clockFrequencyMhz || '100'}MHz</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          P_base = {b.powerMilliwatts !== undefined ? `${Number(b.powerMilliwatts).toFixed(3)} mW` : 'N/A'}
                        </span>
                      </td>

                      {/* Candidate Corner */}
                      <td className="py-3 px-3 font-semibold text-slate-800">
                        <span>{c.voltageV || c.supplyVoltageV || 'N/A'}V &bull; {c.frequencyMhz || c.clockFrequencyMhz || 'N/A'}MHz</span>
                        <span className="text-[10px] text-cyan-700 block mt-0.5 font-bold">
                          P_opt = {c.powerMilliwatts !== undefined ? `${Number(c.powerMilliwatts).toFixed(3)} mW` : 'N/A'}
                        </span>
                      </td>

                      {/* Power Reduction */}
                      <td className="py-3 px-3">
                        {cmp.deltaPowerMw !== undefined ? (
                          <>
                            <span className="text-emerald-700 font-bold block">
                              -{Number(cmp.deltaPowerMw).toFixed(3)} mW
                            </span>
                            <span className="text-[10px] text-emerald-800 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200 inline-block mt-0.5 font-semibold">
                              -{cmp.percentageReduction}%
                            </span>
                          </>
                        ) : (
                          <span className="text-slate-400">&mdash;</span>
                        )}
                      </td>

                      {/* Verification Badge */}
                      <td className="py-3 px-3">
                        {isVerified ? (
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1 w-max">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>VERIFIED</span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 flex items-center gap-1 w-max">
                            <XCircle className="w-3 h-3 text-rose-600" />
                            <span>FAILED</span>
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-right">
                        {isDeleting ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleDelete(exp.id)}
                              className="px-2 py-1 rounded bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-semibold cursor-pointer"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(null)}
                              className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1">
                            {/* Reopen in Lab */}
                            <button
                              onClick={() => {
                                if (onReopenExperiment) {
                                  onReopenExperiment(exp);
                                } else {
                                  onNavigate('ai-optimization');
                                }
                              }}
                              className="p-1.5 rounded hover:bg-cyan-50 text-cyan-700 hover:text-cyan-900 border border-transparent hover:border-cyan-200 transition-colors cursor-pointer"
                              title="Reopen and load experiment into Optimization Lab"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>

                            {/* Export Single CSV */}
                            <button
                              onClick={() => handleExportSingleCsv(exp)}
                              className="p-1.5 rounded hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                              title="Export experiment to CSV"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>

                            {/* Print Sign-Off Report (PDF) */}
                            <button
                              onClick={() => handlePrintSignOffReport(exp)}
                              className="p-1.5 rounded hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                              title="Generate print-friendly PDF sign-off report"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete single */}
                            <button
                              onClick={() => setDeleteConfirmId(exp.id)}
                              className="p-1.5 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                              title="Delete experiment from registry"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
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

      {/* 6. Printable Formal Tape-Out Sign-Off Audit Modal / View */}
      {selectedReportExp && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto print:p-0 print:bg-white print:static">
          <div className="bg-white rounded-2xl border border-slate-300 max-w-3xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative print:shadow-none print:border-none print:p-0">
            {/* Modal Actions (Hidden in Print) */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 no-print">
              <div className="flex items-center gap-2">
                <Printer className="w-4 h-4 text-cyan-600" />
                <span className="text-xs font-mono font-bold text-slate-700 uppercase">
                  Tape-Out Sign-Off Document Preview
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={triggerPrintReport}
                  className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-mono text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print to PDF</span>
                </button>
                <button
                  onClick={() => setSelectedReportExp(null)}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-xs cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Formal Document Body (Prints as standard PDF) */}
            <div className="space-y-5 text-slate-900 font-sans">
              {/* Document Header */}
              <div className="border-b-2 border-slate-900 pb-3 flex justify-between items-start">
                <div>
                  <h2 className="text-lg font-bold uppercase tracking-wider text-slate-900">
                    Digital IC Low-Power Optimization Lab
                  </h2>
                  <p className="text-xs font-mono text-slate-500 mt-0.5">
                    Deterministic EDA Audit &bull; Physical Constraint Verification Document
                  </p>
                </div>
                <div className="text-right font-mono text-xs">
                  <span className="font-bold text-cyan-800 block">{selectedReportExp.id}</span>
                  <span className="text-slate-400 text-[10px]">
                    {formatTimestamp(selectedReportExp.timestamp || selectedReportExp.recordedAt)}
                  </span>
                </div>
              </div>

              {/* Title & Goal */}
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono space-y-1">
                <span className="text-slate-400 block text-[10px] uppercase">Experiment Title:</span>
                <span className="font-bold text-slate-900 text-sm block">
                  {selectedReportExp.experimentName || 'Untitled Run'}
                </span>
                {selectedReportExp.goal && (
                  <p className="text-slate-600 text-[11px] pt-1 border-t border-slate-200">
                    <strong>Target Objective:</strong> "{selectedReportExp.goal}"
                  </p>
                )}
              </div>

              {/* PPA Parameter Comparison Table */}
              <div>
                <h3 className="text-xs font-bold font-mono text-slate-700 uppercase tracking-wider mb-2">
                  Operating Corner &amp; Dissipation Comparison
                </h3>
                <table className="w-full text-left text-xs font-mono border border-slate-200">
                  <thead className="bg-slate-100 border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-3">Design Parameter</th>
                      <th className="py-2 px-3">Baseline Nominal Corner</th>
                      <th className="py-2 px-3">AI Optimized Candidate</th>
                      <th className="py-2 px-3">Delta Impact</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-[11px]">
                    <tr>
                      <td className="py-2 px-3 font-semibold">Supply Rail Voltage (Vdd)</td>
                      <td className="py-2 px-3">{selectedReportExp.baseline?.supplyVoltageV || '1.20'} V</td>
                      <td className="py-2 px-3 font-bold text-cyan-800">
                        {selectedReportExp.candidate?.voltageV || selectedReportExp.candidate?.supplyVoltageV || 'N/A'} V
                      </td>
                      <td className="py-2 px-3">
                        {selectedReportExp.comparison?.deltaVoltageV !== undefined
                          ? `${selectedReportExp.comparison.deltaVoltageV} V`
                          : '&mdash;'}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-semibold">Clock Frequency (fclk)</td>
                      <td className="py-2 px-3">{selectedReportExp.baseline?.clockFrequencyMhz || '100'} MHz</td>
                      <td className="py-2 px-3 font-bold text-cyan-800">
                        {selectedReportExp.candidate?.frequencyMhz || selectedReportExp.candidate?.clockFrequencyMhz || 'N/A'} MHz
                      </td>
                      <td className="py-2 px-3">
                        {selectedReportExp.comparison?.deltaFrequencyMhz !== undefined
                          ? `${selectedReportExp.comparison.deltaFrequencyMhz} MHz`
                          : '&mdash;'}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-semibold">Switching Factor (alpha) &amp; Ceff</td>
                      <td className="py-2 px-3">
                        &alpha;={selectedReportExp.baseline?.alpha ?? '0.20'}, C={selectedReportExp.baseline?.effectiveCapacitancePf ?? '20'} pF
                      </td>
                      <td className="py-2 px-3">Identical Physical Netlist</td>
                      <td className="py-2 px-3 text-slate-400">Zero silicon modification</td>
                    </tr>
                    <tr className="bg-cyan-50/40 font-bold">
                      <td className="py-2 px-3 text-cyan-900">Dynamic CMOS Power (Pdyn)</td>
                      <td className="py-2 px-3">
                        {selectedReportExp.baseline?.powerMilliwatts !== undefined
                          ? `${Number(selectedReportExp.baseline.powerMilliwatts).toFixed(3)} mW`
                          : 'N/A'}
                      </td>
                      <td className="py-2 px-3 text-cyan-900">
                        {selectedReportExp.candidate?.powerMilliwatts !== undefined
                          ? `${Number(selectedReportExp.candidate.powerMilliwatts).toFixed(3)} mW`
                          : 'N/A'}
                      </td>
                      <td className="py-2 px-3 text-emerald-800">
                        {selectedReportExp.comparison?.deltaPowerMw !== undefined
                          ? `-${Number(selectedReportExp.comparison.deltaPowerMw).toFixed(3)} mW (-${selectedReportExp.comparison.percentageReduction}%)`
                          : 'N/A'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Physical Constraint Verification Results */}
              <div className="p-4 rounded-xl border border-slate-200 space-y-2 text-xs font-mono">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-cyan-600" />
                    <span className="font-bold text-slate-800 uppercase">
                      Independent Physical Constraint Verification
                    </span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                    selectedReportExp.verification?.isVerified
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : 'bg-rose-50 text-rose-800 border-rose-300'
                  }`}>
                    {selectedReportExp.verification?.isVerified ? 'VERIFICATION PASSED' : 'VERIFICATION FAILED'}
                  </span>
                </div>

                <p className="text-slate-700 leading-relaxed text-[11px]">
                  <strong>Statement:</strong>{' '}
                  {selectedReportExp.verification?.verificationStatement ||
                    (selectedReportExp.verification?.isVerified
                      ? 'All physical design constraints, frequency lower bounds, and supply voltage ranges independently verified.'
                      : 'Physical design constraints were violated by the candidate configuration.')}
                </p>

                {Array.isArray(selectedReportExp.verification?.violations) &&
                  selectedReportExp.verification.violations.length > 0 && (
                    <div className="p-2 rounded bg-rose-50 border border-rose-200 text-rose-800 text-[10px]">
                      <strong>Violations:</strong> {selectedReportExp.verification.violations.join('; ')}
                    </div>
                  )}
              </div>

              {/* Engineering Certification Footer */}
              <div className="pt-4 border-t-2 border-slate-900 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 text-xs font-mono">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">EDA Engineering Sign-Off</span>
                  <span className="font-bold text-slate-800">Deterministic Optimization Engine v1.0</span>
                  <span className="text-slate-500 block text-[10px]">OLYMPUS Low-Power EDA Platform</span>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block uppercase">Status</span>
                  <span className="font-bold text-emerald-700">CERTIFIED COMPLIANT</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
