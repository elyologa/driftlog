import * as fs from "fs";
import { loadRevertStore, saveRevertStore, revertToSnapshot, getRevertsForService, formatRevertResult } from "./revertManager";
import { loadSnapshotStore } from "../snapshot/snapshotManager";

export async function runRevertCommand(
  args: string[],
  storeFile: string,
  snapshotFile: string,
  out: (msg: string) => void = console.log
): Promise<void> {
  const [subcommand, ...rest] = args;

  if (subcommand === "to") {
    const [service, snapshotId] = rest;
    if (!service || !snapshotId) {
      out("Usage: revert to <service> <snapshotId>");
      return;
    }
    const store = loadRevertStore(storeFile);
    const snapshotStore = loadSnapshotStore(snapshotFile);
    const snapshot = snapshotStore.snapshots?.[service]?.find(
      (s: any) => s.id === snapshotId
    );
    if (!snapshot) {
      out(`No snapshot found for service "${service}" with id "${snapshotId}".`);
      return;
    }
    const result = revertToSnapshot(store, service, snapshotId, snapshot.config);
    saveRevertStore(storeFile, store);
    out(formatRevertResult(result));
    return;
  }

  if (subcommand === "list") {
    const [service] = rest;
    if (!service) {
      out("Usage: revert list <service>");
      return;
    }
    const store = loadRevertStore(storeFile);
    const reverts = getRevertsForService(store, service);
    if (reverts.length === 0) {
      out(`No reverts recorded for service "${service}".`);
      return;
    }
    out(`Reverts for "${service}":`);
    for (const r of reverts) {
      out(`  [${r.timestamp}] -> snapshot ${r.snapshotId} (reason: ${r.reason ?? "none"})`);
    }
    return;
  }

  out("Unknown subcommand. Usage: revert to <service> <snapshotId> | revert list <service>");
}
