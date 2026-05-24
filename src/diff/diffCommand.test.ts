import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs/promises';
import { runDiffCommand } from './diffCommand';
import { saveSnapshotStore } from '../snapshot/snapshotManager';

async function makeTempFile(): Promise<string> {
  return path.join(os.tmpdir(), `diffcmd-${Date.now()}-${Math.random()}.json`);
}

const baseStore = {
  snapshots: [
    {
      service: 'api',
      label: 'v1',
      timestamp: '2024-01-01T00:00:00Z',
      config: { port: 8080, replicas: 2 },
    },
    {
      service: 'api',
      label: 'v2',
      timestamp: '2024-01-02T00:00:00Z',
      config: { port: 9090, replicas: 2, debug: true },
    },
  ],
};

describe('runDiffCommand', () => {
  let tmpFile: string;

  beforeEach(async () => {
    tmpFile = await makeTempFile();
    await saveSnapshotStore(tmpFile, baseStore as never);
  });

  afterEach(async () => {
    await fs.unlink(tmpFile).catch(() => {});
  });

  it('outputs text diff between two snapshots', async () => {
    const lines: string[] = [];
    await runDiffCommand(
      { service: 'api', snapshotA: 'v1', snapshotB: 'v2', format: 'text' },
      tmpFile,
      (msg) => lines.push(msg)
    );
    expect(lines.join('\n')).toContain('~ port');
    expect(lines.join('\n')).toContain('+ debug');
  });

  it('outputs JSON diff when format is json', async () => {
    const lines: string[] = [];
    await runDiffCommand(
      { service: 'api', snapshotA: 'v1', snapshotB: 'v2', format: 'json' },
      tmpFile,
      (msg) => lines.push(msg)
    );
    const parsed = JSON.parse(lines[0]);
    expect(parsed.service).toBe('api');
    expect(parsed.diffs.length).toBeGreaterThan(0);
  });

  it('outputs markdown diff when format is markdown', async () => {
    const lines: string[] = [];
    await runDiffCommand(
      { service: 'api', snapshotA: 'v1', snapshotB: 'v2', format: 'markdown' },
      tmpFile,
      (msg) => lines.push(msg)
    );
    expect(lines.join('\n')).toContain('## api');
  });

  it('reports error when snapshotA is not found', async () => {
    const lines: string[] = [];
    await runDiffCommand(
      { service: 'api', snapshotA: 'missing', snapshotB: 'v2' },
      tmpFile,
      (msg) => lines.push(msg)
    );
    expect(lines[0]).toContain('Error');
    expect(lines[0]).toContain('missing');
  });

  it('reports error when snapshotB is not found', async () => {
    const lines: string[] = [];
    await runDiffCommand(
      { service: 'api', snapshotA: 'v1', snapshotB: 'ghost' },
      tmpFile,
      (msg) => lines.push(msg)
    );
    expect(lines[0]).toContain('Error');
    expect(lines[0]).toContain('ghost');
  });
});
