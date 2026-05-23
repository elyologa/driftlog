import fs from 'fs';
import path from 'path';
import { ServiceSnapshot, SnapshotStore, SnapshotDiff } from './types';

const STORE_VERSION = 1;

export function createSnapshot(
  serviceId: string,
  config: Record<string, unknown>,
  source: ServiceSnapshot['source'] = 'yaml'
): ServiceSnapshot {
  return {
    serviceId,
    capturedAt: new Date().toISOString(),
    config,
    source,
  };
}

export function loadSnapshotStore(filePath: string): SnapshotStore {
  if (!fs.existsSync(filePath)) {
    return { snapshots: [], version: STORE_VERSION, lastUpdated: new Date().toISOString() };
  }
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw) as SnapshotStore;
}

export function saveSnapshotStore(filePath: string, store: SnapshotStore): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  store.lastUpdated = new Date().toISOString();
  fs.writeFileSync(filePath, JSON.stringify(store, null, 2), 'utf-8');
}

export function upsertSnapshot(
  store: SnapshotStore,
  snapshot: ServiceSnapshot
): SnapshotDiff {
  const existingIndex = store.snapshots.findIndex(
    (s) => s.serviceId === snapshot.serviceId
  );

  const isNew = existingIndex === -1;
  const before = isNew ? null : store.snapshots[existingIndex];

  if (isNew) {
    store.snapshots.push(snapshot);
  } else {
    store.snapshots[existingIndex] = snapshot;
  }

  return { serviceId: snapshot.serviceId, before, after: snapshot, isNew };
}

export function getSnapshot(
  store: SnapshotStore,
  serviceId: string
): ServiceSnapshot | undefined {
  return store.snapshots.find((s) => s.serviceId === serviceId);
}

export function listSnapshots(store: SnapshotStore): ServiceSnapshot[] {
  return [...store.snapshots];
}
