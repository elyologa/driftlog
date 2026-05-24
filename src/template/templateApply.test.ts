import { applyTemplate, formatApplyResult } from "./templateApply";
import { Template } from "./templateTypes";

function makeTemplate(fields: Record<string, string>): Template {
  return {
    name: "base",
    fields,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

describe("applyTemplate", () => {
  it("returns template fields when no overrides given", () => {
    const tpl = makeTemplate({ replicas: "3", port: "8080" });
    const result = applyTemplate(tpl, "svc-a");
    expect(result.merged).toEqual({ replicas: "3", port: "8080" });
    expect(result.serviceName).toBe("svc-a");
    expect(Object.keys(result.overrides)).toHaveLength(0);
  });

  it("overrides take precedence over template fields", () => {
    const tpl = makeTemplate({ replicas: "3", port: "8080" });
    const result = applyTemplate(tpl, "svc-b", { replicas: "5" });
    expect(result.merged.replicas).toBe("5");
    expect(result.merged.port).toBe("8080");
  });

  it("adds new keys from overrides not in template", () => {
    const tpl = makeTemplate({ port: "8080" });
    const result = applyTemplate(tpl, "svc-c", { env: "production" });
    expect(result.merged.env).toBe("production");
    expect(result.merged.port).toBe("8080");
  });

  it("does not mutate template fields", () => {
    const tpl = makeTemplate({ replicas: "2" });
    applyTemplate(tpl, "svc-d", { replicas: "10" });
    expect(tpl.fields.replicas).toBe("2");
  });
});

describe("formatApplyResult", () => {
  it("includes service name in output", () => {
    const tpl = makeTemplate({ port: "9000" });
    const result = applyTemplate(tpl, "my-service");
    const formatted = formatApplyResult(result);
    expect(formatted).toContain("my-service");
  });

  it("marks overridden fields correctly", () => {
    const tpl = makeTemplate({ port: "8080", replicas: "3" });
    const result = applyTemplate(tpl, "svc", { port: "9090" });
    const formatted = formatApplyResult(result);
    expect(formatted).toContain("(override)");
    expect(formatted).toContain("(template)");
  });

  it("shows merged field count summary", () => {
    const tpl = makeTemplate({ a: "1", b: "2" });
    const result = applyTemplate(tpl, "svc", { c: "3" });
    const formatted = formatApplyResult(result);
    expect(formatted).toContain("Template fields applied: 2");
    expect(formatted).toContain("Overrides: 1");
  });
});
