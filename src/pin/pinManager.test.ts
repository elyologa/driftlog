import fs from "fs";
import os from "os";
import path from "path";
import {
  loadPinStore,
  savePinStore,
  addPin,
  removePin,
  getPinsForService,
  checkPins,
  formatPinResults,
} from "./pinManager";

function makeTempFile(): string {
  return path.join(os.tmpdir(), `pin-test-${Date.now()}.json`);
}

describe("pinManager", () => {
  it("loads empty store when file missing", () => {
    const store = loadPinStore("/nonexistent/path.json");
    expect(store.pins).toEqual([]);
  });

  it("saves and loads a store", () => {
    const tmp = makeTempFile();
    const store = { pins: [{ service: "svc", field: "port", expectedValue: 8080, pinnedAt: "2024-01-01T00:00:00.000Z" }] };
    savePinStore(tmp, store);
    const loaded = loadPinStore(tmp);
    expect(loaded.pins).toHaveLength(1);
    fs.unlinkSync(tmp);
  });

  it("adds a new pin", () => {
    const store = { pins: [] };
    const updated = addPin(store, "api", "replicas", 3, "must stay at 3");
    expect(updated.pins).toHaveLength(1);
    expect(updated.pins[0].field).toBe("replicas");
    expect(updated.pins[0].note).toBe("must stay at 3");
  });

  it("overwrites an existing pin for same service+field", () => {
    let store = { pins: [] };
    store = addPin(store, "api", "replicas", 3);
    store = addPin(store, "api", "replicas", 5);
    expect(store.pins).toHaveLength(1);
    expect(store.pins[0].expectedValue).toBe(5);
  });

  it("removes a pin", () => {
    let store = { pins: [] };
    store = addPin(store, "api", "replicas", 3);
    store = removePin(store, "api", "replicas");
    expect(store.pins).toHaveLength(0);
  });

  it("gets pins for a specific service", () => {
    let store = { pins: [] };
    store = addPin(store, "api", "replicas", 3);
    store = addPin(store, "worker", "replicas", 1);
    const pins = getPinsForService(store, "api");
    expect(pins).toHaveLength(1);
    expect(pins[0].service).toBe("api");
  });

  it("checks pins against live values", () => {
    let store = { pins: [] };
    store = addPin(store, "api", "replicas", 3);
    store = addPin(store, "api", "port", 8080);
    const results = checkPins(store, "api", { replicas: 3, port: 9000 });
    expect(results).toHaveLength(2);
    expect(results.find((r) => r.field === "replicas")?.violated).toBe(false);
    expect(results.find((r) => r.field === "port")?.violated).toBe(true);
  });

  it("formats pin results", () => {
    const results = [
      { service: "api", field: "replicas", expectedValue: 3, actualValue: 5, pinned: true, violated: true },
    ];
    const text = formatPinResults(results);
    expect(text).toContain("VIOLATED");
    expect(text).toContain("replicas");
  });

  it("returns message when no results", () => {
    expect(formatPinResults([])).toBe("No pins checked.");
  });
});
