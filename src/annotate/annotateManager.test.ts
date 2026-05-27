import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import {
  loadAnnotateStore,
  saveAnnotateStore,
  setAnnotation,
  removeAnnotation,
  getAnnotationsForService,
  formatAnnotations,
} from "./annotateManager";

function makeTempFile(): string {
  return path.join(os.tmpdir(), `annotate-test-${Date.now()}.json`);
}

describe("annotateManager", () => {
  it("loadAnnotateStore returns empty store when file missing", () => {
    const store = loadAnnotateStore("/nonexistent/path.json");
    expect(store.annotations).toEqual([]);
  });

  it("saveAnnotateStore and loadAnnotateStore round-trip", () => {
    const tmp = makeTempFile();
    try {
      const store = { annotations: [] };
      setAnnotation(store, "svc-a", "owner", "team-x");
      saveAnnotateStore(tmp, store);
      const loaded = loadAnnotateStore(tmp);
      expect(loaded.annotations).toHaveLength(1);
      expect(loaded.annotations[0].service).toBe("svc-a");
    } finally {
      if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
    }
  });

  it("setAnnotation creates a new annotation", () => {
    const store = { annotations: [] };
    const ann = setAnnotation(store, "svc-b", "env", "production");
    expect(ann.service).toBe("svc-b");
    expect(ann.key).toBe("env");
    expect(ann.value).toBe("production");
    expect(store.annotations).toHaveLength(1);
  });

  it("setAnnotation updates an existing annotation", () => {
    const store = { annotations: [] };
    setAnnotation(store, "svc-b", "env", "staging");
    const updated = setAnnotation(store, "svc-b", "env", "production");
    expect(updated.value).toBe("production");
    expect(store.annotations).toHaveLength(1);
  });

  it("removeAnnotation removes the correct entry", () => {
    const store = { annotations: [] };
    setAnnotation(store, "svc-c", "owner", "alice");
    setAnnotation(store, "svc-c", "tier", "gold");
    const removed = removeAnnotation(store, "svc-c", "owner");
    expect(removed).toBe(true);
    expect(store.annotations).toHaveLength(1);
    expect(store.annotations[0].key).toBe("tier");
  });

  it("removeAnnotation returns false when entry not found", () => {
    const store = { annotations: [] };
    const removed = removeAnnotation(store, "svc-x", "missing");
    expect(removed).toBe(false);
  });

  it("getAnnotationsForService returns only matching entries", () => {
    const store = { annotations: [] };
    setAnnotation(store, "svc-a", "owner", "alice");
    setAnnotation(store, "svc-b", "owner", "bob");
    const results = getAnnotationsForService(store, "svc-a");
    expect(results).toHaveLength(1);
    expect(results[0].service).toBe("svc-a");
  });

  it("formatAnnotations returns placeholder when empty", () => {
    expect(formatAnnotations([])).toBe("No annotations found.");
  });

  it("formatAnnotations formats entries correctly", () => {
    const store = { annotations: [] };
    setAnnotation(store, "svc-a", "owner", "alice");
    const anns = getAnnotationsForService(store, "svc-a");
    const output = formatAnnotations(anns);
    expect(output).toContain("[owner]");
    expect(output).toContain('"alice"');
  });
});
