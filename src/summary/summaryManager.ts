import { loadHistoryStore } from '../history/historyManager';
import { SummaryEntry, SummaryOptions } from './summaryTypes';

export async function buildSummary(
  historyFile: string,
  options: SummaryOptions = {}
): Promise<SummaryEntry[]> {
  const store = await loadHistoryStore(historyFile);
  const allEntries = Object.entries(store.entries);

  const filtered = options.service
    ? allEntries.filter(([svc]) => svc === options.service)
    : allEntries;

  return filtered.map(([service, entries]) => {
    const total = entries.length;
    const driftedRuns = entries.filter((e) => e.driftCount > 0).length;
    const cleanRuns = total - driftedRuns;
    const totalDrifts = entries.reduce((sum, e) => sum + e.driftCount, 0);
    const avgDrift = total > 0 ? +(totalDrifts / total).toFixed(2) : 0;
    const lastChecked = entries.length > 0 ? entries[entries.length - 1].checkedAt : null;
    const maxDrift = entries.reduce((max, e) => Math.max(max, e.driftCount), 0);

    return {
      service,
      totalRuns: total,
      driftedRuns,
      cleanRuns,
      totalDrifts,
      avgDrift,
      maxDrift,
      lastChecked,
    };
  });
}

export function formatSummaryText(entries: SummaryEntry[]): string {
  if (entries.length === 0) return 'No history entries found.';

  const lines: string[] = ['=== Drift Summary ===', ''];

  for (const e of entries) {
    lines.push(`Service:      ${e.service}`);
    lines.push(`  Runs:       ${e.totalRuns} (drifted: ${e.driftedRuns}, clean: ${e.cleanRuns})`);
    lines.push(`  Total drifts: ${e.totalDrifts}  avg: ${e.avgDrift}  max: ${e.maxDrift}`);
    lines.push(`  Last checked: ${e.lastChecked ?? 'N/A'}`);
    lines.push('');
  }

  return lines.join('\n').trimEnd();
}
