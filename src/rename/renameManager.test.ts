import { describe, it, expect } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import {
  loadRenameStore,
  saveRenameStore,
  renameService,
  resolveCurrentName,
  getRenameHistory,
  formatRenameResult,
} from "./renameManager";
import { RenameStore } from "./renameTypes";

function makeTempFile(): string {
  return path.join(os.tmpdir(), `rename-test-${Date.now()}.json`);
}

describe("loadRenameStore", () => {
  it("returns empty store if file does not exist", () => {
    const store = loadRenameStore("/nonexistent/path.json");
    expect(store.renames).toEqual([]);
  });

  it("loads existing store from disk", () => {
    const tmp = makeTempFile();
    const data: RenameStore = { renames: [{ oldName: "a", newName: "b", renamedAt: "2024-01-01T00:00:00.000Z" }] };
    fs.writeFileSync(tmp, JSON.stringify(data));
    const store = loadRenameStore(tmp);
    expect(store.renames).toHaveLength(1);
    fs.unlinkSync(tmp);
  });
});

describe("renameService", () => {
  it("adds a rename entry on success", () => {
    const store: RenameStore = { renames: [] };
    const result = renameService(store, "svc-a", "svc-b");
    expect(result.success).toBe(true);
    expect(store.renames).toHaveLength(1);
    expect(store.renames[0].oldName).toBe("svc-a");
  });

  it("rejects when old and new names are the same", () => {
    const store: RenameStore = { renames: [] };
    const result = renameService(store, "svc-a", "svc-a");
    expect(result.success).toBe(false);
    expect(store.renames).toHaveLength(0);
  });

  it("rejects when newName conflicts with existing entry", () => {
    const store: RenameStore = { renames: [{ oldName: "x", newName: "svc-b", renamedAt: "" }] };
    const result = renameService(store, "svc-a", "svc-b");
    expect(result.success).toBe(false);
  });
});

describe("resolveCurrentName", () => {
  it("follows rename chain to final name", () => {
    const store: RenameStore = {
      renames: [
        { oldName: "a", newName: "b", renamedAt: "" },
        { oldName: "b", newName: "c", renamedAt: "" },
      ],
    };
    expect(resolveCurrentName(store, "a")).toBe("c");
  });

  it("returns original name if no renames found", () => {
    const store: RenameStore = { renames: [] };
    expect(resolveCurrentName(store, "svc-x")).toBe("svc-x");
  });
});

describe("getRenameHistory", () => {
  it("returns entries involving the given name", () => {
    const store: RenameStore = {
      renames: [
        { oldName: "a", newName: "b", renamedAt: "" },
        { oldName: "b", newName: "c", renamedAt: "" },
        { oldName: "x", newName: "y", renamedAt: "" },
      ],
    };
    const history = getRenameHistory(store, "b");
    expect(history).toHaveLength(2);
  });
});

describe("formatRenameResult", () => {
  it("formats success result with checkmark", () => {
    const result = { success: true, oldName: "a", newName: "b", message: "Renamed." };
    expect(formatRenameResult(result)).toContain("✔");
  });

  it("formats failure result with cross", () => {
    const result = { success: false, oldName: "a", newName: "b", message: "Failed." };
    expect(formatRenameResult(result)).toContain("✘");
  });
});
