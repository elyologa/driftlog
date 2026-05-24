import * as fs from 'fs';
import { SummaryReport, ServiceSummary } from './summaryTypes';
import { loadHistoryStore } from '../history/historyManager';
import { loadBaselineStore } from '../baseline/baselineManager';
import { loadTagStore } from '../tag/tagManager';
import { loadSnapshotStore } from '../snapshot/snapshotManager';

export function buildSummary(
  historyPath: string,
  baselinePath: string,
  tagPath: string,
  snapshotPath: string
): SummaryReport {
  const history = fs.existsSync(historyPath) ? loadHistoryStore(historyPath) : {};
  const baselines = fs.existsSync(baselinePath) ? loadBaselineStore(baselinePath) : {};
  const tags = fs.existsSync(tagPath) ? loadTagStore(tagPath) : {};
  const snapshots = fs.existsSync(snapshotPath) ? loadSnapshotStore(snapshotPath) : {};

  const allServices = new Set([
    ...Object.keys(history),
    ...Object.keys(baselines),
    ...Object.keys(tags),
    ...Object.keys(snapshots),
  ]);

  const services: ServiceSummary[] = [];

  for (const service of allServices) {
    const entries = history[service] ?? [];
    const latest = entries.length > 0 ? entries[entries.length - 1] : null;
    const drifts = latest?.drifts ?? [];

    services.push({
      service,
      tags: tags[service] ?? [],
      lastChecked: latest?.timestamp ?? null,
      driftCount: drifts.length,
      highSeverity: drifts.filter((d) => d.severity === 'high').length,
      mediumSeverity: drifts.filter((d) => d.severity === 'medium').length,
      lowSeverity: drifts.filter((d) => d.severity === 'low').length,
      hasBaseline: !!baselines[service],
      snapshotCount: snapshots[service] ? 1 : 0,
    });
  }

  services.sort((a, b) => b.driftCount - a.driftCount);

  return {
    generatedAt: new Date().toISOString(),
    totalServices: services.length,
    servicesWithDrift: services.filter((s) => s.driftCount > 0).length,
    services,
  };
}

export function formatSummaryText(report: SummaryReport): string {
  const lines: string[] = [
    `Drift Summary — ${report.generatedAt}`,
    `Total services: ${report.totalServices}  |  Services with drift: ${report.servicesWithDrift}`,
    '',
  ];

  for (const s of report.services) {
    const drift = s.driftCount > 0 ? `drift:${s.driftCount} (H:${s.highSeverity} M:${s.mediumSeverity} L:${s.lowSeverity})` : 'no drift';
    const baseline = s.hasBaseline ? '[baseline]' : '';
    const tagStr = s.tags.length > 0 ? `[${s.tags.join(', ')}]` : '';
    lines.push(`  ${s.service.padEnd(30)} ${drift.padEnd(30)} ${baseline} ${tagStr}`);
  }

  return lines.join('\n');
}
