import * as fs from "fs";
import { RevertStore, RevertEntry, RevertResult } from "./revertTypes";
import { loadSnapshotStore, saveSnapshotStore } from "../snapshot/snapshotManager";

export function loadRevertStore(filePath: string): RevertStore {
  if (!fs.existsSync(filePath)) return { reverts: [] };
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw) as RevertStore;
}

export function saveRevertStore(filePath: string, store: RevertStore): void {
  fs.writeFileSync(filePath, JSON.stringify(store, null, 2), "utf-8");
}

export function revertToSnapshot(
  snapshotFile: string,
  revertFile: string,
  service: string,
  targetSnapshotId: string,
  reason?: string
): RevertResult {
  const snapshotStore = loadSnapshotStore(snapshotFile);
  const current = snapshotStore.snapshots[service];

  if (!current) {
    return {
      success: false,
      service,
      fromSnapshot: "",
      toSnapshot: targetSnapshotId,
      message: `No current snapshot found for service "${service}".`,
    };
  }

  const allSnapshots = snapshotStore.history?.[service] ?? [];
  const target = allSnapshots.find((s: any) => s.id === targetSnapshotId);

  if (!target) {
    return {
      success: false,
      service,
      fromSnapshot: current.id ?? "",
      toSnapshot: targetSnapshotId,
      message: `Snapshot "${targetSnapshotId}" not found for service "${service}".`,
    };
  }

  const fromId = current.id ?? "unknown";
  snapshotStore.snapshots[service] = target;
  saveSnapshotStore(snapshotFile, snapshotStore);

  const entry: RevertEntry = {
    service,
    revertedAt: new Date().toISOString(),
    fromSnapshot: fromId,
    toSnapshot: targetSnapshotId,
    reason,
  };

  const revertStore = loadRevertStore(revertFile);
  revertStore.reverts.push(entry);
  saveRevertStore(revertFile, revertStore);

  return {
    success: true,
    service,
    fromSnapshot: fromId,
    toSnapshot: targetSnapshotId,
    message: `Reverted "${service}" from snapshot "${fromId}" to "${targetSnapshotId}".`,
  };
}

export function getRevertsForService(revertFile: string, service: string): RevertEntry[] {
  const store = loadRevertStore(revertFile);
  return store.reverts.filter((r) => r.service === service);
}

export function formatRevertResult(result: RevertResult): string {
  if (!result.success) return `[ERROR] ${result.message}`;
  return `[OK] ${result.message}`;
}
