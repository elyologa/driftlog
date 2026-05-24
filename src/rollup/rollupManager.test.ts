import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { buildRollupSummary, formatRollupText } from "./rollupManager";
import { HistoryStore } from "../history/historyTypes";
import { SnapshotStore } from "../snapshot/types";

function makeTempFile(content: object): string {
  const tmp = path.join(os.tmpdir(), `driftlog-test-${Date.now()}-${Math.random()}.json`);
  fs.writeFileSync(tmp, JSON.stringify(content), "utf-8");
  return tmp;
}

const baseHistory: HistoryStore = {
  entries: [
    { id: "1", serviceName: "api", timestamp: "2024-01-01T00:00:00Z", driftCount: 2, drifts: [] },
    { id: "2", serviceName: "api", timestamp: "2024-01-02T00:00:00Z", driftCount: 0, drifts: [] },
    { id: "3", serviceName: "worker", timestamp: "2024-01-01T00:00:00Z", driftCount: 5, drifts: [] }
  ]
};

const baseSnapshots: SnapshotStore = {
  snapshots: {
    api: { serviceName: "api", capturedAt: "2024-01-02T00:00:00Z", config: { port: 8080 } },
    worker: { serviceName: "worker", capturedAt: "2024-01-01T00:00:00Z", config: { threads: 4 } }
  }
};

describe("buildRollupSummary", () => {
  it("includes all services in the summary", () => {
    const summary = buildRollupSummary(["api", "worker"], baseHistory, baseSnapshots);
    expect(summary.services).toHaveLength(2);
    expect(summary.services.map(s => s.serviceName)).toContain("api");
    expect(summary.services.map(s => s.serviceName)).toContain("worker");
  });

  it("calculates totalDriftEvents correctly", () => {
    const summary = buildRollupSummary(["api", "worker"], baseHistory, baseSnapshots);
    const api = summary.services.find(s => s.serviceName === "api");
    expect(api?.totalDriftEvents).toBe(2);
    const worker = summary.services.find(s => s.serviceName === "worker");
    expect(worker?.totalDriftEvents).toBe(1);
  });

  it("sets totalDriftCount as sum of driftCounts", () => {
    const summary = buildRollupSummary(["api", "worker"], baseHistory, baseSnapshots);
    const api = summary.services.find(s => s.serviceName === "api");
    expect(api?.totalDriftCount).toBe(2);
  });

  it("returns empty services list when serviceNames is empty", () => {
    const summary = buildRollupSummary([], baseHistory, baseSnapshots);
    expect(summary.services).toHaveLength(0);
  });
});

describe("formatRollupText", () => {
  it("returns a non-empty string", () => {
    const summary = buildRollupSummary(["api", "worker"], baseHistory, baseSnapshots);
    const text = formatRollupText(summary);
    expect(typeof text).toBe("string");
    expect(text.length).toBeGreaterThan(0);
  });

  it("includes service names in output", () => {
    const summary = buildRollupSummary(["api", "worker"], baseHistory, baseSnapshots);
    const text = formatRollupText(summary);
    expect(text).toContain("api");
    expect(text).toContain("worker");
  });
});
