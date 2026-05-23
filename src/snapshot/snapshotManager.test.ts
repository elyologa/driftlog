import fs from 'fs';
import os from 'os';
import path from 'path';
import {
  createSnapshot,
  loadSnapshotStore,
  saveSnapshotStore,
  upsertSnapshot,
  getSnapshot,
  listSnapshots,
} from './snapshotManager';
import { SnapshotStore } from './types';

describe('snapshotManager', () => {
  const tmpDir = os.tmpdir();
  const storeFile = path.join(tmpDir, 'driftlog-test', 'snapshots.json');

  afterEach(() => {
    if (fs.existsSync(storeFile)) fs.unlinkSync(storeFile);
  });

  test('createSnapshot builds a valid snapshot', () => {
    const snap = createSnapshot('svc-a', { port: 3000 }, 'yaml');
    expect(snap.serviceId).toBe('svc-a');
    expect(snap.config).toEqual({ port: 3000 });
    expect(snap.source).toBe('yaml');
    expect(snap.capturedAt).toBeTruthy();
  });

  test('loadSnapshotStore returns empty store when file missing', () => {
    const store = loadSnapshotStore('/nonexistent/path/store.json');
    expect(store.snapshots).toHaveLength(0);
    expect(store.version).toBe(1);
  });

  test('saveSnapshotStore and loadSnapshotStore round-trip', () => {
    const store: SnapshotStore = {
      snapshots: [createSnapshot('svc-b', { replicas: 2 })],
      version: 1,
      lastUpdated: '',
    };
    saveSnapshotStore(storeFile, store);
    const loaded = loadSnapshotStore(storeFile);
    expect(loaded.snapshots).toHaveLength(1);
    expect(loaded.snapshots[0].serviceId).toBe('svc-b');
  });

  test('upsertSnapshot adds new snapshot', () => {
    const store = loadSnapshotStore('/nonexistent/store.json');
    const snap = createSnapshot('svc-c', { env: 'prod' });
    const diff = upsertSnapshot(store, snap);
    expect(diff.isNew).toBe(true);
    expect(diff.before).toBeNull();
    expect(store.snapshots).toHaveLength(1);
  });

  test('upsertSnapshot updates existing snapshot', () => {
    const store = loadSnapshotStore('/nonexistent/store.json');
    upsertSnapshot(store, createSnapshot('svc-d', { port: 80 }));
    const diff = upsertSnapshot(store, createSnapshot('svc-d', { port: 443 }));
    expect(diff.isNew).toBe(false);
    expect(diff.before?.config).toEqual({ port: 80 });
    expect(store.snapshots).toHaveLength(1);
  });

  test('getSnapshot retrieves by serviceId', () => {
    const store = loadSnapshotStore('/nonexistent/store.json');
    upsertSnapshot(store, createSnapshot('svc-e', { timeout: 30 }));
    const found = getSnapshot(store, 'svc-e');
    expect(found?.config).toEqual({ timeout: 30 });
    expect(getSnapshot(store, 'missing')).toBeUndefined();
  });

  test('listSnapshots returns all snapshots', () => {
    const store = loadSnapshotStore('/nonexistent/store.json');
    upsertSnapshot(store, createSnapshot('svc-f', {}));
    upsertSnapshot(store, createSnapshot('svc-g', {}));
    expect(listSnapshots(store)).toHaveLength(2);
  });
});
