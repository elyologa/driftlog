import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { runLintCommand } from "./lintCommand";

function makeTempFile(content: string, ext = ".yaml"): string {
  const tmp = path.join(os.tmpdir(), `driftlog-lint-test-${Date.now()}${ext}`);
  fs.writeFileSync(tmp, content, "utf-8");
  return tmp;
}

describe("runLintCommand", () => {
  it("returns 1 if file does not exist", async () => {
    const lines: string[] = [];
    const code = await runLintCommand({ file: "/nonexistent/file.yaml" }, (m) => lines.push(m));
    expect(code).toBe(1);
    expect(lines[0]).toMatch(/File not found/);
  });

  it("returns 1 if YAML is invalid", async () => {
    const tmp = makeTempFile("key: [unclosed");
    const lines: string[] = [];
    const code = await runLintCommand({ file: tmp }, (m) => lines.push(m));
    fs.unlinkSync(tmp);
    expect(code).toBe(1);
    expect(lines[0]).toMatch(/Failed to parse YAML/);
  });

  it("returns 0 and prints text report for valid config", async () => {
    const tmp = makeTempFile(
      "name: my-service\nversion: '1.0.0'\nenvironment: production\nreplicas: 2\n"
    );
    const lines: string[] = [];
    const code = await runLintCommand({ file: tmp }, (m) => lines.push(m));
    fs.unlinkSync(tmp);
    expect(code).toBe(0);
    expect(lines.join("\n")).toMatch(/my-service|lint|ok/i);
  });

  it("outputs JSON when format is json", async () => {
    const tmp = makeTempFile(
      "name: svc\nversion: '2.0.0'\nenvironment: staging\nreplicas: 1\n"
    );
    const lines: string[] = [];
    const code = await runLintCommand({ file: tmp, format: "json" }, (m) => lines.push(m));
    fs.unlinkSync(tmp);
    expect(code).toBe(0);
    const parsed = JSON.parse(lines.join(""));
    expect(parsed).toHaveProperty("errors");
    expect(parsed).toHaveProperty("warnings");
  });

  it("returns 2 when errors are present", async () => {
    // Missing required fields should trigger errors
    const tmp = makeTempFile("foo: bar\n");
    const lines: string[] = [];
    const code = await runLintCommand({ file: tmp }, (m) => lines.push(m));
    fs.unlinkSync(tmp);
    expect(code).toBe(2);
  });
});
