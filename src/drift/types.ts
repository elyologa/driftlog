export type DriftSeverity = 'missing' | 'extra' | 'changed';

export interface DriftEntry {
  path: string;
  severity: DriftSeverity;
  expected?: unknown;
  actual?: unknown;
  message: string;
}

export interface DriftReport {
  serviceName: string;
  timestamp: string;
  hasDrift: boolean;
  drifts: DriftEntry[];
}

export type ConfigMap = Record<string, unknown>;
