import * as path from 'path';
import { buildSummary, formatSummaryText } from './summaryManager';

const DEFAULT_HISTORY = path.resolve('driftlog-history.json');
const DEFAULT_BASELINE = path.resolve('driftlog-baselines.json');
const DEFAULT_TAGS = path.resolve('driftlog-tags.json');
const DEFAULT_SNAPSHOTS = path.resolve('driftlog-snapshots.json');

export function runSummaryCommand(
  args: string[],
  options: {
    historyPath?: string;
    baselinePath?: string;
    tagPath?: string;
    snapshotPath?: string;
    json?: boolean;
  } = {}
): void {
  const historyPath = options.historyPath ?? DEFAULT_HISTORY;
  const baselinePath = options.baselinePath ?? DEFAULT_BASELINE;
  const tagPath = options.tagPath ?? DEFAULT_TAGS;
  const snapshotPath = options.snapshotPath ?? DEFAULT_SNAPSHOTS;

  const report = buildSummary(historyPath, baselinePath, tagPath, snapshotPath);

  if (options.json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(formatSummaryText(report));
  }
}
