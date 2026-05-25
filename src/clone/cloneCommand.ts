import * as fs from "fs";
import * as path from "path";
import { parseYamlFile } from "../parser/yamlParser";
import { cloneService, getClonesForService, formatCloneResult, loadCloneStore } from "./cloneManager";

export async function runCloneCommand(
  args: string[],
  snapshotPath: string,
  cloneStorePath: string
): Promise<void> {
  const subcommand = args[0];

  if (subcommand === "create") {
    const originalService = args[1];
    const clonedService = args[2];
    const note = args[3];

    if (!originalService || !clonedService) {
      console.error("Usage: clone create <originalService> <clonedService> [note]");
      process.exit(1);
    }

    const result = await cloneService(
      originalService,
      clonedService,
      snapshotPath,
      cloneStorePath,
      note
    );
    console.log(formatCloneResult(result));
    if (!result.success) process.exit(1);

  } else if (subcommand === "list") {
    const serviceName = args[1];
    if (!serviceName) {
      console.error("Usage: clone list <serviceName>");
      process.exit(1);
    }
    const store = loadCloneStore(cloneStorePath);
    const clones = getClonesForService(store, serviceName);
    if (clones.length === 0) {
      console.log(`No clones found for service "${serviceName}".`);
    } else {
      console.log(`Clones of "${serviceName}":`);
      for (const c of clones) {
        console.log(`  -> ${c.clonedService} (cloned at ${c.clonedAt})${c.note ? " | " + c.note : ""}`);
      }
    }
  } else {
    console.error("Unknown clone subcommand. Use: create | list");
    process.exit(1);
  }
}
