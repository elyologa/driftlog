import { detectDrift } from './detector';

describe('detectDrift', () => {
  it('returns no drift when configs are identical', () => {
    const config = { app: { port: 3000, env: 'production' } };
    const report = detectDrift('my-service', config, config);
    expect(report.hasDrift).toBe(false);
    expect(report.drifts).toHaveLength(0);
    expect(report.serviceName).toBe('my-service');
  });

  it('detects a missing key in actual config', () => {
    const expected = { app: { port: 3000, env: 'production' } };
    const actual = { app: { port: 3000 } };
    const report = detectDrift('svc', expected, actual);
    expect(report.hasDrift).toBe(true);
    const missing = report.drifts.find((d) => d.severity === 'missing');
    expect(missing).toBeDefined();
    expect(missing?.path).toBe('app.env');
  });

  it('detects an extra key in actual config', () => {
    const expected = { app: { port: 3000 } };
    const actual = { app: { port: 3000, debug: true } };
    const report = detectDrift('svc', expected, actual);
    expect(report.hasDrift).toBe(true);
    const extra = report.drifts.find((d) => d.severity === 'extra');
    expect(extra).toBeDefined();
    expect(extra?.path).toBe('app.debug');
  });

  it('detects a changed value', () => {
    const expected = { replicas: 3 };
    const actual = { replicas: 1 };
    const report = detectDrift('svc', expected, actual);
    expect(report.hasDrift).toBe(true);
    const changed = report.drifts.find((d) => d.severity === 'changed');
    expect(changed).toBeDefined();
    expect(changed?.expected).toBe(3);
    expect(changed?.actual).toBe(1);
  });

  it('includes a timestamp in the report', () => {
    const report = detectDrift('svc', {}, {});
    expect(report.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});
