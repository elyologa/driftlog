import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { buildSummary, formatSummaryText } from './summaryManager';

function makeTempFile(data: object): string {
  const file = path.join(os.tmpdir(), `driftlog-test-${Date.now()}-${Math.random()}.json`);
  fs.writeFileSync(file, JSON.stringify(data));
  return file;
}

describe('buildSummary', () => {
  it('returns empty summary when no data files exist', () => {
    const report = buildSummary('/nonexistent1.json', '/nonexistent2.json', '/nonexistent3.json', '/nonexistent4.json');
    expect(report.totalServices).toBe(0);
    expect(report.servicesWithDrift).toBe(0);
    expect(report.services).toEqual([]);
  });

  it('aggregates services from history', () => {
    const historyFile = makeTempFile({
      'api': [
        {
          timestamp: '2024-01-01T00:00:00.000Z',
          drifts: [
            { key: 'port', expected: '8080', actual: '9090', severity: 'high' },
            { key: 'timeout', expected: '30', actual: '60', severity: 'medium' },
          ],
        },
      ],
    });

    const report = buildSummary(historyFile, '/nonexistent.json', '/nonexistent.json', '/nonexistent.json');
    expect(report.totalServices).toBe(1);
    expect(report.servicesWithDrift).toBe(1);
    const svc = report.services[0];
    expect(svc.service).toBe('api');
    expect(svc.driftCount).toBe(2);
    expect(svc.highSeverity).toBe(1);
    expect(svc.mediumSeverity).toBe(1);
    expect(svc.lowSeverity).toBe(0);

    fs.unlinkSync(historyFile);
  });

  it('marks hasBaseline correctly', () => {
    const baselineFile = makeTempFile({ 'worker': { capturedAt: '2024-01-01T00:00:00.000Z', config: {} } });
    const report = buildSummary('/nonexistent.json', baselineFile, '/nonexistent.json', '/nonexistent.json');
    const svc = report.services.find((s) => s.service === 'worker');
    expect(svc?.hasBaseline).toBe(true);
    fs.unlinkSync(baselineFile);
  });

  it('includes tags in summary', () => {
    const tagFile = makeTempFile({ 'frontend': ['prod', 'critical'] });
    const report = buildSummary('/nonexistent.json', '/nonexistent.json', tagFile, '/nonexistent.json');
    const svc = report.services.find((s) => s.service === 'frontend');
    expect(svc?.tags).toEqual(['prod', 'critical']);
    fs.unlinkSync(tagFile);
  });
});

describe('formatSummaryText', () => {
  it('renders header and service rows', () => {
    const report = {
      generatedAt: '2024-06-01T12:00:00.000Z',
      totalServices: 1,
      servicesWithDrift: 1,
      services: [
        {
          service: 'api',
          tags: ['prod'],
          lastChecked: '2024-06-01T11:00:00.000Z',
          driftCount: 3,
          highSeverity: 1,
          mediumSeverity: 1,
          lowSeverity: 1,
          hasBaseline: true,
          snapshotCount: 1,
        },
      ],
    };
    const text = formatSummaryText(report);
    expect(text).toContain('Drift Summary');
    expect(text).toContain('api');
    expect(text).toContain('drift:3');
    expect(text).toContain('[baseline]');
    expect(text).toContain('[prod]');
  });
});
