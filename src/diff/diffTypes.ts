export type DiffFormat = 'text' | 'json' | 'markdown';

export interface FieldDiff {
  key: string;
  expected: unknown;
  actual: unknown;
  status: 'added' | 'removed' | 'changed';
}

export interface ServiceDiffResult {
  service: string;
  snapshotA: string;
  snapshotB: string;
  diffs: FieldDiff[];
  identical: boolean;
}

export interface DiffOptions {
  format?: DiffFormat;
  service: string;
  snapshotA: string;
  snapshotB: string;
}
