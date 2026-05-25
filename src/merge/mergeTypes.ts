export interface MergeOptions {
  serviceName: string;
  sourceFile: string;
  targetFile: string;
  overwrite?: boolean;
  dryRun?: boolean;
}

export interface MergeFieldResult {
  key: string;
  sourceValue: unknown;
  targetValue: unknown;
  action: 'added' | 'updated' | 'unchanged' | 'skipped';
}

export interface MergeResult {
  serviceName: string;
  sourceFile: string;
  targetFile: string;
  fields: MergeFieldResult[];
  totalAdded: number;
  totalUpdated: number;
  totalUnchanged: number;
  dryRun: boolean;
}
