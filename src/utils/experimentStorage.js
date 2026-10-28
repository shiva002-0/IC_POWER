/**
 * Experiment Registry & Persistent Storage Utility
 * Stores verified optimization runs for the PPA trade-off matrix and audit logs.
 * Works seamlessly in both browser (window.localStorage) and Node.js test environments.
 */

const STORAGE_KEY = 'olympus_ic_power_experiments_v1';

// In-memory fallback for non-browser environments (e.g. Node.js unit tests)
let inMemoryStore = [];

/**
 * Checks if localStorage is available in the current runtime.
 * @returns {boolean}
 */
function isLocalStorageAvailable() {
  try {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
  } catch {
    return false;
  }
}

/**
 * Retrieves all stored experiment records, sorted by newest first.
 * @returns {Array<Object>}
 */
export function getExperiments() {
  if (isLocalStorageAvailable()) {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      console.warn('Failed to parse experiment records from localStorage:', err);
      return [];
    }
  }
  return [...inMemoryStore];
}

/**
 * Saves a verified experiment record to persistent storage.
 * @param {Object} experiment
 * @returns {Object} Stored experiment with assigned id and timestamp
 */
export function saveExperiment(experiment) {
  if (!experiment || typeof experiment !== 'object') {
    throw new TypeError('Experiment payload must be a valid object.');
  }

  const timestamp = experiment.timestamp || Date.now();
  const dateStr = new Date(timestamp).toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  const id = experiment.id || `EXP-${dateStr}-${randomSuffix}`;

  const record = {
    ...experiment,
    id,
    timestamp,
    recordedAt: new Date(timestamp).toISOString(),
  };

  if (isLocalStorageAvailable()) {
    const list = getExperiments();
    const existingIdx = list.findIndex((e) => e.id === id);
    if (existingIdx >= 0) {
      list[existingIdx] = record;
    } else {
      list.unshift(record);
    }
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (err) {
      console.warn('Could not persist experiment to localStorage:', err);
    }
  } else {
    const existingIdx = inMemoryStore.findIndex((e) => e.id === id);
    if (existingIdx >= 0) {
      inMemoryStore[existingIdx] = record;
    } else {
      inMemoryStore.unshift(record);
    }
  }

  return record;
}

/**
 * Finds an experiment by its unique ID.
 * @param {string} id
 * @returns {Object|null}
 */
export function getExperimentById(id) {
  const list = getExperiments();
  return list.find((e) => e.id === id) || null;
}

/**
 * Deletes an experiment by ID.
 * @param {string} id
 * @returns {boolean} True if found and deleted
 */
export function deleteExperiment(id) {
  if (isLocalStorageAvailable()) {
    const list = getExperiments();
    const filtered = list.filter((e) => e.id !== id);
    const deleted = filtered.length < list.length;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return deleted;
  }
  const prevLen = inMemoryStore.length;
  inMemoryStore = inMemoryStore.filter((e) => e.id !== id);
  return inMemoryStore.length < prevLen;
}

/**
 * Clears all experiment records (useful for testing and reset).
 */
export function clearExperiments() {
  if (isLocalStorageAvailable()) {
    window.localStorage.removeItem(STORAGE_KEY);
  }
  inMemoryStore = [];
}
