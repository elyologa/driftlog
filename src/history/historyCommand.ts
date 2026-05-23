import * as fs from "fs";
import { getHistoryForService, pruneHistory, loadHistoryStore, saveHistoryStore } from "./historyManager";
import { formatReport } from "../drift/reporter";

export interface HistoryCommandOptions {
  service: string;
  storePath: string;
  limit?: number;
  prune?: number;
  json?: boolean;
}

export async function runHistoryCommand(options: HistoryCommandOptions): Promise<void> {
  const { service, storePath, limit, prune, json } = options;

  if (!fs.existsSync(storePath)) {
    console.error(`History store not found: ${storePath}`);
    process.exit(1);
  }

  if (prune !== undefined) {
    const store = loadHistoryStore(storePath);
    const pruned = pruneHistory(store, service, prune);
    saveHistoryStore(storePath, pruned);
    console.log(`Pruned history for "${service}" to last ${prune} entries.`);
    return;
  }

  const store = loadHistoryStore(storePath);
  const entries = getHistoryForService(store, service, limit);

  if (entries.length === 0) {
    console.log(`No history found for service: ${service}`);
    return;
  }

  if (json) {
    console.log(JSON.stringify(entries, null, 2));
    return;
  }

  for (const entry of entries) {
    const date = new Date(entry.timestamp).toISOString();
    const driftCount = entry.drifts.length;
    console.log(`\n[${date}] Drifts: ${driftCount}`);
    if (driftCount > 0) {
      const report = formatReport(entry.drifts);
      console.log(report);
    } else {
      console.log("  No drift detected.");
    }
  }
}
