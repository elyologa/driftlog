import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { runTagCommand } from "./tagCommand";

function makeTempFile(): string {
  return path.join(os.tmpdir(), `tagstore-${Date.now()}-${Math.random()}.json`);
}

describe("runTagCommand", () => {
  let storeFile: string;
  let consoleSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    storeFile = makeTempFile();
    fs.writeFileSync(storeFile, JSON.stringify({ tags: {} }, null, 2));
    consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    if (fs.existsSync(storeFile)) fs.unlinkSync(storeFile);
    consoleSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it("adds a tag to a service", async () => {
    await runTagCommand(["add", "api", "production"], storeFile);
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("production")
    );
    const raw = JSON.parse(fs.readFileSync(storeFile, "utf-8"));
    expect(raw.tags["api"]).toContain("production");
  });

  it("adds multiple tags to a service", async () => {
    await runTagCommand(["add", "api", "production", "critical"], storeFile);
    const raw = JSON.parse(fs.readFileSync(storeFile, "utf-8"));
    expect(raw.tags["api"]).toContain("production");
    expect(raw.tags["api"]).toContain("critical");
  });

  it("removes a tag from a service", async () => {
    await runTagCommand(["add", "api", "staging"], storeFile);
    await runTagCommand(["remove", "api", "staging"], storeFile);
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("Removed tag")
    );
    const raw = JSON.parse(fs.readFileSync(storeFile, "utf-8"));
    expect(raw.tags["api"] ?? []).not.toContain("staging");
  });

  it("lists tags for a service", async () => {
    await runTagCommand(["add", "worker", "batch"], storeFile);
    consoleSpy.mockClear();
    await runTagCommand(["list", "worker"], storeFile);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("batch"));
  });

  it("lists services for a tag", async () => {
    await runTagCommand(["add", "api", "production"], storeFile);
    await runTagCommand(["add", "worker", "production"], storeFile);
    consoleSpy.mockClear();
    await runTagCommand(["services", "production"], storeFile);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("api"));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("worker"));
  });

  it("prints message when no tags found for service", async () => {
    await runTagCommand(["list", "unknown-service"], storeFile);
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("No tags found")
    );
  });

  it("exits on unknown subcommand", async () => {
    const exitSpy = jest
      .spyOn(process, "exit")
      .mockImplementation(() => { throw new Error("exit"); });
    await expect(
      runTagCommand(["unknown"], storeFile)
    ).rejects.toThrow("exit");
    exitSpy.mockRestore();
  });
});
