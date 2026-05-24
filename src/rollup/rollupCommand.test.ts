import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { runRollupCommand } from "./rollupCommand";
import { saveHistoryStore } from "../history/historyManager";
import { saveSnapshotStore } from "../snapshot/snapshotManager";

function makeTempFile(content: object): string {
  const tmp = path.join(os.tmpdir(), `driftlog-test-${Date.now()}-${Math.random()}.json`);
  fs.writeFileSync(tmp, JSON.stringify(content), "utf-8");
  return tmp;
}

describe("runRollupCommand", () => {
  let historyFile: string;
  let snapshotFile: string;

  beforeEach(() => {
    historyFile = makeTempFile({ entries: [] });
    snapshotFile = makeTempFile({ snapshots: {} });
  });

  afterEach(() => {
    [historyFile, snapshotFile].forEach(f => { try { fs.unlinkSync(f); } catch {} });
  });

  it("prints a message when no snapshots exist", async () => {
    const spy = jest.spyOn(console, "log").mockImplementation(() => {});
    await runRollupCommand({ historyFile, snapshotFile });
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("No snapshots found"));
    spy.mockRestore();
  });

  it("outputs text rollup to console when snapshots exist", async () => {
    const snap = {
      snapshots: {
        "api": { serviceName: "api", capturedAt: new Date().toISOString(), config: { port: 8080 } }
      }
    };
    fs.writeFileSync(snapshotFile, JSON.stringify(snap), "utf-8");

    const spy = jest.spyOn(console, "log").mockImplementation(() => {});
    await runRollupCommand({ historyFile, snapshotFile, format: "text" });
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it("writes JSON output to file when output path is provided", async () => {
    const snap = {
      snapshots: {
        "worker": { serviceName: "worker", capturedAt: new Date().toISOString(), config: { threads: 4 } }
      }
    };
    fs.writeFileSync(snapshotFile, JSON.stringify(snap), "utf-8");

    const outFile = path.join(os.tmpdir(), `rollup-out-${Date.now()}.json`);
    const spy = jest.spyOn(console, "log").mockImplementation(() => {});
    try {
      await runRollupCommand({ historyFile, snapshotFile, format: "json", output: outFile });
      const written = JSON.parse(fs.readFileSync(outFile, "utf-8"));
      expect(written).toHaveProperty("services");
    } finally {
      try { fs.unlinkSync(outFile); } catch {}
      spy.mockRestore();
    }
  });
});
