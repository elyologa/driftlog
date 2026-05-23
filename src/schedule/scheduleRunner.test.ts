import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { runDueSchedules, formatRunResults } from "./scheduleRunner";
import { saveScheduleStore } from "./scheduleManager";
import { ScheduleStore } from "./scheduleTypes";

function makeTempFile(): string {
  return path.join(os.tmpdir(), `schedule-runner-test-${Date.now()}.json`);
}

describe("runDueSchedules", () => {
  let storeFile: string;

  beforeEach(() => {
    storeFile = makeTempFile();
  });

  afterEach(() => {
    if (fs.existsSync(storeFile)) fs.unlinkSync(storeFile);
  });

  it("returns empty results when no schedules are due", async () => {
    const store: ScheduleStore = {
      schedules: {
        "svc-a": {
          serviceName: "svc-a",
          intervalSeconds: 3600,
          lastRunAt: new Date().toISOString(),
        },
      },
    };
    saveScheduleStore(storeFile, store);
    const mockDrift = jest.fn();
    const results = await runDueSchedules(storeFile, mockDrift, new Date());
    expect(results).toHaveLength(0);
    expect(mockDrift).not.toHaveBeenCalled();
  });

  it("runs drift for due schedules", async () => {
    const past = new Date(Date.now() - 7200 * 1000).toISOString();
    const store: ScheduleStore = {
      schedules: {
        "svc-b": {
          serviceName: "svc-b",
          intervalSeconds: 3600,
          lastRunAt: past,
        },
      },
    };
    saveScheduleStore(storeFile, store);
    const mockDrift = jest.fn().mockResolvedValue(undefined);
    const results = await runDueSchedules(storeFile, mockDrift, new Date());
    expect(results).toHaveLength(1);
    expect(results[0].serviceName).toBe("svc-b");
    expect(results[0].error).toBeUndefined();
    expect(mockDrift).toHaveBeenCalledWith("svc-b", undefined);
  });

  it("captures errors from drift runs", async () => {
    const store: ScheduleStore = {
      schedules: {
        "svc-c": {
          serviceName: "svc-c",
          intervalSeconds: 60,
          lastRunAt: undefined,
        },
      },
    };
    saveScheduleStore(storeFile, store);
    const mockDrift = jest.fn().mockRejectedValue(new Error("drift failed"));
    const results = await runDueSchedules(storeFile, mockDrift, new Date());
    expect(results[0].error).toBe("drift failed");
  });
});

describe("formatRunResults", () => {
  it("returns message when no results", () => {
    expect(formatRunResults([])).toBe("No schedules were due.");
  });

  it("formats successful results", () => {
    const out = formatRunResults([
      { serviceName: "svc-a", ranAt: "2024-01-01T00:00:00.000Z" },
    ]);
    expect(out).toContain("[OK]");
    expect(out).toContain("svc-a");
  });

  it("formats error results", () => {
    const out = formatRunResults([
      { serviceName: "svc-b", ranAt: "2024-01-01T00:00:00.000Z", error: "oops" },
    ]);
    expect(out).toContain("[ERROR]");
    expect(out).toContain("oops");
  });
});
