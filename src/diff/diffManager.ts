import { FieldDiff, ServiceDiffResult } from './diffTypes';

export function computeFieldDiffs(
  objA: Record<string, unknown>,
  objB: Record<string, unknown>
): FieldDiff[] {
  const diffs: FieldDiff[] = [];
  const allKeys = new Set([...Object.keys(objA), ...Object.keys(objB)]);

  for (const key of allKeys) {
    const inA = Object.prototype.hasOwnProperty.call(objA, key);
    const inB = Object.prototype.hasOwnProperty.call(objB, key);

    if (inA && !inB) {
      diffs.push({ key, expected: objA[key], actual: undefined, status: 'removed' });
    } else if (!inA && inB) {
      diffs.push({ key, expected: undefined, actual: objB[key], status: 'added' });
    } else if (JSON.stringify(objA[key]) !== JSON.stringify(objB[key])) {
      diffs.push({ key, expected: objA[key], actual: objB[key], status: 'changed' });
    }
  }

  return diffs;
}

export function buildServiceDiff(
  service: string,
  snapshotA: string,
  snapshotB: string,
  configA: Record<string, unknown>,
  configB: Record<string, unknown>
): ServiceDiffResult {
  const diffs = computeFieldDiffs(configA, configB);
  return {
    service,
    snapshotA,
    snapshotB,
    diffs,
    identical: diffs.length === 0,
  };
}

export function formatDiffText(result: ServiceDiffResult): string {
  if (result.identical) {
    return `[${result.service}] No differences between "${result.snapshotA}" and "${result.snapshotB}".`;
  }

  const lines: string[] = [
    `[${result.service}] Diff: "${result.snapshotA}" → "${result.snapshotB}"`,
  ];

  for (const d of result.diffs) {
    if (d.status === 'added') {
      lines.push(`  + ${d.key}: ${JSON.stringify(d.actual)}`);
    } else if (d.status === 'removed') {
      lines.push(`  - ${d.key}: ${JSON.stringify(d.expected)}`);
    } else {
      lines.push(`  ~ ${d.key}: ${JSON.stringify(d.expected)} → ${JSON.stringify(d.actual)}`);
    }
  }

  return lines.join('\n');
}

export function formatDiffMarkdown(result: ServiceDiffResult): string {
  if (result.identical) {
    return `## ${result.service}\n\nNo differences between \`${result.snapshotA}\` and \`${result.snapshotB}\`.`;
  }

  const rows = result.diffs.map((d) => {
    const symbol = d.status === 'added' ? '➕' : d.status === 'removed' ? '➖' : '🔄';
    return `| ${symbol} | \`${d.key}\` | ${JSON.stringify(d.expected)} | ${JSON.stringify(d.actual)} |`;
  });

  return [
    `## ${result.service}`,
    ``,
    `Diff: \`${result.snapshotA}\` → \`${result.snapshotB}\``,
    ``,
    `| | Key | Expected | Actual |`,
    `|---|---|---|---|`,
    ...rows,
  ].join('\n');
}
