/**
 * Digital IC Low-Power Optimization Lab - Report Export Utilities
 * Provides CSV export and browser Print-to-PDF formatting for tape-out sign-off reports.
 * Complies with RFC 4180 CSV standard and safe Node.js/browser isomorphic execution.
 */

/**
 * Escapes a string value for safe CSV encoding according to RFC 4180.
 * @param {any} val
 * @returns {string}
 */
export function escapeCsvField(val) {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Generates an RFC 4180 compliant CSV string for a single experiment record.
 * @param {Object} experiment - Verified experiment record from storage
 * @returns {string} CSV formatted content
 */
export function generateExperimentCsv(experiment) {
  if (!experiment || typeof experiment !== 'object') {
    throw new TypeError('Experiment record must be a valid object.');
  }

  const baseline = experiment.baseline || {};
  const candidate = experiment.candidate || {};
  const comparison = experiment.comparison || {};
  const verification = experiment.verification || {};
  const violations = Array.isArray(verification.violations) ? verification.violations.join('; ') : '';

  const headers = [
    'Experiment ID',
    'Experiment Title',
    'Recorded Timestamp',
    'ISO Recorded Date',
    'Optimization Goal',
    'Switching Factor (alpha)',
    'Effective Capacitance (pF)',
    'Baseline Voltage (V)',
    'Baseline Clock (MHz)',
    'Baseline Power (mW)',
    'Candidate Voltage (V)',
    'Candidate Clock (MHz)',
    'Candidate Power (mW)',
    'Delta Power Savings (mW)',
    'Power Reduction (%)',
    'Voltage Shift (V)',
    'Frequency Shift (MHz)',
    'Independent Verification Status',
    'Verification Statement',
    'Constraint Violations',
    'Tags',
  ];

  const row = [
    escapeCsvField(experiment.id || 'N/A'),
    escapeCsvField(experiment.experimentName || 'Untitled Experiment'),
    escapeCsvField(experiment.timestamp || ''),
    escapeCsvField(experiment.recordedAt || ''),
    escapeCsvField(experiment.goal || ''),
    escapeCsvField(baseline.alpha ?? 'N/A'),
    escapeCsvField(baseline.effectiveCapacitancePf ?? 'N/A'),
    escapeCsvField(baseline.supplyVoltageV ?? 'N/A'),
    escapeCsvField(baseline.clockFrequencyMhz ?? 'N/A'),
    escapeCsvField(baseline.powerMilliwatts !== undefined ? Number(baseline.powerMilliwatts).toFixed(4) : 'N/A'),
    escapeCsvField(candidate.voltageV ?? candidate.supplyVoltageV ?? 'N/A'),
    escapeCsvField(candidate.frequencyMhz ?? candidate.clockFrequencyMhz ?? 'N/A'),
    escapeCsvField(candidate.powerMilliwatts !== undefined ? Number(candidate.powerMilliwatts).toFixed(4) : 'N/A'),
    escapeCsvField(comparison.deltaPowerMw !== undefined ? Number(comparison.deltaPowerMw).toFixed(4) : 'N/A'),
    escapeCsvField(comparison.percentageReduction !== undefined ? Number(comparison.percentageReduction).toFixed(2) : 'N/A'),
    escapeCsvField(comparison.deltaVoltageV !== undefined ? Number(comparison.deltaVoltageV).toFixed(3) : 'N/A'),
    escapeCsvField(comparison.deltaFrequencyMhz !== undefined ? Number(comparison.deltaFrequencyMhz) : 'N/A'),
    escapeCsvField(verification.isVerified ? 'VERIFIED_PASSED' : 'UNVERIFIED_OR_FAILED'),
    escapeCsvField(verification.verificationStatement || 'No verification statement available.'),
    escapeCsvField(violations || 'None'),
    escapeCsvField(Array.isArray(experiment.tags) ? experiment.tags.join('; ') : ''),
  ];

  return `${headers.join(',')}\r\n${row.join(',')}\r\n`;
}

/**
 * Generates an RFC 4180 compliant CSV string for the entire experiment registry.
 * @param {Array<Object>} experiments - Array of experiment records
 * @returns {string} CSV formatted content
 */
export function generateRegistryCsv(experiments) {
  if (!Array.isArray(experiments)) {
    throw new TypeError('Experiments must be an array.');
  }

  const headers = [
    'Experiment ID',
    'Experiment Title',
    'ISO Recorded Date',
    'Optimization Goal',
    'Switching Factor (alpha)',
    'Capacitance (pF)',
    'Baseline Vdd (V)',
    'Baseline Clock (MHz)',
    'Baseline Power (mW)',
    'Optimal Vdd (V)',
    'Optimal Clock (MHz)',
    'Optimal Power (mW)',
    'Power Savings (mW)',
    'Savings (%)',
    'Verification Status',
    'Tags',
  ];

  const rows = experiments.map((exp) => {
    const baseline = exp.baseline || {};
    const candidate = exp.candidate || {};
    const comparison = exp.comparison || {};
    const verification = exp.verification || {};

    return [
      escapeCsvField(exp.id || 'N/A'),
      escapeCsvField(exp.experimentName || 'Untitled'),
      escapeCsvField(exp.recordedAt || ''),
      escapeCsvField(exp.goal || ''),
      escapeCsvField(baseline.alpha ?? 'N/A'),
      escapeCsvField(baseline.effectiveCapacitancePf ?? 'N/A'),
      escapeCsvField(baseline.supplyVoltageV ?? 'N/A'),
      escapeCsvField(baseline.clockFrequencyMhz ?? 'N/A'),
      escapeCsvField(baseline.powerMilliwatts !== undefined ? Number(baseline.powerMilliwatts).toFixed(4) : 'N/A'),
      escapeCsvField(candidate.voltageV ?? candidate.supplyVoltageV ?? 'N/A'),
      escapeCsvField(candidate.frequencyMhz ?? candidate.clockFrequencyMhz ?? 'N/A'),
      escapeCsvField(candidate.powerMilliwatts !== undefined ? Number(candidate.powerMilliwatts).toFixed(4) : 'N/A'),
      escapeCsvField(comparison.deltaPowerMw !== undefined ? Number(comparison.deltaPowerMw).toFixed(4) : 'N/A'),
      escapeCsvField(comparison.percentageReduction !== undefined ? Number(comparison.percentageReduction).toFixed(2) : 'N/A'),
      escapeCsvField(verification.isVerified ? 'VERIFIED' : 'FAILED'),
      escapeCsvField(Array.isArray(exp.tags) ? exp.tags.join('; ') : ''),
    ].join(',');
  });

  return `${headers.join(',')}\r\n${rows.join('\r\n')}\r\n`;
}

/**
 * Downloads a CSV string as a named file in the browser client.
 * Safe no-op in non-browser / Node.js test environments.
 * @param {string} csvContent
 * @param {string} filename
 * @returns {boolean} True if download was initiated
 */
export function downloadCsvFile(csvContent, filename = 'olympus_report.csv') {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return false;
  }

  try {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return true;
  } catch (err) {
    console.error('Failed to trigger CSV download:', err);
    return false;
  }
}

/**
 * Triggers the browser's native Print dialog, enabling "Save as PDF".
 * Safe no-op in non-browser environments.
 * @returns {boolean} True if print was called
 */
export function triggerPrintReport() {
  if (typeof window !== 'undefined' && typeof window.print === 'function') {
    window.print();
    return true;
  }
  return false;
}
