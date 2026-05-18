import { formatReport, formatReportJson } from './reporter';
import { DriftReport } from './types';

const baseReport: DriftReport = {
  serviceName: 'api-gateway',
  timestamp: '2024-01-15T10:00:00.000Z',
  hasDrift: false,
  drifts: [],
};

describe('formatReport', () => {
  it('shows no-drift message when report is clean', () => {
    const output = formatReport(baseReport);
    expect(output).toContain('No drift detected');
    expect(output).toContain('api-gateway');
  });

  it('shows drift count when drifts exist', () => {
    const report: DriftReport = {
      ...baseReport,
      hasDrift: true,
      drifts: [
        {
          path: 'app.port',
          severity: 'changed',
          expected: 8080,
          actual: 3000,
          message: 'Key "app.port" differs: expected 8080, got 3000',
        },
      ],
    };
    const output = formatReport(report);
    expect(output).toContain('1 drift(s) detected');
    expect(output).toContain('[CHANGED]');
    expect(output).toContain('app.port');
  });

  it('labels missing and extra severities correctly', () => {
    const report: DriftReport = {
      ...baseReport,
      hasDrift: true,
      drifts: [
        { path: 'x', severity: 'missing', expected: 1, message: 'missing' },
        { path: 'y', severity: 'extra', actual: 2, message: 'extra' },
      ],
    };
    const output = formatReport(report);
    expect(output).toContain('[MISSING]');
    expect(output).toContain('[EXTRA]');
  });
});

describe('formatReportJson', () => {
  it('returns valid JSON', () => {
    const output = formatReportJson(baseReport);
    expect(() => JSON.parse(output)).not.toThrow();
    const parsed = JSON.parse(output);
    expect(parsed.serviceName).toBe('api-gateway');
  });
});
