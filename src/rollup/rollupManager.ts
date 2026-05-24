import { HistoryEntry } from '../history/historyTypes';
import { loadHistoryStore } from '../history/historyManager';
import { loadTagStore } from '../tag/tagManager';
import { RollupSummary, ServiceRollupEntry } from './rollupTypes';

export function buildRollupSummary(historyFile: string, tagFile: string): RollupSummary {
  const historyStore = loadHistoryStore(historyFile);
  const tagStore = loadTagStore(tagFile);

  const entries: ServiceRollupEntry[] = [];

  for (const [service, records] of Object.entries(historyStore)) {
    if (!records || records.length === 0) continue;

    const latest = records[records.length - 1] as HistoryEntry;
    const drifts = latest.drifts ?? [];

    const criticalCount = drifts.filter((d) => d.severity === 'critical').length;
    const warningCount = drifts.filter((d) => d.severity === 'warning').length;
    const infoCount = drifts.filter((d) => d.severity === 'info').length;

    entries.push({
      service,
      totalDrifts: drifts.length,
      criticalCount,
      warningCount,
      infoCount,
      lastChecked: latest.timestamp,
      tags: tagStore[service] ?? [],
    });
  }

  const servicesWithDrift = entries.filter((e) => e.totalDrifts > 0).length;

  return {
    generatedAt: new Date().toISOString(),
    totalServices: entries.length,
    servicesWithDrift,
    servicesClean: entries.length - servicesWithDrift,
    totalDrifts: entries.reduce((sum, e) => sum + e.totalDrifts, 0),
    bySeverity: {
      critical: entries.reduce((sum, e) => sum + e.criticalCount, 0),
      warning: entries.reduce((sum, e) => sum + e.warningCount, 0),
      info: entries.reduce((sum, e) => sum + e.infoCount, 0),
    },
    entries,
  };
}

export function formatRollupText(summary: RollupSummary): string {
  const lines: string[] = [
    `Drift Rollup — ${summary.generatedAt}`,
    `Services: ${summary.totalServices} total, ${summary.servicesWithDrift} drifted, ${summary.servicesClean} clean`,
    `Total Drifts: ${summary.totalDrifts} (critical: ${summary.bySeverity.critical}, warning: ${summary.bySeverity.warning}, info: ${summary.bySeverity.info})`,
    '',
  ];

  for (const entry of summary.entries) {
    const tagStr = entry.tags.length > 0 ? ` [${entry.tags.join(', ')}]` : '';
    const status = entry.totalDrifts === 0 ? '✓ clean' : `✗ ${entry.totalDrifts} drift(s)`;
    lines.push(`  ${entry.service}${tagStr}: ${status} (last: ${entry.lastChecked})`);
  }

  return lines.join('\n');
}
