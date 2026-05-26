import * as fs from "fs";
import * as path from "path";
import { buildStatusReport, formatStatusText } from "./statusManager";
import { loadSnapshotStore } from "../snapshot/snapshotManager";

export interface StatusCommandOptions {
  snapshotFile: string;
  service?: string;
  staleThresholdHours?: number;
  json?: boolean;
}

export async function runStatusCommand(options: StatusCommandOptions): Promise<string> {
  const {
    snapshotFile,
    service,
    staleThresholdHours = 24,
    json = false,
  } = options;

  if (!fs.existsSync(snapshotFile)) {
    throw new Error(`Snapshot file not found: ${snapshotFile}`);
  }

  const store = loadSnapshotStore(snapshotFile);
  const snapshots = store.snapshots;

  const entries = service
    ? snapshots.filter((s) => s.service === service)
    : snapshots;

  if (entries.length === 0) {
    const msg = service
      ? `No snapshot found for service: ${service}`
      : "No snapshots found.";
    return msg;
  }

  const reports = entries.map((snap) =>
    buildStatusReport(snap, staleThresholdHours)
  );

  if (json) {
    return JSON.stringify(reports, null, 2);
  }

  return reports.map(formatStatusText).join("\n\n");
}
