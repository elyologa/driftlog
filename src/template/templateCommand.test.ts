import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { runTemplateCommand } from "./templateCommand";

function makeTempFile(): string {
  return path.join(os.tmpdir(), `driftlog-template-cmd-${Date.now()}.json`);
}

describe("runTemplateCommand", () => {
  let storeFile: string;
  let output: string[];

  beforeEach(() => {
    storeFile = makeTempFile();
    output = [];
  });

  afterEach(() => {
    if (fs.existsSync(storeFile)) fs.unlinkSync(storeFile);
  });

  it("adds a template with key=value pairs", async () => {
    await runTemplateCommand(["add", "base", "replicas=3", "port=8080"], storeFile, (m) => output.push(m));
    expect(output[0]).toContain("base");
    expect(output[0]).toContain("2 field(s)");
  });

  it("lists templates after adding", async () => {
    await runTemplateCommand(["add", "base", "replicas=3"], storeFile, () => {});
    await runTemplateCommand(["list"], storeFile, (m) => output.push(m));
    expect(output.some((l) => l.includes("base"))).toBe(true);
  });

  it("gets a specific template", async () => {
    await runTemplateCommand(["add", "svc", "port=9000"], storeFile, () => {});
    await runTemplateCommand(["get", "svc"], storeFile, (m) => output.push(m));
    expect(output.some((l) => l.includes("port"))).toBe(true);
    expect(output.some((l) => l.includes("9000"))).toBe(true);
  });

  it("removes a template", async () => {
    await runTemplateCommand(["add", "tmp", "x=1"], storeFile, () => {});
    await runTemplateCommand(["remove", "tmp"], storeFile, (m) => output.push(m));
    expect(output[0]).toContain("removed");
    output = [];
    await runTemplateCommand(["get", "tmp"], storeFile, (m) => output.push(m));
    expect(output[0]).toContain("not found");
  });

  it("prints usage for add without args", async () => {
    await runTemplateCommand(["add"], storeFile, (m) => output.push(m));
    expect(output[0]).toContain("Usage");
  });

  it("prints no templates message when list is empty", async () => {
    await runTemplateCommand(["list"], storeFile, (m) => output.push(m));
    expect(output[0]).toContain("No templates");
  });

  it("prints unknown subcommand message", async () => {
    await runTemplateCommand(["unknown"], storeFile, (m) => output.push(m));
    expect(output[0]).toContain("Unknown subcommand");
  });

  it("prints error for invalid key=value pair", async () => {
    await runTemplateCommand(["add", "bad", "noequalssign"], storeFile, (m) => output.push(m));
    expect(output[0]).toContain("Invalid");
  });
});
