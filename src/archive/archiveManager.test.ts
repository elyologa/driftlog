import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import {
  loadArchiveStore,
  saveArchiveStore,
  archiveService,
  getArchivedService,
  listArchivedServices,
  removeArchivedService,
  formatArchiveList,
} from "./archiveManager";

function makeTempFile(): string {
  return path.join(os.tmpdir(), `archive-test-${Date.now()}.json`);
}

describe("archiveManager", () => {
  it("loads an empty store when file does not exist", () => {
    const store = loadArchiveStore("/nonexistent/path/archive.json");
    expect(store.entries).toEqual([]);
  });

  it("saves and loads a store", () => {
    const file = makeTempFile();
    const store = { entries: [] };
    archiveService(store, "svc-a", { replicas: 2 }, "decommissioned");
    saveArchiveStore(file, store);
    const loaded = loadArchiveStore(file);
    expect(loaded.entries).toHaveLength(1);
    expect(loaded.entries[0].service).toBe("svc-a");
    fs.unlinkSync(file);
  });

  it("archives a service with reason", () => {
    const store = { entries: [] };
    const entry = archiveService(store, "svc-b", { port: 8080 }, "deprecated");
    expect(entry.service).toBe("svc-b");
    expect(entry.reason).toBe("deprecated");
    expect(entry.snapshot).toEqual({ port: 8080 });
    expect(store.entries).toHaveLength(1);
  });

  it("retrieves the most recent archive entry for a service", () => {
    const store = { entries: [] };
    archiveService(store, "svc-c", { replicas: 1 });
    archiveService(store, "svc-c", { replicas: 3 });
    const entry = getArchivedService(store, "svc-c");
    expect(entry?.snapshot).toEqual({ replicas: 3 });
  });

  it("returns undefined for unknown service", () => {
    const store = { entries: [] };
    expect(getArchivedService(store, "unknown")).toBeUndefined();
  });

  it("lists unique archived service names", () => {
    const store = { entries: [] };
    archiveService(store, "svc-a", {});
    archiveService(store, "svc-b", {});
    archiveService(store, "svc-a", {});
    const list = listArchivedServices(store);
    expect(list).toEqual(["svc-a", "svc-b"]);
  });

  it("removes all entries for a service", () => {
    const store = { entries: [] };
    archiveService(store, "svc-x", {});
    archiveService(store, "svc-y", {});
    const removed = removeArchivedService(store, "svc-x");
    expect(removed).toBe(true);
    expect(store.entries.every((e) => e.service !== "svc-x")).toBe(true);
  });

  it("returns false when removing a non-existent service", () => {
    const store = { entries: [] };
    expect(removeArchivedService(store, "ghost")).toBe(false);
  });

  it("formats archive list correctly", () => {
    expect(formatArchiveList([])).toBe("No archived services.");
    expect(formatArchiveList(["svc-a", "svc-b"])).toContain("svc-a");
    expect(formatArchiveList(["svc-a", "svc-b"])).toContain("svc-b");
  });
});
