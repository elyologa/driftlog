import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { runArchiveCommand } from "./archiveCommand";

function makeTempFile(content = "{}"): string {
  const tmp = path.join(os.tmpdir(), `archive-cmd-${Date.now()}.json`);
  fs.writeFileSync(tmp, content, "utf-8");
  return tmp;
}

describe("runArchiveCommand", () => {
  let storePath: string;
  let configPath: string;

  beforeEach(() => {
    storePath = makeTempFile(JSON.stringify({ archived: {} }));
    configPath = makeTempFile(JSON.stringify({ image: "nginx:1.21", replicas: 2 }));
  });

  afterEach(() => {
    [storePath, configPath].forEach((f) => {
      if (fs.existsSync(f)) fs.unlinkSync(f);
    });
  });

  it("returns error when --service missing for add", async () => {
    const result = await runArchiveCommand("add", { config: configPath }, storePath);
    expect(result).toContain("Error: --service is required");
  });

  it("archives a service successfully", async () => {
    const result = await runArchiveCommand(
      "add",
      { service: "api", config: configPath, reason: "deprecated" },
      storePath
    );
    expect(result).toContain("api");
    expect(result.toLowerCase()).toContain("archived");
  });

  it("lists archived services", async () => {
    await runArchiveCommand("add", { service: "api", config: configPath }, storePath);
    const result = await runArchiveCommand("list", {}, storePath);
    expect(result).toContain("api");
  });

  it("returns message when no archived services", async () => {
    const result = await runArchiveCommand("list", {}, storePath);
    expect(result).toContain("No archived services");
  });

  it("gets a specific archived service", async () => {
    await runArchiveCommand("add", { service: "api", config: configPath }, storePath);
    const result = await runArchiveCommand("get", { service: "api" }, storePath);
    const parsed = JSON.parse(result);
    expect(parsed.name).toBe("api");
  });

  it("returns not found for missing service on get", async () => {
    const result = await runArchiveCommand("get", { service: "ghost" }, storePath);
    expect(result).toContain("No archived entry found");
  });

  it("removes an archived service", async () => {
    await runArchiveCommand("add", { service: "api", config: configPath }, storePath);
    const result = await runArchiveCommand("remove", { service: "api" }, storePath);
    expect(result.toLowerCase()).toMatch(/removed|unarchived/);
  });

  it("returns unknown action message", async () => {
    const result = await runArchiveCommand("explode", {}, storePath);
    expect(result).toContain("Unknown archive action");
  });
});
