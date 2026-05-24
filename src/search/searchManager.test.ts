import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { searchHistory, formatSearchResults } from "./searchManager";
import { saveHistoryStore } from "../history/historyManager";
import { saveTagStore } from "../tag/tagManager";

function makeTempFile(): string {
  return path.join(os.tmpdir(), `driftlog-test-${Date.now()}-${Math.random()}.json`);
}

const sampleHistory = {
  "auth-service": [
    {
      timestamp: "2024-06-01T10:00:00.000Z",
      drifts: [
        { key: "replicas", expected: "3", actual: "2", severity: "high" },
        { key: "image.tag", expected: "v1.2", actual: "v1.1", severity: "medium" },
      ],
    },
    {
      timestamp: "2024-05-01T10:00:00.000Z",
      drifts: [{ key: "env.LOG_LEVEL", expected: "info", actual: "debug", severity: "low" }],
    },
  ],
  "payment-service": [
    {
      timestamp: "2024-06-02T08:00:00.000Z",
      drifts: [{ key: "replicas", expected: "2", actual: "1", severity: "high" }],
    },
  ],
};

const sampleTags = {
  "auth-service": ["critical", "backend"],
  "payment-service": ["critical"],
};

describe("searchHistory", () => {
  let histFile: string;
  let tagFile: string;

  beforeEach(() => {
    histFile = makeTempFile();
    tagFile = makeTempFile();
    saveHistoryStore(histFile, sampleHistory as any);
    saveTagStore(tagFile, sampleTags);
  });

  afterEach(() => {
    fs.unlinkSync(histFile);
    fs.unlinkSync(tagFile);
  });

  it("returns all results when query is empty", () => {
    const results = searchHistory({}, histFile, tagFile);
    expect(results.length).toBe(3);
  });

  it("filters by service name substring", () => {
    const results = searchHistory({ service: "auth" }, histFile, tagFile);
    expect(results.every((r) => r.service === "auth-service")).toBe(true);
    expect(results.length).toBe(2);
  });

  it("filters by tag", () => {
    const results = searchHistory({ tag: "critical" }, histFile, tagFile);
    expect(results.length).toBe(3);
  });

  it("filters by severity", () => {
    const results = searchHistory({ severity: "high" }, histFile, tagFile);
    expect(results.every((r) => r.drifts.every((d) => d.severity === "high"))).toBe(true);
  });

  it("filters by key substring", () => {
    const results = searchHistory({ key: "replicas" }, histFile, tagFile);
    expect(results.every((r) => r.drifts.every((d) => d.key.includes("replicas")))).toBe(true);
  });

  it("filters by since date", () => {
    const results = searchHistory({ since: "2024-06-01T00:00:00.000Z" }, histFile, tagFile);
    expect(results.every((r) => new Date(r.timestamp) >= new Date("2024-06-01T00:00:00.000Z"))).toBe(true);
  });

  it("returns sorted results newest first", () => {
    const results = searchHistory({}, histFile, tagFile);
    for (let i = 1; i < results.length; i++) {
      expect(new Date(results[i - 1].timestamp).getTime()).toBeGreaterThanOrEqual(
        new Date(results[i].timestamp).getTime()
      );
    }
  });
});

describe("formatSearchResults", () => {
  it("returns no-match message for empty results", () => {
    expect(formatSearchResults([])).toBe("No matching drift history found.");
  });

  it("formats results with drift details", () => {
    const results = [
      {
        service: "auth-service",
        timestamp: "2024-06-01T10:00:00.000Z",
        drifts: [{ key: "replicas", expected: "3", actual: "2", severity: "high" as const }],
      },
    ];
    const output = formatSearchResults(results);
    expect(output).toContain("auth-service");
    expect(output).toContain("replicas");
    expect(output).toContain("high");
  });
});
