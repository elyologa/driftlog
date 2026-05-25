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

function makeTempFile(content: string = "{}"): string {
  const tmp = path.join(os.tmpdir(), `driftlog-revert-${Date.now()}-${Math.random()}.json`);
  fs.writeFileSync(tmp, content, "utf-8");
  return tmp;
}

describe("loadRevertStore / saveRevertStore", () => {
  it("loads an empty store when file is empty JSON", () => {
    const f = makeTempFile("{}" );
    const store = loadRevertStore(f);
    expect(store).toEqual({});
  });

  it("round-trips store data", () => {
    const f = makeTempFile();
    const store = loadRevertStore(f);
    revertToSnapshot(store, "svc", "snap-1", { port: 3000 });
    saveRevertStore(f, store);
    const reloaded = loadRevertStore(f);
    expect(getRevertsForService(reloaded, "svc")).toHaveLength(1);
  });
});

describe("revertToSnapshot", () => {
  it("records a revert entry", () => {
    const store = {};
    const result = revertToSnapshot(store, "api", "snap-42", { replicas: 2 });
    expect(result.service).toBe("api");
    expect(result.snapshotId).toBe("snap-42");
    expect(result.config).toEqual({ replicas: 2 });
    expect(result.timestamp).toBeDefined();
  });

  it("appends multiple reverts for same service", () => {
    const store = {};
    revertToSnapshot(store, "api", "snap-1", { port: 80 });
    revertToSnapshot(store, "api", "snap-2", { port: 443 });
    const reverts = getRevertsForService(store, "api");
    expect(reverts).toHaveLength(2);
  });
});

describe("getRevertsForService", () => {
  it("returns empty array for unknown service", () => {
    expect(getRevertsForService({}, "ghost")).toEqual([]);
  });
});

describe("formatRevertResult", () => {
  it("includes service name and snapshotId", () => {
    const store = {};
    const result = revertToSnapshot(store, "worker", "snap-7", { timeout: 30 });
    const text = formatRevertResult(result);
    expect(text).toMatch(/worker/);
    expect(text).toMatch(/snap-7/);
  });
});
