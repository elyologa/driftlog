import * as fs from 'fs';
import { loadSnapshotStore } from '../snapshot/snapshotManager';
import { loadBaselineStore } from '../baseline/baselineManager';
import { loadLockStore } from '../lock/lockManager';
import { loadArchiveStore } from '../archive/archiveManager';

export interface ServiceStatus {
  service: string;
  hasSnapshot: boolean;
  hasBaseline: boolean;
  isLocked: boolean;
  isArchived: boolean;
  snapshotAge?: string;
}

export interface StatusReport {
  services: ServiceStatus[];
  total: number;
  locked: number;
  archived: number;
  withSnapshot: number;
  withBaseline: number;
}

function getSnapshotAge(timestamp: string): string {
  const ms = Date.now() - new Date(timestamp).getTime();
  const minutes = Math.floor(ms / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function buildStatusReport(
  snapshotFile: string,
  baselineFile: string,
  lockFile: string,
  archiveFile: string
): StatusReport {
  const snapshots = loadSnapshotStore(snapshotFile);
  const baselines = loadBaselineStore(baselineFile);
  const locks = loadLockStore(lockFile);
  const archives = loadArchiveStore(archiveFile);

  const allServices = new Set<string>([
    ...Object.keys(snapshots),
    ...Object.keys(baselines),
    ...Object.keys(locks),
    ...Object.keys(archives),
  ]);

  const services: ServiceStatus[] = Array.from(allServices).sort().map((service) => {
    const snap = snapshots[service];
    return {
      service,
      hasSnapshot: !!snap,
      hasBaseline: !!baselines[service],
      isLocked: !!locks[service],
      isArchived: !!archives[service],
      snapshotAge: snap ? getSnapshotAge(snap.capturedAt) : undefined,
    };
  });

  return {
    services,
    total: services.length,
    locked: services.filter((s) => s.isLocked).length,
    archived: services.filter((s) => s.isArchived).length,
    withSnapshot: services.filter((s) => s.hasSnapshot).length,
    withBaseline: services.filter((s) => s.hasBaseline).length,
  };
}

export function formatStatusText(report: StatusReport): string {
  const lines: string[] = [
    `Services: ${report.total} total | ${report.withSnapshot} snapshotted | ${report.withBaseline} baselined | ${report.locked} locked | ${report.archived} archived`,
    '',
    `${'SERVICE'.padEnd(30)} ${'SNAP'.padEnd(6)} ${'BASE'.padEnd(6)} ${'LOCK'.padEnd(6)} ${'ARCH'.padEnd(6)} AGE`,
    '-'.repeat(70),
  ];
  for (const s of report.services) {
    lines.push(
      `${s.service.padEnd(30)} ${(s.hasSnapshot ? 'yes' : 'no').padEnd(6)} ${(s.hasBaseline ? 'yes' : 'no').padEnd(6)} ${(s.isLocked ? 'yes' : 'no').padEnd(6)} ${(s.isArchived ? 'yes' : 'no').padEnd(6)} ${s.snapshotAge ?? '-'}`
    );
  }
  return lines.join('\n');
}
