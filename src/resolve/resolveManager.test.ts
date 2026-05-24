import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import {
  loadResolveStore,
  saveResolveStore,
  resolveServicePath,
  formatResolveResult,
} from "./resolveManager";
import { ResolveStore } from "./resolveTypes";

function makeTempFile(content: string): string {
  const file = path.join(os.tmpdir(), `resolve-test-${Date.now()}.json`);
  fs.writeFileSync(file, content, "utf-8");
  return file;
}

describe("loadResolveStore", () => {
  it("returns defaults when file does not exist", () => {
    const store = loadResolveStore("/nonexistent/path.json");
    expect(store.defaultDir).toBe("./configs");
    expect(store.profileDirs).toEqual({});
  });

  it("loads existing store from file", () => {
    const data: ResolveStore = { defaultDir: "./custom", profileDirs: { prod: "./prod-configs" } };
    const file = makeTempFile(JSON.stringify(data));
    const store = loadResolveStore(file);
    expect(store.defaultDir).toBe("./custom");
    expect(store.profileDirs["prod"]).toBe("./prod-configs");
    fs.unlinkSync(file);
  });
});

describe("saveResolveStore", () => {
  it("writes store to file", () => {
    const file = path.join(os.tmpdir(), `resolve-save-${Date.now()}.json`);
    const store: ResolveStore = { defaultDir: "./out", profileDirs: {} };
    saveResolveStore(file, store);
    const loaded = loadResolveStore(file);
    expect(loaded.defaultDir).toBe("./out");
    fs.unlinkSync(file);
  });
});

describe("resolveServicePath", () => {
  const store: ResolveStore = {
    defaultDir: "./configs",
    profileDirs: { staging: "./staging-configs" },
  };

  it("uses explicit configPath when provided", () => {
    const result = resolveServicePath("api", { configPath: "/custom/api.yaml" }, store);
    expect(result.resolvedPath).toBe("/custom/api.yaml");
    expect(result.source).toBe("explicit");
  });

  it("uses profile dir when profile is set", () => {
    const result = resolveServicePath("api", { profile: "staging" }, store);
    expect(result.resolvedPath).toContain("staging-configs");
    expect(result.source).toBe("profile");
  });

  it("falls back to default dir", () => {
    const result = resolveServicePath("api", {}, store);
    expect(result.resolvedPath).toContain("configs");
    expect(result.source).toBe("default");
    expect(result.exists).toBe(false);
  });
});

describe("formatResolveResult", () => {
  it("formats a found result", () => {
    const text = formatResolveResult({ service: "api", resolvedPath: "./configs/api.yaml", exists: true, source: "default" });
    expect(text).toContain("✔");
    expect(text).toContain("api");
    expect(text).toContain("default");
  });

  it("formats a missing result", () => {
    const text = formatResolveResult({ service: "db", resolvedPath: "./configs/db.yaml", exists: false, source: "profile" });
    expect(text).toContain("✘");
    expect(text).toContain("profile");
  });
});
