import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { runCloneCommand } from "./cloneCommand";
import { saveSnapshotStore } from "../snapshot/snapshotManager";
import { createSnapshot } from "../snapshot/snapshotManager";

function makeTempFile(content: string): string {
  const tmp = path.join(os.tmpdir(), `driftlog-test-${Date.now()}-${Math.random()}.json`);
  fs.writeFileSync(tmp, content, "utf-8");
  return tmp;
}

describe("runCloneCommand", () => {
  let snapshotPath: string;
  let cloneStorePath: string;

  beforeEach(() => {
    const snap = createSnapshot("auth-service", { "env": "production", "replicas": 3 });
    const store = { snapshots: [snap] };
    snapshotPath = makeTempFile(JSON.stringify(store));
    cloneStorePath = makeTempFile(JSON.stringify({ clones: [] }));
  });

  afterEach(() => {
    if (fs.existsSync(snapshotPath)) fs.unlinkSync(snapshotPath);
    if (fs.existsSync(cloneStorePath)) fs.unlinkSync(cloneStorePath);
  });

  it("creates a clone of an existing service", async () => {
    const spy = jest.spyOn(console, "log").mockImplementation(() => {});
    await runCloneCommand(["create", "auth-service", "auth-service-v2"], snapshotPath, cloneStorePath);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("auth-service-v2"));
    spy.mockRestore();
  });

  it("lists clones for a service after creating one", async () => {
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    await runCloneCommand(["create", "auth-service", "auth-service-copy", "test clone"], snapshotPath, cloneStorePath);
    await runCloneCommand(["list", "auth-service"], snapshotPath, cloneStorePath);
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("auth-service-copy"));
    logSpy.mockRestore();
  });

  it("prints no clones message when none exist", async () => {
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    await runCloneCommand(["list", "nonexistent-service"], snapshotPath, cloneStorePath);
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("No clones found"));
    logSpy.mockRestore();
  });

  it("exits with error for missing arguments on create", async () => {
    const errSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const exitSpy = jest.spyOn(process, "exit").mockImplementation(() => { throw new Error("exit"); });
    await expect(runCloneCommand(["create", "auth-service"], snapshotPath, cloneStorePath)).rejects.toThrow("exit");
    errSpy.mockRestore();
    exitSpy.mockRestore();
  });
});
