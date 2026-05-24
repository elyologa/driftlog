import * as fs from "fs";
import { loadHistoryStore } from "../history/historyManager";
import { loadSnapshotStore } from "../snapshot/snapshotManager";
import { buildRollupSummary, formatRollupText } from "./rollupManager";

export interface RollupCommandOptions {
  historyFile: string;
  snapshotFile: string;
  tag?: string;
  format?: "text" | "json";
  output?: string;
}

export async function runRollupCommand(options: RollupCommandOptions): Promise<void> {
  const historyStore = loadHistoryStore(options.historyFile);
  const snapshotStore = loadSnapshotStore(options.snapshotFile);

  const serviceNames = Object.keys(snapshotStore.snapshots);
  if (serviceNames.length === 0) {
    console.log("No snapshots found. Nothing to roll up.");
    return;
  }

  const summary = buildRollupSummary(serviceNames, historyStore, snapshotStore, options.tag);

  let output: string;
  if (options.format === "json") {
    output = JSON.stringify(summary, null, 2);
  } else {
    output = formatRollupText(summary);
  }

  if (options.output) {
    fs.writeFileSync(options.output, output, "utf-8");
    console.log(`Rollup report written to ${options.output}`);
  } else {
    console.log(output);
  }
}
