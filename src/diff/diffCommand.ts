import { loadSnapshotStore } from '../snapshot/snapshotManager';
import { buildServiceDiff, formatDiffText, formatDiffMarkdown } from './diffManager';
import { DiffOptions } from './diffTypes';

export async function runDiffCommand(
  options: DiffOptions,
  snapshotPath: string,
  output: (msg: string) => void = console.log
): Promise<void> {
  const store = await loadSnapshotStore(snapshotPath);
  const { service, snapshotA, snapshotB, format = 'text' } = options;

  const entryA = store.snapshots.find(
    (s) => s.service === service && s.label === snapshotA
  );
  const entryB = store.snapshots.find(
    (s) => s.service === service && s.label === snapshotB
  );

  if (!entryA) {
    output(`Error: snapshot "${snapshotA}" not found for service "${service}".`);
    return;
  }
  if (!entryB) {
    output(`Error: snapshot "${snapshotB}" not found for service "${service}".`);
    return;
  }

  const result = buildServiceDiff(
    service,
    snapshotA,
    snapshotB,
    entryA.config as Record<string, unknown>,
    entryB.config as Record<string, unknown>
  );

  if (format === 'json') {
    output(JSON.stringify(result, null, 2));
  } else if (format === 'markdown') {
    output(formatDiffMarkdown(result));
  } else {
    output(formatDiffText(result));
  }
}
