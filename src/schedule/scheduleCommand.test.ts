import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { runScheduleCommand } from "./scheduleCommand";

function makeTempFile(): string {
  return path.join(os.tmpdir(), `schedule-cmd-test-${Date.now()}.json`);
}

describe("runScheduleCommand", () => {
  let storeFile: string;

  beforeEach(() => {
    storeFile = makeTempFile();
  });

  afterEach(() => {
    if (fs.existsSync(storeFile)) fs.unlinkSync(storeFile);
  });

  it("returns usage when no subcommand given", async () => {
    const result = await runScheduleCommand([], storeFile);
    expect(result).toContain("Usage");
  });

  it("sets a schedule for a service", async () => {
    const result = await runScheduleCommand(
      ["set", "auth-service", "300"],
      storeFile
    );
    expect(result).toContain("auth-service");
    expect(result).toContain("300s");
  });

  it("returns error for invalid interval", async () => {
    const result = await runScheduleCommand(
      ["set", "auth-service", "abc"],
      storeFile
    );
    expect(result).toContain("Error");
  });

  it("gets a schedule after setting it", async () => {
    await runScheduleCommand(["set", "auth-service", "60"], storeFile);
    const result = await runScheduleCommand(["get", "auth-service"], storeFile);
    const parsed = JSON.parse(result);
    expect(parsed.serviceName).toBe("auth-service");
    expect(parsed.intervalSeconds).toBe(60);
  });

  it("returns not found for unknown service", async () => {
    const result = await runScheduleCommand(["get", "unknown"], storeFile);
    expect(result).toContain("No schedule found");
  });

  it("lists all schedules", async () => {
    await runScheduleCommand(["set", "svc-a", "120"], storeFile);
    await runScheduleCommand(["set", "svc-b", "240"], storeFile);
    const result = await runScheduleCommand(["list"], storeFile);
    expect(result).toContain("svc-a");
    expect(result).toContain("svc-b");
  });

  it("removes a schedule", async () => {
    await runScheduleCommand(["set", "auth-service", "300"], storeFile);
    const result = await runScheduleCommand(
      ["remove", "auth-service"],
      storeFile
    );
    expect(result).toContain("removed");
    const listResult = await runScheduleCommand(["list"], storeFile);
    expect(listResult).toBe("No schedules configured.");
  });

  it("returns unknown subcommand message", async () => {
    const result = await runScheduleCommand(["bogus"], storeFile);
    expect(result).toContain("Unknown subcommand");
  });
});
