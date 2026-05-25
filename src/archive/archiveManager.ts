import * as fs from "fs";
import * as path from "path";

export interface ArchiveEntry {
  service: string;
  archivedAt: string;
  reason?: string;
  snapshot: Record<string, unknown>;
}

export interface ArchiveStore {
  entries: ArchiveEntry[];
}

export function loadArchiveStore(filePath: string): ArchiveStore {
  if (!fs.existsSync(filePath)) {
    return { entries: [] };
  }
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw) as ArchiveStore;
}

export function saveArchiveStore(filePath: string, store: ArchiveStore): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(store, null, 2), "utf-8");
}

export function archiveService(
  store: ArchiveStore,
  service: string,
  snapshot: Record<string, unknown>,
  reason?: string
): ArchiveEntry {
  const entry: ArchiveEntry = {
    service,
    archivedAt: new Date().toISOString(),
    reason,
    snapshot,
  };
  store.entries.push(entry);
  return entry;
}

export function getArchivedService(
  store: ArchiveStore,
  service: string
): ArchiveEntry | undefined {
  return [...store.entries]
    .reverse()
    .find((e) => e.service === service);
}

export function listArchivedServices(store: ArchiveStore): string[] {
  const seen = new Set<string>();
  return store.entries
    .map((e) => e.service)
    .filter((s) => {
      if (seen.has(s)) return false;
      seen.add(s);
      return true;
    });
}

export function removeArchivedService(
  store: ArchiveStore,
  service: string
): boolean {
  const before = store.entries.length;
  store.entries = store.entries.filter((e) => e.service !== service);
  return store.entries.length < before;
}

export function formatArchiveList(entries: string[]): string {
  if (entries.length === 0) return "No archived services.";
  return `Archived services:\n${entries.map((s) => `  - ${s}`).join("\n")}`;
}
