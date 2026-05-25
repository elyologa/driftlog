import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { runRevertCommand } from "./revertCommand";
import { saveRevertStore } from "./revertManager";
import { saveSnapshotStore } from "../snapshot/snapshotManager";

function makeTempFile(content: string = "{}"): string {
  const tmp = path.join(os.tmpdir(), `driftlog-test-${Date.now()}-${Math.random()}.json`);
  fs.writeFileSync(tmp, content, "utf-8");
  return tmp;
}

function makeSnapshotFile(service: string, id: string, config: Record<string, unknown>): string {
  const tmp = makeTempFile();
  const store = { snapshots: { [service]: [{ id, config, timestamp: "2024-01-01T00:00:00.000Z" }] } };
  fs.writeFileSync(tmp, JSON.stringify(store), "utf-8");
  return tmp;
}

describe("runRevertCommand", () => {
  it("reverts a service to a known snapshot", async () => {
    const storeFile = makeTempFile();
    const snapshotFile = makeSnapshotFile("api", "snap-1", { port: 8080 });
    const out: string[] = [];
    await runRevertCommand(["to", "api", "snap-1"], storeFile, snapshotFile, (m) => out.push(m));
    expect(out.some((l) => l.includes("api") || l.includes("snap-1"))).toBe(true);
  });

  it("prints error when snapshot not found", async () => {
    const storeFile = makeTempFile();
    const snapshotFile = makeTempFile(JSON.stringify({ snapshots: {} }));
    const out: string[] = [];
    await runRevertCommand(["to", "api", "missing-id"], storeFile, snapshotFile, (m) => out.push(m));
    expect(out[0]).toMatch(/no snapshot found/i);
  });

  it("lists reverts for a service", async () => {
    const storeFile = makeTempFile();
    const snapshotFile = makeSnapshotFile("api", "snap-1", { port: 8080 });
    await runRevertCommand(["to", "api", "snap-1"], storeFile, snapshotFile, () => {});
    const out: string[] = [];
    await runRevertCommand(["list", "api"], storeFile, snapshotFile, (m) => out.push(m));
    expect(out.some((l) => l.includes("snap-1"))).toBe(true);
  });

  it("prints message when no reverts exist", async () => {
    const storeFile = makeTempFile();
    const snapshotFile = makeTempFile(JSON.stringify({ snapshots: {} }));
    const out: string[] = [];
    await runRevertCommand(["list", "unknown-service"], storeFile, snapshotFile, (m) => out.push(m));
    expect(out[0]).toMatch(/no reverts/i);
  });

  it("shows usage for unknown subcommand", async () => {
    const storeFile = makeTempFile();
    const snapshotFile = makeTempFile(JSON.stringify({ snapshots: {} }));
    const out: string[] = [];
    await runRevertCommand(["bogus"], storeFile, snapshotFile, (m) => out.push(m));
    expect(out[0]).toMatch(/unknown subcommand/i);
  });

  it("shows usage when 'to' args are missing", async () => {
    const storeFile = makeTempFile();
    const snapshotFile = makeTempFile(JSON.stringify({ snapshots: {} }));
    const out: string[] = [];
    await runRevertCommand(["to"], storeFile, snapshotFile, (m) => out.push(m));
    expect(out[0]).toMatch(/usage/i);
  });
});
