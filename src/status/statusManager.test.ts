import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { buildStatusReport, formatStatusText } from './statusManager';
import { saveSnapshotStore } from '../snapshot/snapshotManager';
import { saveBaselineStore } from '../baseline/baselineManager';
import { saveLockStore } from '../lock/lockManager';
import { saveArchiveStore } from '../archive/archiveManager';

function makeTempFile(): string {
  return path.join(os.tmpdir(), `driftlog-test-${Math.random().toString(36).slice(2)}.json`);
}

function writeJson(file: string, data: unknown) {
  fs.writeFileSync(file, JSON.stringify(data));
}

describe('buildStatusReport', () => {
  let snapFile: string, baseFile: string, lockFile: string, archFile: string;

  beforeEach(() => {
    snapFile = makeTempFile();
    baseFile = makeTempFile();
    lockFile = makeTempFile();
    archFile = makeTempFile();
  });

  afterEach(() => {
    [snapFile, baseFile, lockFile, archFile].forEach((f) => {
      if (fs.existsSync(f)) fs.unlinkSync(f);
    });
  });

  it('returns empty report when no data', () => {
    const report = buildStatusReport(snapFile, baseFile, lockFile, archFile);
    expect(report.total).toBe(0);
    expect(report.services).toHaveLength(0);
  });

  it('aggregates services from all stores', () => {
    writeJson(snapFile, { 'api': { capturedAt: new Date().toISOString(), config: {} } });
    writeJson(baseFile, { 'worker': { capturedAt: new Date().toISOString(), config: {} } });
    writeJson(lockFile, { 'api': { lockedAt: new Date().toISOString(), lockedBy: 'user', reason: '' } });
    writeJson(archFile, {});

    const report = buildStatusReport(snapFile, baseFile, lockFile, archFile);
    expect(report.total).toBe(2);
    expect(report.withSnapshot).toBe(1);
    expect(report.withBaseline).toBe(1);
    expect(report.locked).toBe(1);
    expect(report.archived).toBe(0);
  });

  it('correctly marks service flags', () => {
    writeJson(snapFile, { 'svc': { capturedAt: new Date().toISOString(), config: {} } });
    writeJson(baseFile, { 'svc': { capturedAt: new Date().toISOString(), config: {} } });
    writeJson(lockFile, {});
    writeJson(archFile, {});

    const report = buildStatusReport(snapFile, baseFile, lockFile, archFile);
    const svc = report.services.find((s) => s.service === 'svc')!;
    expect(svc.hasSnapshot).toBe(true);
    expect(svc.hasBaseline).toBe(true);
    expect(svc.isLocked).toBe(false);
    expect(svc.isArchived).toBe(false);
    expect(svc.snapshotAge).toBeDefined();
  });
});

describe('formatStatusText', () => {
  it('includes summary line and service rows', () => {
    const report = {
      services: [{ service: 'api', hasSnapshot: true, hasBaseline: false, isLocked: true, isArchived: false, snapshotAge: '5m ago' }],
      total: 1, locked: 1, archived: 0, withSnapshot: 1, withBaseline: 0,
    };
    const text = formatStatusText(report);
    expect(text).toContain('Services: 1 total');
    expect(text).toContain('api');
    expect(text).toContain('5m ago');
    expect(text).toContain('yes');
  });
});
