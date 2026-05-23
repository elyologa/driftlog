export interface ServiceSnapshot {
  serviceId: string;
  capturedAt: string; // ISO 8601
  config: Record<string, unknown>;
  source: 'live' | 'yaml';
}

export interface SnapshotStore {
  snapshots: ServiceSnapshot[];
  version: number;
  lastUpdated: string;
}

export interface SnapshotDiff {
  serviceId: string;
  before: ServiceSnapshot | null;
  after: ServiceSnapshot;
  isNew: boolean;
}
