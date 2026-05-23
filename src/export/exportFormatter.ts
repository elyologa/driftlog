import { DriftResult } from '../drift/types';
import { DriftExportRow, ExportFormat } from './exportTypes';

function driftResultToRows(serviceName: string, results: DriftResult[], timestamp?: string): DriftExportRow[] {
  return results.map((r) => ({
    service: serviceName,
    field: r.field,
    expected: r.expected !== undefined ? String(r.expected) : '(missing)',
    actual: r.actual !== undefined ? String(r.actual) : '(missing)',
    severity: r.expected === undefined ? 'extra' : r.actual === undefined ? 'missing' : 'changed',
    ...(timestamp ? { timestamp } : {}),
  }));
}

export function formatAsJson(serviceName: string, results: DriftResult[], timestamp?: string): string {
  const rows = driftResultToRows(serviceName, results, timestamp);
  return JSON.stringify(rows, null, 2);
}

export function formatAsCsv(serviceName: string, results: DriftResult[], timestamp?: string): string {
  const rows = driftResultToRows(serviceName, results, timestamp);
  const header = 'service,field,expected,actual,severity' + (timestamp ? ',timestamp' : '');
  const lines = rows.map((r) => {
    const base = `${r.service},${r.field},${r.expected},${r.actual},${r.severity}`;
    return timestamp ? `${base},${r.timestamp}` : base;
  });
  return [header, ...lines].join('\n');
}

export function formatAsMarkdown(serviceName: string, results: DriftResult[], timestamp?: string): string {
  const rows = driftResultToRows(serviceName, results, timestamp);
  const header = timestamp
    ? '| Service | Field | Expected | Actual | Severity | Timestamp |'
    : '| Service | Field | Expected | Actual | Severity |';
  const divider = timestamp
    ? '|---------|-------|----------|--------|----------|-----------|'
    : '|---------|-------|----------|--------|----------|';
  const lines = rows.map((r) => {
    const base = `| ${r.service} | ${r.field} | ${r.expected} | ${r.actual} | ${r.severity} |`;
    return timestamp ? `${base} ${r.timestamp} |` : base;
  });
  return [`# Drift Report: ${serviceName}`, '', header, divider, ...lines].join('\n');
}

export function formatExport(format: ExportFormat, serviceName: string, results: DriftResult[], timestamp?: string): string {
  switch (format) {
    case 'json': return formatAsJson(serviceName, results, timestamp);
    case 'csv': return formatAsCsv(serviceName, results, timestamp);
    case 'markdown': return formatAsMarkdown(serviceName, results, timestamp);
    default: throw new Error(`Unsupported export format: ${format}`);
  }
}
