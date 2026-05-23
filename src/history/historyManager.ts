import * as fs from 'fs';
import * as path from 'path';

export interface DriftHistoryEntry {
  timestamp: string;
  service: string;
  driftedKeys: string[];
  totalDrifted: number;
  snapshotId?: string;
}

export interface DriftHistoryStore {
  entries: DriftHistoryEntry[];
}

const DEFAULT_HISTORY_PATH = '.driftlog/history.json';

export function loadHistoryStore(filePath: string = DEFAULT_HISTORY_PATH): DriftHistoryStore {
  if (!fs.existsSync(filePath)) {
    return { entries: [] };
  }
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw) as DriftHistoryStore;
}

export function saveHistoryStore(
  store: DriftHistoryStore,
  filePath: string = DEFAULT_HISTORY_PATH
): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, JSON.stringify(store, null, 2), 'utf-8');
}

export function appendHistoryEntry(
  store: DriftHistoryStore,
  entry: DriftHistoryEntry
): DriftHistoryStore {
  return {
    entries: [...store.entries, entry],
  };
}

export function getHistoryForService(
  store: DriftHistoryStore,
  service: string
): DriftHistoryEntry[] {
  return store.entries.filter((e) => e.service === service);
}

export function pruneHistory(
  store: DriftHistoryStore,
  maxEntries: number
): DriftHistoryStore {
  const pruned = store.entries.slice(-maxEntries);
  return { entries: pruned };
}
