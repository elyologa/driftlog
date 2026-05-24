import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import {
  loadCloneStore,
  saveCloneStore,
  cloneService,
  getClonesForService,
  formatCloneResult,
  CloneStore,
} from "./cloneManager";
import { ServiceConfig } from "../parser/yamlParser";

function makeTempFile(): string {
  return path.join(os.tmpdir(), `clone-test-${Date.now()}-${Math.random().toString(36).slice(2)}.json`);
}

const sampleConfig: ServiceConfig = {
  name: "auth-service",
  version: "1.0.0",
  environment: "production",
  replicas: 2,
  image: "auth:latest",
  env: {},
};

describe("loadCloneStore", () => {
  it("returns empty store if file does not exist", () => {
    const store = loadCloneStore("/nonexistent/path/store.json");
    expect(store.clones).toEqual([]);
  });

  it("loads existing store from file", () => {
    const storePath = makeTempFile();
    const data: CloneStore = { clones: [{ originalService: "a", clonedService: "b", clonedAt: "2024-01-01T00:00:00.000Z", sourceFile: "/tmp/b.json" }] };
    fs.writeFileSync(storePath, JSON.stringify(data), "utf-8");
    const store = loadCloneStore(storePath);
    expect(store.clones).toHaveLength(1);
    expect(store.clones[0].clonedService).toBe("b");
    fs.unlinkSync(storePath);
  });
});

describe("cloneService", () => {
  it("writes cloned config to output file and appends to store", () => {
    const storePath = makeTempFile();
    const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), "clone-out-"));
    const { outputFile, entry } = cloneService(sampleConfig, "auth-service-clone", outputDir, storePath);

    expect(fs.existsSync(outputFile)).toBe(true);
    const written = JSON.parse(fs.readFileSync(outputFile, "utf-8"));
    expect(written.name).toBe("auth-service-clone");
    expect(entry.originalService).toBe("auth-service");
    expect(entry.clonedService).toBe("auth-service-clone");

    const store = loadCloneStore(storePath);
    expect(store.clones).toHaveLength(1);

    fs.unlinkSync(storePath);
    fs.rmSync(outputDir, { recursive: true });
  });
});

describe("getClonesForService", () => {
  it("returns clones matching original or cloned service name", () => {
    const storePath = makeTempFile();
    const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), "clone-get-"));
    cloneService(sampleConfig, "auth-clone-1", outputDir, storePath);
    cloneService(sampleConfig, "auth-clone-2", outputDir, storePath);

    const results = getClonesForService(storePath, "auth-service");
    expect(results).toHaveLength(2);

    fs.unlinkSync(storePath);
    fs.rmSync(outputDir, { recursive: true });
  });

  it("returns empty array for unknown service", () => {
    const storePath = makeTempFile();
    const results = getClonesForService(storePath, "unknown");
    expect(results).toEqual([]);
  });
});

describe("formatCloneResult", () => {
  it("formats clone result as readable string", () => {
    const entry = { originalService: "svc-a", clonedService: "svc-b", clonedAt: "2024-06-01T12:00:00.000Z", sourceFile: "/tmp/svc-b.json" };
    const result = formatCloneResult(entry, "/tmp/svc-b.json");
    expect(result).toContain("svc-a");
    expect(result).toContain("svc-b");
    expect(result).toContain("/tmp/svc-b.json");
  });
});
