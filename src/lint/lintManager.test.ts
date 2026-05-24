import { lintServiceConfig, formatLintResult } from './lintManager';

describe('lintServiceConfig', () => {
  const validConfig = {
    name: 'my-service',
    version: '1.2.3',
    image: 'my-service:1.2.3',
    env: { NODE_ENV: 'production' },
    replicas: 2,
  };

  it('passes a fully valid config', () => {
    const result = lintServiceConfig('my-service', validConfig);
    expect(result.passed).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  it('flags missing name as error', () => {
    const result = lintServiceConfig('svc', { ...validConfig, name: '' });
    expect(result.passed).toBe(false);
    const v = result.violations.find((x) => x.rule === 'required-name');
    expect(v).toBeDefined();
    expect(v!.severity).toBe('error');
  });

  it('flags missing version as error', () => {
    const cfg = { ...validConfig };
    delete (cfg as Record<string, unknown>)['version'];
    const result = lintServiceConfig('svc', cfg);
    expect(result.passed).toBe(false);
    expect(result.violations.some((v) => v.rule === 'required-version')).toBe(true);
  });

  it('flags empty env as warning but still passes', () => {
    const result = lintServiceConfig('svc', { ...validConfig, env: {} });
    expect(result.passed).toBe(true);
    const v = result.violations.find((x) => x.rule === 'required-env');
    expect(v).toBeDefined();
    expect(v!.severity).toBe('warning');
  });

  it('flags latest image tag as warning', () => {
    const result = lintServiceConfig('svc', { ...validConfig, image: 'my-service:latest' });
    expect(result.passed).toBe(true);
    const v = result.violations.find((x) => x.rule === 'no-latest-tag');
    expect(v).toBeDefined();
    expect(v!.severity).toBe('warning');
  });

  it('flags missing replicas as info', () => {
    const cfg = { ...validConfig };
    delete (cfg as Record<string, unknown>)['replicas'];
    const result = lintServiceConfig('svc', cfg);
    expect(result.passed).toBe(true);
    const v = result.violations.find((x) => x.rule === 'has-replicas');
    expect(v!.severity).toBe('info');
  });
});

describe('formatLintResult', () => {
  it('includes PASSED when no errors', () => {
    const result = lintServiceConfig('svc', {
      name: 'svc', version: '1.0', image: 'svc:1.0', env: { A: 'b' }, replicas: 1,
    });
    const text = formatLintResult(result);
    expect(text).toContain('PASSED');
    expect(text).toContain('No violations found');
  });

  it('includes FAILED and violation details', () => {
    const result = lintServiceConfig('svc', { version: '1.0' });
    const text = formatLintResult(result);
    expect(text).toContain('FAILED');
    expect(text).toContain('[ERROR]');
    expect(text).toContain('required-name');
  });
});
