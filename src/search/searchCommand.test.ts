import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { runSearchCommand } from "./searchCommand";

function makeTempFile(data: object): string {
  const tmpFile = path.join(os.tmpdir(), `driftlog-search-cmd-${Date.now()}.json`);
  fs.writeFileSync(tmpFile, JSON.stringify(data));
  return tmpFile;
}

const sampleHistory = {
  "auth-service": [
    {
      timestamp: "2024-01-10T10:00:00.000Z",
      drifts: [
        { key: "replicas", expected: 3, actual: 2, severity: "high" },
        { key: "image.tag", expected: "v1.2.0", actual: "v1.1.0", severity: "medium" }
      ]
    }
  ],
  "payment-service": [
    {
      timestamp: "2024-01-11T12:00:00.000Z",
      drifts: [
        { key: "env.LOG_LEVEL", expected: "info", actual: "debug", severity: "low" }
      ]
    }
  ]
};

describe("runSearchCommand", () => {
  let tmpFile: string;

  beforeEach(() => {
    tmpFile = makeTempFile(sampleHistory);
  });

  afterEach(() => {
    if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
  });

  it("prints no history message when file does not exist", async () => {
    const spy = jest.spyOn(console, "log").mockImplementation(() => {});
    await runSearchCommand([], "/nonexistent/path.json");
    expect(spy).toHaveBeenCalledWith("No history file found.");
    spy.mockRestore();
  });

  it("outputs text results filtered by service", async () => {
    const spy = jest.spyOn(console, "log").mockImplementation(() => {});
    await runSearchCommand(["--service", "auth-service"], tmpFile, "text");
    const output = spy.mock.calls.map((c) => c[0]).join("\n");
    expect(output).toContain("auth-service");
    expect(output).not.toContain("payment-service");
    spy.mockRestore();
  });

  it("outputs json results when format is json", async () => {
    const spy = jest.spyOn(console, "log").mockImplementation(() => {});
    await runSearchCommand(["--severity", "high"], tmpFile, "json");
    const output = spy.mock.calls[0][0];
    const parsed = JSON.parse(output);
    expect(Array.isArray(parsed)).toBe(true);
    parsed.forEach((r: { severity: string }) => {
      expect(r.severity).toBe("high");
    });
    spy.mockRestore();
  });

  it("respects --limit option", async () => {
    const spy = jest.spyOn(console, "log").mockImplementation(() => {});
    await runSearchCommand(["--limit", "1"], tmpFile, "json");
    const output = spy.mock.calls[0][0];
    const parsed = JSON.parse(output);
    expect(parsed.length).toBeLessThanOrEqual(1);
    spy.mockRestore();
  });
});
