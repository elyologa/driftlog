import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { runHistoryCommand } from "./historyCommand";
import { saveHistoryStore } from "./historyManager";
import { HistoryStore } from "./historyTypes";

const tmpDir = () => fs.mkdtempSync(path.join(os.tmpdir(), "driftlog-history-"));

const sampleStore: HistoryStore = {
  "api-service": [
    {
      service: "api-service",
      timestamp: 1700000000000,
      drifts: [
        { key: "replicas", expected: 3, actual: 2 }
      ]
    },
    {
      service: "api-service",
      timestamp: 1700001000000,
      drifts: []
    }
  ]
};

describe("runHistoryCommand", () => {
  let dir: string;
  let storePath: string;

  beforeEach(() => {
    dir = tmpDir();
    storePath = path.join(dir, "history.json");
    saveHistoryStore(storePath, sampleStore);
  });

  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it("prints history entries as text", async () => {
    const spy = jest.spyOn(console, "log").mockImplementation(() => {});
    await runHistoryCommand({ service: "api-service", storePath });
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it("prints history entries as JSON", async () => {
    const spy = jest.spyOn(console, "log").mockImplementation(() => {});
    await runHistoryCommand({ service: "api-service", storePath, json: true });
    const output = spy.mock.calls[0][0];
    const parsed = JSON.parse(output);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed.length).toBe(2);
    spy.mockRestore();
  });

  it("respects limit option", async () => {
    const spy = jest.spyOn(console, "log").mockImplementation(() => {});
    await runHistoryCommand({ service: "api-service", storePath, limit: 1, json: true });
    const output = spy.mock.calls[0][0];
    const parsed = JSON.parse(output);
    expect(parsed.length).toBe(1);
    spy.mockRestore();
  });

  it("handles missing store file", async () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    const exitSpy = jest.spyOn(process, "exit").mockImplementation(() => { throw new Error("exit"); });
    await expect(runHistoryCommand({ service: "api-service", storePath: "/nonexistent/path.json" })).rejects.toThrow("exit");
    spy.mockRestore();
    exitSpy.mockRestore();
  });

  it("prunes history entries", async () => {
    const spy = jest.spyOn(console, "log").mockImplementation(() => {});
    await runHistoryCommand({ service: "api-service", storePath, prune: 1 });
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("Pruned"));
    spy.mockRestore();
  });

  it("handles service with no history", async () => {
    const spy = jest.spyOn(console, "log").mockImplementation(() => {});
    await runHistoryCommand({ service: "unknown-service", storePath });
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("No history found"));
    spy.mockRestore();
  });
});
