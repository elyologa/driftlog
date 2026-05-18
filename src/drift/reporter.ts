import { DriftReport, DriftSeverity } from './types';

const SEVERITY_ICON: Record<DriftSeverity, string> = {
  missing: '✖',
  extra: '+',
  changed: '~',
};

const SEVERITY_LABEL: Record<DriftSeverity, string> = {
  missing: 'MISSING',
  extra: 'EXTRA',
  changed: 'CHANGED',
};

export function formatReport(report: DriftReport): string {
  const lines: string[] = [];
  lines.push(`Drift Report — ${report.serviceName}`);
  lines.push(`Generated: ${report.timestamp}`);
  lines.push('');

  if (!report.hasDrift) {
    lines.push('✔ No drift detected. Config matches source-of-truth.');
    return lines.join('\n');
  }

  lines.push(`⚠ ${report.drifts.length} drift(s) detected:`);
  lines.push('');

  for (const drift of report.drifts) {
    const icon = SEVERITY_ICON[drift.severity];
    const label = SEVERITY_LABEL[drift.severity];
    lines.push(`  [${label}] ${icon} ${drift.path}`);
    lines.push(`    ${drift.message}`);
  }

  return lines.join('\n');
}

export function formatReportJson(report: DriftReport): string {
  return JSON.stringify(report, null, 2);
}
