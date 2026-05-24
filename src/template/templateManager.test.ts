import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import {
  loadTemplateStore,
  saveTemplateStore,
  upsertTemplate,
  removeTemplate,
  getTemplate,
  listTemplates,
  applyTemplate,
} from "./templateManager";
import { TemplateStore } from "./templateTypes";

function makeTempFile(): string {
  return path.join(os.tmpdir(), `template-test-${Date.now()}-${Math.random()}.json`);
}

describe("loadTemplateStore", () => {
  it("returns empty store when file does not exist", () => {
    const store = loadTemplateStore("/nonexistent/path.json");
    expect(store.templates).toEqual({});
  });

  it("loads existing store from file", () => {
    const tmp = makeTempFile();
    const data: TemplateStore = {
      templates: {
        base: {
          name: "base",
          defaults: { replicas: 1 },
          requiredKeys: ["image"],
          tags: [],
          createdAt: "2024-01-01T00:00:00.000Z",
          updatedAt: "2024-01-01T00:00:00.000Z",
        },
      },
    };
    fs.writeFileSync(tmp, JSON.stringify(data));
    const store = loadTemplateStore(tmp);
    expect(store.templates["base"].name).toBe("base");
    fs.unlinkSync(tmp);
  });
});

describe("upsertTemplate", () => {
  it("creates a new template", () => {
    const store = loadTemplateStore("/nonexistent/path.json");
    const tpl = upsertTemplate(store, "web", { replicas: 2, port: 80 }, ["image"], "Web service");
    expect(tpl.name).toBe("web");
    expect(tpl.defaults.replicas).toBe(2);
    expect(tpl.requiredKeys).toContain("image");
    expect(store.templates["web"]).toBeDefined();
  });

  it("preserves createdAt on update", () => {
    const store = loadTemplateStore("/nonexistent/path.json");
    const first = upsertTemplate(store, "svc", { replicas: 1 }, []);
    const second = upsertTemplate(store, "svc", { replicas: 3 }, []);
    expect(second.createdAt).toBe(first.createdAt);
    expect(second.defaults.replicas).toBe(3);
  });
});

describe("removeTemplate", () => {
  it("removes an existing template and returns true", () => {
    const store = loadTemplateStore("/nonexistent/path.json");
    upsertTemplate(store, "toRemove", {}, []);
    expect(removeTemplate(store, "toRemove")).toBe(true);
    expect(store.templates["toRemove"]).toBeUndefined();
  });

  it("returns false for non-existent template", () => {
    const store = loadTemplateStore("/nonexistent/path.json");
    expect(removeTemplate(store, "ghost")).toBe(false);
  });
});

describe("applyTemplate", () => {
  it("merges template defaults with service config", () => {
    const store = loadTemplateStore("/nonexistent/path.json");
    const tpl = upsertTemplate(store, "base", { replicas: 1, env: "prod" }, ["image"]);
    const result = applyTemplate(tpl, { image: "nginx:latest", port: 8080 }, "my-service");
    expect(result.merged.replicas).toBe(1);
    expect(result.merged.image).toBe("nginx:latest");
    expect(result.merged.port).toBe(8080);
    expect(result.appliedKeys).toContain("port");
    expect(result.skippedKeys).not.toContain("port");
  });

  it("marks keys skipped when they overlap with defaults", () => {
    const store = loadTemplateStore("/nonexistent/path.json");
    const tpl = upsertTemplate(store, "base", { replicas: 1 }, []);
    const result = applyTemplate(tpl, { replicas: 5 }, "svc");
    expect(result.skippedKeys).toContain("replicas");
    expect(result.merged.replicas).toBe(5);
  });
});

describe("saveTemplateStore / listTemplates", () => {
  it("persists and reloads templates", () => {
    const tmp = makeTempFile();
    const store = loadTemplateStore("/nonexistent/path.json");
    upsertTemplate(store, "alpha", { timeout: 30 }, ["host"]);
    upsertTemplate(store, "beta", { timeout: 60 }, ["host", "port"]);
    saveTemplateStore(tmp, store);
    const reloaded = loadTemplateStore(tmp);
    expect(listTemplates(reloaded)).toHaveLength(2);
    expect(getTemplate(reloaded, "alpha")?.defaults.timeout).toBe(30);
    fs.unlinkSync(tmp);
  });
});
