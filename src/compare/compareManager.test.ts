import { describe, it, expect, beforeEach } from 'vitest';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';
import { compareSnapshots, formatCompareResult } from './compareManager';
import { upsertSnapshot } from '../snapshot/snapshotManager';

function makeTempFile(): string {
  return path.join(os.tmpdir(), `compare-test-${Date.now()}.json`);
}

describe('compareSnapshots', () => {
  let tmpFile: string;

  beforeEach(() => {
    tmpFile = makeTempFile();
  });

  it('identifies identical, different, and exclusive keys', () => {
    upsertSnapshot(tmpFile, { service: 'svcA', config: { port: 8080, host: 'localhost', debug: true } });
    upsertSnapshot(tmpFile, { service: 'svcB', config: { port: 9090, host: 'localhost', timeout: 30 } });

    const result = compareSnapshots(tmpFile, 'svcA', 'svcB');

    expect(result.serviceA).toBe('svcA');
    expect(result.serviceB).toBe('svcB');
    expect(result.identical).toContain('host');
    expect(result.different.some(d => d.key === 'port')).toBe(true);
    expect(result.onlyInA).toContain('debug');
    expect(result.onlyInB).toContain('timeout');
  });

  it('returns all keys as identical when configs match', () => {
    const config = { port: 3000, host: 'example.com' };
    upsertSnapshot(tmpFile, { service: 'x', config });
    upsertSnapshot(tmpFile, { service: 'y', config });

    const result = compareSnapshots(tmpFile, 'x', 'y');
    expect(result.different).toHaveLength(0);
    expect(result.onlyInA).toHaveLength(0);
    expect(result.onlyInB).toHaveLength(0);
    expect(result.identical.length).toBeGreaterThan(0);
  });

  it('throws when a service snapshot is missing', () => {
    upsertSnapshot(tmpFile, { service: 'exists', config: { port: 80 } });
    expect(() => compareSnapshots(tmpFile, 'exists', 'missing')).toThrow('missing');
  });
});

describe('formatCompareResult', () => {
  it('formats a result with differences', () => {
    const result = {
      serviceA: 'a',
      serviceB: 'b',
      onlyInA: ['debug'],
      onlyInB: ['timeout'],
      different: [{ key: 'port', valueA: 8080, valueB: 9090 }],
      identical: ['host'],
    };
    const output = formatCompareResult(result);
    expect(output).toContain('port');
    expect(output).toContain('debug');
    expect(output).toContain('timeout');
    expect(output).toContain('Identical fields: 1');
  });

  it('shows identical count when no differences', () => {
    const result = {
      serviceA: 'a', serviceB: 'b',
      onlyInA: [], onlyInB: [], different: [], identical: ['host', 'port'],
    };
    const output = formatCompareResult(result);
    expect(output).toContain('Identical fields: 2');
  });
});
