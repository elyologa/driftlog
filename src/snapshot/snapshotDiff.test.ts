import { diffSnapshots, formatSnapshotDiff } from './snapshotDiff';
import { Snapshot } from './types';

const makeSnapshot = (overrides: Partial<Snapshot> & { config: Record<string, unknown> }): Snapshot => ({
  snapshotId: 'snap-001',
  serviceName: 'auth-service',
  capturedAt: '2024-01-01T00:00:00.000Z',
  ...overrides,
});

describe('diffSnapshots', () => {
  it('returns no drifts when configs are identical', () => {
    const config = { replicas: 2, image: 'nginx:1.25' };
    const older = makeSnapshot({ snapshotId: 'snap-001', config });
    const newer = makeSnapshot({ snapshotId: 'snap-002', capturedAt: '2024-02-01T00:00:00.000Z', config });

    const diff = diffSnapshots(older, newer);

    expect(diff.hasChanges).toBe(false);
    expect(diff.drifts).toHaveLength(0);
    expect(diff.serviceName).toBe('auth-service');
    expect(diff.from.snapshotId).toBe('snap-001');
    expect(diff.to.snapshotId).toBe('snap-002');
  });

  it('detects changed values between snapshots', () => {
    const older = makeSnapshot({ config: { replicas: 2, image: 'nginx:1.24' } });
    const newer = makeSnapshot({ snapshotId: 'snap-002', config: { replicas: 3, image: 'nginx:1.25' } });

    const diff = diffSnapshots(older, newer);

    expect(diff.hasChanges).toBe(true);
    expect(diff.drifts.length).toBeGreaterThan(0);
    const changedKeys = diff.drifts.map((d) => d.key);
    expect(changedKeys).toContain('replicas');
    expect(changedKeys).toContain('image');
  });

  it('detects added and removed keys', () => {
    const older = makeSnapshot({ config: { replicas: 2, debug: true } });
    const newer = makeSnapshot({ snapshotId: 'snap-002', config: { replicas: 2, timeout: 30 } });

    const diff = diffSnapshots(older, newer);

    expect(diff.hasChanges).toBe(true);
    const types = diff.drifts.map((d) => d.type);
    expect(types).toContain('missing');
    expect(types).toContain('extra');
  });

  it('throws when comparing snapshots from different services', () => {
    const older = makeSnapshot({ serviceName: 'auth-service', config: {} });
    const newer = makeSnapshot({ serviceName: 'payment-service', config: {} });

    expect(() => diffSnapshots(older, newer)).toThrow(/different services/);
  });
});

describe('formatSnapshotDiff', () => {
  it('includes service name and snapshot ids in output', () => {
    const older = makeSnapshot({ snapshotId: 'snap-001', config: { replicas: 2 } });
    const newer = makeSnapshot({ snapshotId: 'snap-002', config: { replicas: 4 } });
    const diff = diffSnapshots(older, newer);

    const output = formatSnapshotDiff(diff);

    expect(output).toContain('auth-service');
    expect(output).toContain('snap-001');
    expect(output).toContain('snap-002');
    expect(output).toContain('replicas');
  });

  it('shows no-change message when configs are identical', () => {
    const config = { replicas: 1 };
    const older = makeSnapshot({ snapshotId: 'snap-001', config });
    const newer = makeSnapshot({ snapshotId: 'snap-002', config });
    const diff = diffSnapshots(older, newer);

    const output = formatSnapshotDiff(diff);

    expect(output).toContain('No changes detected');
  });
});
