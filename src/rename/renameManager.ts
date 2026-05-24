import fs from "fs";
import { RenameStore, RenameEntry, RenameResult } from "./renameTypes";

export function loadRenameStore(storePath: string): RenameStore {
  if (!fs.existsSync(storePath)) {
    return { renames: [] };
  }
  const raw = fs.readFileSync(storePath, "utf-8");
  return JSON.parse(raw) as RenameStore;
}

export function saveRenameStore(storePath: string, store: RenameStore): void {
  fs.writeFileSync(storePath, JSON.stringify(store, null, 2), "utf-8");
}

export function renameService(
  store: RenameStore,
  oldName: string,
  newName: string
): RenameResult {
  if (!oldName || !newName) {
    return { success: false, oldName, newName, message: "Both oldName and newName are required." };
  }
  if (oldName === newName) {
    return { success: false, oldName, newName, message: "Old and new names must differ." };
  }
  const conflict = store.renames.find((r) => r.newName === newName);
  if (conflict) {
    return { success: false, oldName, newName, message: `Service name "${newName}" is already in use.` };
  }
  const entry: RenameEntry = {
    oldName,
    newName,
    renamedAt: new Date().toISOString(),
  };
  store.renames.push(entry);
  return { success: true, oldName, newName, message: `Renamed "${oldName}" to "${newName}".` };
}

export function resolveCurrentName(store: RenameStore, name: string): string {
  let current = name;
  let iterations = 0;
  while (iterations < 100) {
    const entry = store.renames.find((r) => r.oldName === current);
    if (!entry) break;
    current = entry.newName;
    iterations++;
  }
  return current;
}

export function getRenameHistory(store: RenameStore, name: string): RenameEntry[] {
  return store.renames.filter((r) => r.oldName === name || r.newName === name);
}

export function formatRenameResult(result: RenameResult): string {
  return result.success
    ? `✔ ${result.message}`
    : `✘ ${result.message}`;
}
