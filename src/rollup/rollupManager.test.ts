import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { buildRollupSummary, formatRollupText } from './rollupManager';

function makeTempFile(content: object): string {
  const tmp = path.join(os.tmpdir(), `driftlog-test-${Date.now()}-${Math.random()}.json`);
  fs.writeFileSync(tmp, JSON.stringify(content));
  return tmp;
}

const sampleHistory = {
  'api-service': [
    {
      timestamp: '2024-01-01T00:00:00.000Z',
      drifts: [
        { key: 'port', expected: '8080', actual: '9090', severity: 'critical' },
        { key: 'logLevel', expected: 'info', actual: 'debug', severity: 'warning' },
      ],
    },
  ],
  'auth-service': [
    {
      timestamp: '2024-01-02T00:00:00.000Z',
      drifts: [],
    },
  ],
};

const sampleTags = {
  'api-service': ['production', 'core'],
  'auth-service': ['production'],
};

describe('buildRollupSummary', () => {
  it('aggregates drift counts across services', () => {
    const histFile = makeTempFile(sampleHistory);
    const tagFile = makeTempFile(sampleTags);
    const summary = buildRollupSummary(histFile, tagFile);

    expect(summary.totalServices).toBe(2);
    expect(summary.servicesWithDrift).toBe(1);
    expect(summary.servicesClean).toBe(1);
    expect(summary.totalDrifts).toBe(2);
    expect(summary.bySeverity.critical).toBe(1);
    expect(summary.bySeverity.warning).toBe(1);
    expect(summary.bySeverity.info).toBe(0);
  });

  it('attaches tags to entries', () => {
    const histFile = makeTempFile(sampleHistory);
    const tagFile = makeTempFile(sampleTags);
    const summary = buildRollupSummary(histFile, tagFile);
    const apiEntry = summary.entries.find((e) => e.service === 'api-service');
    expect(apiEntry?.tags).toEqual(['production', 'core']);
  });

  it('returns empty entries for empty history', () => {
    const histFile = makeTempFile({});
    const tagFile = makeTempFile({});
    const summary = buildRollupSummary(histFile, tagFile);
    expect(summary.totalServices).toBe(0);
    expect(summary.totalDrifts).toBe(0);
  });
});

describe('formatRollupText', () => {
  it('includes service names and drift counts', () => {
    const histFile = makeTempFile(sampleHistory);
    const tagFile = makeTempFile(sampleTags);
    const summary = buildRollupSummary(histFile, tagFile);
    const output = formatRollupText(summary);
    expect(output).toContain('api-service');
    expect(output).toContain('2 drift(s)');
    expect(output).toContain('clean');
    expect(output).toContain('[production, core]');
  });
});
