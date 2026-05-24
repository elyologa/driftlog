import path from "path";
import {
  loadRenameStore,
  saveRenameStore,
  renameService,
  resolveCurrentName,
  getRenameHistory,
  formatRenameResult,
} from "./renameManager";

const DEFAULT_STORE = path.resolve(process.cwd(), ".driftlog", "renames.json");

export function runRenameCommand(
  args: string[],
  storePath: string = DEFAULT_STORE
): void {
  const [subcommand, ...rest] = args;

  const store = loadRenameStore(storePath);

  if (subcommand === "rename") {
    const [oldName, newName] = rest;
    if (!oldName || !newName) {
      console.error("Usage: rename <oldName> <newName>");
      process.exit(1);
    }
    const result = renameService(store, oldName, newName);
    console.log(formatRenameResult(result));
    if (result.success) {
      saveRenameStore(storePath, store);
    }
    return;
  }

  if (subcommand === "resolve") {
    const [name] = rest;
    if (!name) {
      console.error("Usage: rename resolve <name>");
      process.exit(1);
    }
    const current = resolveCurrentName(store, name);
    console.log(`Current name for "${name}": ${current}`);
    return;
  }

  if (subcommand === "history") {
    const [name] = rest;
    if (!name) {
      console.error("Usage: rename history <name>");
      process.exit(1);
    }
    const entries = getRenameHistory(store, name);
    if (entries.length === 0) {
      console.log(`No rename history found for "${name}".`);
    } else {
      entries.forEach((e) =>
        console.log(`  ${e.renamedAt}: "${e.oldName}" → "${e.newName}"`)
      );
    }
    return;
  }

  console.error("Unknown subcommand. Use: rename | resolve | history");
  process.exit(1);
}
