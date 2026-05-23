import * as fs from 'fs';
import * as path from 'path';
import {
  loadHistoryStore,
  saveHistoryStore,
  appendHistoryEntry,
  getHistoryForService,
  pruneHistory,
  DriftHistoryEntry,
  DriftHistoryStore,
} from './historyManager';

const TEST_PATH = '/tmp/driftlog-test-history.json';

const sampleEntry: DriftHistoryEntry = {
  timestamp: '2024-01-01T00:00:00.000Z',
  service: 'auth-service',
  driftedKeys: ['env.PORT', 'replicas'],
  totalDrifted: 2,
  snapshotId: 'snap-001',
};

afterEach(() => {
  if (fs.existsSync(TEST_PATH)) {
    fs.unlinkSync(TEST_PATH);
  }
});

describe('loadHistoryStore', () => {
  it('returns empty store when file does not exist', () => {
    const store = loadHistoryStore('/tmp/nonexistent-history.json');
    expect(store).toEqual({ entries: [] });
  });

  it('loads existing store from file', () => {
    const data: DriftHistoryStore = { entries: [sampleEntry] };
    fs.writeFileSync(TEST_PATH, JSON.stringify(data), 'utf-8');
    const store = loadHistoryStore(TEST_PATH);
    expect(store.entries).toHaveLength(1);
    expect(store.entries[0].service).toBe('auth-service');
  });
});

describe('saveHistoryStore', () => {
  it('writes store to disk and can be reloaded', () => {
    const store: DriftHistoryStore = { entries: [sampleEntry] };
    saveHistoryStore(store, TEST_PATH);
    const loaded = loadHistoryStore(TEST_PATH);
    expect(loaded.entries).toHaveLength(1);
    expect(loaded.entries[0].snapshotId).toBe('snap-001');
  });
});

describe('appendHistoryEntry', () => {
  it('appends a new entry without mutating original store', () => {
    const store: DriftHistoryStore = { entries: [] };
    const updated = appendHistoryEntry(store, sampleEntry);
    expect(updated.entries).toHaveLength(1);
    expect(store.entries).toHaveLength(0);
  });
});

describe('getHistoryForService', () => {
  it('filters entries by service name', () => {
    const other: DriftHistoryEntry = { ...sampleEntry, service: 'billing-service' };
    const store: DriftHistoryStore = { entries: [sampleEntry, other] };
    const result = getHistoryForService(store, 'auth-service');
    expect(result).toHaveLength(1);
    expect(result[0].service).toBe('auth-service');
  });
});

describe('pruneHistory', () => {
  it('keeps only the last N entries', () => {
    const entries: DriftHistoryEntry[] = Array.from({ length: 10 }, (_, i) => ({
      ...sampleEntry,
      timestamp: `2024-01-0${i + 1}T00:00:00.000Z`,
    }));
    const store: DriftHistoryStore = { entries };
    const pruned = pruneHistory(store, 3);
    expect(pruned.entries).toHaveLength(3);
    expect(pruned.entries[2].timestamp).toBe('2024-01-010T00:00:00.000Z');
  });
});
