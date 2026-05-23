import { formatAsJson, formatAsCsv, formatAsMarkdown, formatExport } from './exportFormatter';
import { DriftResult } from '../drift/types';

const mockResults: DriftResult[] = [
  { field: 'env.NODE_ENV', expected: 'production', actual: 'staging' },
  { field: 'replicas', expected: 3, actual: undefined },
  { field: 'debug', expected: undefined, actual: true },
];

describe('formatAsJson', () => {
  it('returns a valid JSON array', () => {
    const output = formatAsJson('my-service', mockResults);
    const parsed = JSON.parse(output);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed).toHaveLength(3);
    expect(parsed[0].service).toBe('my-service');
    expect(parsed[0].severity).toBe('changed');
    expect(parsed[1].severity).toBe('missing');
    expect(parsed[2].severity).toBe('extra');
  });

  it('includes timestamp when provided', () => {
    const output = formatAsJson('svc', mockResults, '2024-01-01T00:00:00.000Z');
    const parsed = JSON.parse(output);
    expect(parsed[0].timestamp).toBe('2024-01-01T00:00:00.000Z');
  });
});

describe('formatAsCsv', () => {
  it('returns CSV with header and rows', () => {
    const output = formatAsCsv('my-service', mockResults);
    const lines = output.split('\n');
    expect(lines[0]).toBe('service,field,expected,actual,severity');
    expect(lines).toHaveLength(4);
  });

  it('includes timestamp column when provided', () => {
    const output = formatAsCsv('svc', mockResults, '2024-01-01T00:00:00.000Z');
    const lines = output.split('\n');
    expect(lines[0]).toContain('timestamp');
    expect(lines[1]).toContain('2024-01-01T00:00:00.000Z');
  });
});

describe('formatAsMarkdown', () => {
  it('returns markdown table with title', () => {
    const output = formatAsMarkdown('my-service', mockResults);
    expect(output).toContain('# Drift Report: my-service');
    expect(output).toContain('| Service |');
    expect(output).toContain('my-service');
  });

  it('has correct number of data rows', () => {
    const output = formatAsMarkdown('svc', mockResults);
    const rows = output.split('\n').filter((l) => l.startsWith('| svc'));
    expect(rows).toHaveLength(3);
  });
});

describe('formatExport', () => {
  it('dispatches to correct formatter', () => {
    expect(() => formatExport('json', 'svc', mockResults)).not.toThrow();
    expect(() => formatExport('csv', 'svc', mockResults)).not.toThrow();
    expect(() => formatExport('markdown', 'svc', mockResults)).not.toThrow();
  });

  it('throws on unsupported format', () => {
    expect(() => formatExport('xml' as never, 'svc', mockResults)).toThrow('Unsupported export format');
  });
});
