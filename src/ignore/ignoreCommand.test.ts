import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { runIgnoreCommand } from "./ignoreCommand";

function makeTempFile(): string {
  return path.join(os.tmpdir(), `ignore-cmd-test-${Date.now()}.json`);
}

describe("runIgnoreCommand", () => {
  let storeFile: string;

  beforeEach(() => {
    storeFile = makeTempFile();
  });

  afterEach(() => {
    if (fs.existsSync(storeFile)) fs.unlinkSync(storeFile);
  });

  it("adds an ignore rule", async () => {
    const result = await runIgnoreCommand("add", "api", "metadata.version", { storeFile });
    expect(result).toContain("added");
    expect(result).toContain("metadata.version");
  });

  it("lists ignore rules after adding", async () => {
    await runIgnoreCommand("add", "api", "metadata.version", { storeFile });
    await runIgnoreCommand("add", "api", "spec.replicas", { storeFile });
    const result = await runIgnoreCommand("list", "api", undefined, { storeFile });
    expect(result).toContain("metadata.version");
    expect(result).toContain("spec.replicas");
  });

  it("returns message when no rules found on list", async () => {
    const result = await runIgnoreCommand("list", "unknown-svc", undefined, { storeFile });
    expect(result).toContain("No ignore rules");
  });

  it("removes a specific ignore rule", async () => {
    await runIgnoreCommand("add", "api", "metadata.version", { storeFile });
    const result = await runIgnoreCommand("remove", "api", "metadata.version", { storeFile });
    expect(result).toContain("removed");
    const listResult = await runIgnoreCommand("list", "api", undefined, { storeFile });
    expect(listResult).toContain("No ignore rules");
  });

  it("returns error when removing non-existent rule", async () => {
    const result = await runIgnoreCommand("remove", "api", "nonexistent.key", { storeFile });
    expect(result).toContain("not found");
  });

  it("clears all rules for a service", async () => {
    await runIgnoreCommand("add", "api", "metadata.version", { storeFile });
    await runIgnoreCommand("add", "api", "spec.replicas", { storeFile });
    const result = await runIgnoreCommand("clear", "api", undefined, { storeFile });
    expect(result).toContain("cleared");
    const listResult = await runIgnoreCommand("list", "api", undefined, { storeFile });
    expect(listResult).toContain("No ignore rules");
  });

  it("returns error message for missing key on add", async () => {
    const result = await runIgnoreCommand("add", "api", undefined, { storeFile });
    expect(result).toContain("Error");
  });

  it("returns error for unknown subcommand", async () => {
    const result = await runIgnoreCommand("bogus", "api", undefined, { storeFile });
    expect(result).toContain("Unknown subcommand");
  });
});
