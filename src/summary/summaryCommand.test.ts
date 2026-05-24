import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { runSummaryCommand } from './summaryCommand';
import { appendHistoryEntry } from '../history/historyManager';

function makeTempFile(): string {
  return path.join(os.tmpdir(), `driftlog-summary-test-${Date.now()}-${Math.random().toString(36).slice(2)}.json`);
}

describe('runSummaryCommand', () => {
  let historyFile: string;
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    historyFile = makeTempFile();
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    if (fs.existsSync(historyFile)) fs.unlinkSync(historyFile);
  });

  it('prints no history message when store is empty', async () => {
    await runSummaryCommand({ historyFile, format: 'text' });
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('No history'));
  });

  it('prints a text summary with drift counts', async () => {
    await appendHistoryEntry(historyFile, { service: 'api', driftCount: 3, checkedAt: new Date().toISOString(), drifts: [] });
    await appendHistoryEntry(historyFile, { service: 'api', driftCount: 1, checkedAt: new Date().toISOString(), drifts: [] });
    await appendHistoryEntry(historyFile, { service: 'worker', driftCount: 0, checkedAt: new Date().toISOString(), drifts: [] });
    await runSummaryCommand({ historyFile, format: 'text' });
    const output = consoleSpy.mock.calls.map((c) => c[0]).join('\n');
    expect(output).toContain('api');
    expect(output).toContain('worker');
  });

  it('prints a json summary', async () => {
    await appendHistoryEntry(historyFile, { service: 'db', driftCount: 2, checkedAt: new Date().toISOString(), drifts: [] });
    await runSummaryCommand({ historyFile, format: 'json' });
    const output = consoleSpy.mock.calls.map((c) => c[0]).join('\n');
    const parsed = JSON.parse(output);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed[0].service).toBe('db');
  });

  it('filters by service when provided', async () => {
    await appendHistoryEntry(historyFile, { service: 'api', driftCount: 1, checkedAt: new Date().toISOString(), drifts: [] });
    await appendHistoryEntry(historyFile, { service: 'cache', driftCount: 5, checkedAt: new Date().toISOString(), drifts: [] });
    await runSummaryCommand({ historyFile, format: 'text', service: 'api' });
    const output = consoleSpy.mock.calls.map((c) => c[0]).join('\n');
    expect(output).toContain('api');
    expect(output).not.toContain('cache');
  });
});
