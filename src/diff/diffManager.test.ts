import { computeFieldDiffs, buildServiceDiff, formatDiffText, formatDiffMarkdown } from './diffManager';

describe('computeFieldDiffs', () => {
  it('returns empty array for identical objects', () => {
    const diffs = computeFieldDiffs({ a: 1 }, { a: 1 });
    expect(diffs).toHaveLength(0);
  });

  it('detects added keys', () => {
    const diffs = computeFieldDiffs({}, { newKey: 'value' });
    expect(diffs).toHaveLength(1);
    expect(diffs[0]).toMatchObject({ key: 'newKey', status: 'added', actual: 'value' });
  });

  it('detects removed keys', () => {
    const diffs = computeFieldDiffs({ oldKey: 42 }, {});
    expect(diffs).toHaveLength(1);
    expect(diffs[0]).toMatchObject({ key: 'oldKey', status: 'removed', expected: 42 });
  });

  it('detects changed values', () => {
    const diffs = computeFieldDiffs({ port: 8080 }, { port: 9090 });
    expect(diffs).toHaveLength(1);
    expect(diffs[0]).toMatchObject({ key: 'port', status: 'changed', expected: 8080, actual: 9090 });
  });

  it('handles nested object changes via JSON comparison', () => {
    const diffs = computeFieldDiffs({ meta: { env: 'prod' } }, { meta: { env: 'dev' } });
    expect(diffs).toHaveLength(1);
    expect(diffs[0].status).toBe('changed');
  });
});

describe('buildServiceDiff', () => {
  it('marks result as identical when configs match', () => {
    const result = buildServiceDiff('svc', 'v1', 'v2', { a: 1 }, { a: 1 });
    expect(result.identical).toBe(true);
    expect(result.diffs).toHaveLength(0);
  });

  it('populates service and snapshot labels', () => {
    const result = buildServiceDiff('api', 'snap1', 'snap2', {}, { x: 1 });
    expect(result.service).toBe('api');
    expect(result.snapshotA).toBe('snap1');
    expect(result.snapshotB).toBe('snap2');
  });
});

describe('formatDiffText', () => {
  it('returns identical message when no diffs', () => {
    const result = buildServiceDiff('svc', 'a', 'b', { x: 1 }, { x: 1 });
    expect(formatDiffText(result)).toContain('No differences');
  });

  it('includes + prefix for added fields', () => {
    const result = buildServiceDiff('svc', 'a', 'b', {}, { newField: true });
    expect(formatDiffText(result)).toContain('+ newField');
  });

  it('includes - prefix for removed fields', () => {
    const result = buildServiceDiff('svc', 'a', 'b', { gone: 1 }, {});
    expect(formatDiffText(result)).toContain('- gone');
  });

  it('includes ~ prefix for changed fields', () => {
    const result = buildServiceDiff('svc', 'a', 'b', { port: 80 }, { port: 443 });
    expect(formatDiffText(result)).toContain('~ port');
  });
});

describe('formatDiffMarkdown', () => {
  it('returns markdown with table when diffs exist', () => {
    const result = buildServiceDiff('svc', 'a', 'b', { x: 1 }, { x: 2 });
    const md = formatDiffMarkdown(result);
    expect(md).toContain('## svc');
    expect(md).toContain('| 🔄 |');
  });

  it('returns no-diff message when identical', () => {
    const result = buildServiceDiff('svc', 'a', 'b', { x: 1 }, { x: 1 });
    expect(formatDiffMarkdown(result)).toContain('No differences');
  });
});
