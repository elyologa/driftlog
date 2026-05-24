import fs from "fs";
import os from "os";
import path from "path";
import { runAuditCommand } from "./auditCommand";
import { appendAuditEntry, loadAuditStore } from "./auditManager";

function makeTempFile(): string {
  return path.join(os.tmpdir(), `audit-cmd-test-${Date.now()}.json`);
}

describe("runAuditCommand", () => {
  let tmpFile: string;

  beforeEach(() => {
    tmpFile = makeTempFile();
  });

  afterEach(() => {
    if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
  });

  it("prints empty audit log message when no entries exist", () => {
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    runAuditCommand({ auditFile: tmpFile, action: "list" });
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("No audit entries"));
    consoleSpy.mockRestore();
  });

  it("lists audit entries for all services", () => {
    appendAuditEntry(tmpFile, { service: "api", action: "snapshot", timestamp: "2024-01-01T00:00:00.000Z", details: "created" });
    appendAuditEntry(tmpFile, { service: "worker", action: "drift", timestamp: "2024-01-02T00:00:00.000Z", details: "drift detected" });
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    runAuditCommand({ auditFile: tmpFile, action: "list" });
    const output = consoleSpy.mock.calls.map((c) => c[0]).join("\n");
    expect(output).toContain("api");
    expect(output).toContain("worker");
    consoleSpy.mockRestore();
  });

  it("filters audit entries by service", () => {
    appendAuditEntry(tmpFile, { service: "api", action: "snapshot", timestamp: "2024-01-01T00:00:00.000Z", details: "created" });
    appendAuditEntry(tmpFile, { service: "worker", action: "drift", timestamp: "2024-01-02T00:00:00.000Z", details: "drift detected" });
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    runAuditCommand({ auditFile: tmpFile, action: "list", service: "api" });
    const output = consoleSpy.mock.calls.map((c) => c[0]).join("\n");
    expect(output).toContain("api");
    expect(output).not.toContain("worker");
    consoleSpy.mockRestore();
  });

  it("clears the audit log", () => {
    appendAuditEntry(tmpFile, { service: "api", action: "snapshot", timestamp: "2024-01-01T00:00:00.000Z", details: "created" });
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    runAuditCommand({ auditFile: tmpFile, action: "clear" });
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("cleared"));
    const store = loadAuditStore(tmpFile);
    expect(store.entries).toHaveLength(0);
    consoleSpy.mockRestore();
  });

  it("prints unknown action warning for invalid actions", () => {
    const consoleSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    runAuditCommand({ auditFile: tmpFile, action: "invalid" as any });
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("Unknown"));
    consoleSpy.mockRestore();
  });
});
