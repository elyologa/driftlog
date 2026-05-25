import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import {
  loadRevertStore,
  saveRevertStore,
  revertToSnapshot,
  getRevertsForService,
  formatRevertResult,
} from "./revertManager";
import { saveSnapshotStore } from "../snapshot/snapshotManager";

function makeTempFile(): string {
  return path.join(os.tmpdir(), `driftlog-test-${Date.now()}-${Math.random()}.json`);
}

describe("revertManager", () => {
  test("loadRevertStore returns empty store if file missing", () => {
    const store = loadRevertStore("/nonexistent/path.json");
    expect(store).toEqual({ reverts: [] });
  });

  test("saveRevertStore and loadRevertStore round-trip", () => {
    const file = makeTempFile();
    const store = {
      reverts: [
        { service: "svc-a", revertedAt: "2024-01-01T00:00:00Z", fromSnapshot: "snap1", toSnapshot: "snap2" },
      ],
    };
    saveRevertStore(file, store);
    const loaded = loadRevertStore(file);
    expect(loaded.reverts).toHaveLength(1);
    expect(loaded.reverts[0].service).toBe("svc-a");
    fs.unlinkSync(file);
  });

  test("revertToSnapshot returns error if service has no current snapshot", () => {
    const snapshotFile = makeTempFile();
    const revertFile = makeTempFile();
    saveSnapshotStore(snapshotFile, { snapshots: {} });
    const result = revertToSnapshot(snapshotFile, revertFile, "missing-svc", "snap1");
    expect(result.success).toBe(false);
    expect(result.message).toContain("No current snapshot");
    fs.unlinkSync(snapshotFile);
    fs.unlinkSync(revertFile);
  });

  test("revertToSnapshot returns error if target snapshot not found in history", () => {
    const snapshotFile = makeTempFile();
    const revertFile = makeTempFile();
    saveSnapshotStore(snapshotFile, {
      snapshots: { "svc-a": { id: "snap1", service: "svc-a", config: {}, capturedAt: "2024-01-01T00:00:00Z" } },
      history: { "svc-a": [] },
    });
    const result = revertToSnapshot(snapshotFile, revertFile, "svc-a", "snap-missing");
    expect(result.success).toBe(false);
    expect(result.message).toContain("not found");
    fs.unlinkSync(snapshotFile);
    fs.unlinkSync(revertFile);
  });

  test("getRevertsForService filters by service", () => {
    const file = makeTempFile();
    saveRevertStore(file, {
      reverts: [
        { service: "svc-a", revertedAt: "2024-01-01T00:00:00Z", fromSnapshot: "s1", toSnapshot: "s2" },
        { service: "svc-b", revertedAt: "2024-01-02T00:00:00Z", fromSnapshot: "s3", toSnapshot: "s4" },
      ],
    });
    const results = getRevertsForService(file, "svc-a");
    expect(results).toHaveLength(1);
    expect(results[0].service).toBe("svc-a");
    fs.unlinkSync(file);
  });

  test("formatRevertResult formats success and error correctly", () => {
    expect(formatRevertResult({ success: true, service: "svc", fromSnapshot: "s1", toSnapshot: "s2", message: "Done" })).toBe("[OK] Done");
    expect(formatRevertResult({ success: false, service: "svc", fromSnapshot: "", toSnapshot: "s2", message: "Fail" })).toBe("[ERROR] Fail");
  });
});
