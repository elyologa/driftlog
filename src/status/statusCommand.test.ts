import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { runStatusCommand } from "./statusCommand";

function makeTempFile(content: object): string {
  const file = path.join(os.tmpdir(), `driftlog-status-test-${Date.now()}.json`);
  fs.writeFileSync(file, JSON.stringify(content));
  return file;
}

const now = new Date().toISOString();
const old = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

const sampleStore = {
  snapshots: [
    {
      service: "api",
      capturedAt: now,
      config: { image: "nginx:1.21", replicas: 2 },
    },
    {
      service: "worker",
      capturedAt: old,
      config: { image: "worker:0.9", replicas: 1 },
    },
  ],
};

describe("runStatusCommand", () => {
  it("returns status text for all services", async () => {
    const file = makeTempFile(sampleStore);
    const result = await runStatusCommand({ snapshotFile: file });
    expect(result).toContain("api");
    expect(result).toContain("worker");
    fs.unlinkSync(file);
  });

  it("filters by service name", async () => {
    const file = makeTempFile(sampleStore);
    const result = await runStatusCommand({ snapshotFile: file, service: "api" });
    expect(result).toContain("api");
    expect(result).not.toContain("worker");
    fs.unlinkSync(file);
  });

  it("returns JSON when json option is true", async () => {
    const file = makeTempFile(sampleStore);
    const result = await runStatusCommand({ snapshotFile: file, json: true });
    const parsed = JSON.parse(result);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed.length).toBe(2);
    fs.unlinkSync(file);
  });

  it("marks stale snapshots correctly", async () => {
    const file = makeTempFile(sampleStore);
    const result = await runStatusCommand({
      snapshotFile: file,
      staleThresholdHours: 24,
    });
    expect(result).toContain("STALE");
    fs.unlinkSync(file);
  });

  it("throws if snapshot file does not exist", async () => {
    await expect(
      runStatusCommand({ snapshotFile: "/nonexistent/path.json" })
    ).rejects.toThrow("Snapshot file not found");
  });

  it("returns message when no snapshots match service", async () => {
    const file = makeTempFile(sampleStore);
    const result = await runStatusCommand({ snapshotFile: file, service: "unknown" });
    expect(result).toContain("No snapshot found for service: unknown");
    fs.unlinkSync(file);
  });
});
