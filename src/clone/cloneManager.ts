import * as fs from "fs";
import { CloneEntry, CloneStore, CloneResult } from "./cloneTypes";
import { loadSnapshotStore, saveSnapshotStore, getSnapshot, upsertSnapshot, createSnapshot } from "../snapshot/snapshotManager";

export function loadCloneStore(filePath: string): CloneStore {
  if (!fs.existsSync(filePath)) return { clones: [] };
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw) as CloneStore;
  } catch {
    return { clones: [] };
  }
}

export function saveCloneStore(filePath: string, store: CloneStore): void {
  fs.writeFileSync(filePath, JSON.stringify(store, null, 2), "utf-8");
}

export async function cloneService(
  originalService: string,
  clonedService: string,
  snapshotPath: string,
  cloneStorePath: string,
  note?: string
): Promise<CloneResult> {
  const snapshotStore = loadSnapshotStore(snapshotPath);
  const original = getSnapshot(snapshotStore, originalService);

  if (!original) {
    return {
      success: false,
      originalService,
      clonedService,
      message: `Original service "${originalService}" not found in snapshots.`,
    };
  }

  const clonedSnapshot = createSnapshot(clonedService, { ...original.config });
  const updatedSnapshotStore = upsertSnapshot(snapshotStore, clonedSnapshot);
  saveSnapshotStore(snapshotPath, updatedSnapshotStore);

  const cloneStore = loadCloneStore(cloneStorePath);
  const entry: CloneEntry = {
    originalService,
    clonedService,
    clonedAt: new Date().toISOString(),
    note,
  };
  cloneStore.clones.push(entry);
  saveCloneStore(cloneStorePath, cloneStore);

  return {
    success: true,
    originalService,
    clonedService,
    message: `Service "${originalService}" successfully cloned as "${clonedService}".`,
  };
}

export function getClonesForService(store: CloneStore, serviceName: string): CloneEntry[] {
  return store.clones.filter((c) => c.originalService === serviceName);
}

export function formatCloneResult(result: CloneResult): string {
  return result.success
    ? `✔ ${result.message}`
    : `✘ ${result.message}`;
}
