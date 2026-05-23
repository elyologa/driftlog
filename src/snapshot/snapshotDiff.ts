import { Snapshot } from './types';
import { DriftResult } from '../drift/types';
import { detectDrift } from '../drift/detector';

export interface SnapshotDiff {
  serviceName: string;
  from: {
    snapshotId: string;
    capturedAt: string;
  };
  to: {
    snapshotId: string;
    capturedAt: string;
  };
  drifts: DriftResult[];
  hasChanges: boolean;
}

/**
 * Compares two snapshots of the same service and returns the diff.
 */
export function diffSnapshots(older: Snapshot, newer: Snapshot): SnapshotDiff {
  if (older.serviceName !== newer.serviceName) {
    throw new Error(
      `Cannot diff snapshots from different services: "${older.serviceName}" vs "${newer.serviceName}"`
    );
  }

  const drifts = detectDrift(older.config, newer.config);

  return {
    serviceName: older.serviceName,
    from: {
      snapshotId: older.snapshotId,
      capturedAt: older.capturedAt,
    },
    to: {
      snapshotId: newer.snapshotId,
      capturedAt: newer.capturedAt,
    },
    drifts,
    hasChanges: drifts.length > 0,
  };
}

/**
 * Formats a SnapshotDiff into a human-readable string.
 */
export function formatSnapshotDiff(diff: SnapshotDiff): string {
  const lines: string[] = [];
  lines.push(`Snapshot diff for service: ${diff.serviceName}`);
  lines.push(`  From: ${diff.from.snapshotId} (${diff.from.capturedAt})`);
  lines.push(`  To:   ${diff.to.snapshotId} (${diff.to.capturedAt})`);

  if (!diff.hasChanges) {
    lines.push('  No changes detected between snapshots.');
    return lines.join('\n');
  }

  lines.push(`  Changes (${diff.drifts.length}):`);
  for (const drift of diff.drifts) {
    if (drift.type === 'missing') {
      lines.push(`    [REMOVED]  ${drift.key}: was "${drift.expected}"`);
    } else if (drift.type === 'extra') {
      lines.push(`    [ADDED]    ${drift.key}: now "${drift.actual}"`);
    } else {
      lines.push(`    [CHANGED]  ${drift.key}: "${drift.expected}" → "${drift.actual}"`);
    }
  }

  return lines.join('\n');
}
