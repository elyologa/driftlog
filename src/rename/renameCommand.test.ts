import { describe, it, expect, vi, beforeEach } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import { runRenameCommand } from "./renameCommand";

function makeTempFile(): string {
  return path.join(os.tmpdir(), `rename-cmd-test-${Date.now()}.json`);
}

describe("runRenameCommand", () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("renames a service and persists to store", () => {
    const tmp = makeTempFile();
    runRenameCommand(["rename", "svc-a", "svc-b"], tmp);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("✔"));
    const store = JSON.parse(fs.readFileSync(tmp, "utf-8"));
    expect(store.renames).toHaveLength(1);
    expect(store.renames[0].newName).toBe("svc-b");
    fs.unlinkSync(tmp);
  });

  it("prints error when rename args are missing", () => {
    const tmp = makeTempFile();
    const exitSpy = vi.spyOn(process, "exit").mockImplementation((() => {}) as never);
    runRenameCommand(["rename"], tmp);
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("Usage"));
    exitSpy.mockRestore();
  });

  it("resolves current name after rename chain", () => {
    const tmp = makeTempFile();
    runRenameCommand(["rename", "svc-a", "svc-b"], tmp);
    runRenameCommand(["rename", "svc-b", "svc-c"], tmp);
    runRenameCommand(["resolve", "svc-a"], tmp);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("svc-c"));
    fs.unlinkSync(tmp);
  });

  it("shows history for a service name", () => {
    const tmp = makeTempFile();
    runRenameCommand(["rename", "svc-a", "svc-b"], tmp);
    runRenameCommand(["history", "svc-a"], tmp);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("svc-a"));
    fs.unlinkSync(tmp);
  });

  it("reports no history when service has not been renamed", () => {
    const tmp = makeTempFile();
    runRenameCommand(["history", "unknown-svc"], tmp);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("No rename history"));
  });

  it("prints error on unknown subcommand", () => {
    const tmp = makeTempFile();
    const exitSpy = vi.spyOn(process, "exit").mockImplementation((() => {}) as never);
    runRenameCommand(["bogus"], tmp);
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("Unknown subcommand"));
    exitSpy.mockRestore();
  });
});
