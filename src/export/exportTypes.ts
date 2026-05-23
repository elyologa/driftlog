export type ExportFormat = 'json' | 'csv' | 'markdown';

export interface ExportOptions {
  format: ExportFormat;
  outputPath?: string;
  includeTimestamp?: boolean;
  serviceName?: string;
}

export interface ExportResult {
  format: ExportFormat;
  content: string;
  outputPath?: string;
  writtenToDisk: boolean;
}

export interface DriftExportRow {
  service: string;
  field: string;
  expected: string;
  actual: string;
  severity: 'missing' | 'extra' | 'changed';
  timestamp?: string;
}
