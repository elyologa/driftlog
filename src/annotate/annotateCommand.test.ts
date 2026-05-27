import fs from "fs";
import os from "os";
import path from "path";
import { runAnnotateCommand } from "./annotateCommand";

function makeTempFile(): string {
  return path.join(os.tmpdir(), `annotate-cmd-${Date.now()}-${Math.random().toString(36).slice(2)}.json`);
}

describe("runAnnotateCommand", () => {
  let storePath: string;

  beforeEach(() => {
    storePath = makeTempFile();
  });

  afterEach(() => {
    if (fs.existsSync(storePath)) fs.unlinkSync(storePath);
  });

  it("sets an annotation for a service", () => {
    const result = runAnnotateCommand(["set", "api", "owner", "team-alpha"], storePath);
    expect(result).toContain("owner");
    expect(result).toContain("api");
  });

  it("gets annotations for a service", () => {
    runAnnotateCommand(["set", "api", "owner", "team-alpha"], storePath);
    runAnnotateCommand(["set", "api", "env", "production"], storePath);
    const result = runAnnotateCommand(["get", "api"], storePath);
    expect(result).toContain("owner: team-alpha");
    expect(result).toContain("env: production");
  });

  it("returns message when no annotations found for service", () => {
    const result = runAnnotateCommand(["get", "unknown-svc"], storePath);
    expect(result).toContain("No annotations found");
  });

  it("removes an annotation from a service", () => {
    runAnnotateCommand(["set", "api", "owner", "team-alpha"], storePath);
    const result = runAnnotateCommand(["remove", "api", "owner"], storePath);
    expect(result).toContain("removed");
    const after = runAnnotateCommand(["get", "api"], storePath);
    expect(after).not.toContain("owner");
  });

  it("lists all annotations across services", () => {
    runAnnotateCommand(["set", "api", "owner", "team-alpha"], storePath);
    runAnnotateCommand(["set", "worker", "tier", "backend"], storePath);
    const result = runAnnotateCommand(["list"], storePath);
    expect(result).toContain("api");
    expect(result).toContain("worker");
  });

  it("returns message when no annotations stored on list", () => {
    const result = runAnnotateCommand(["list"], storePath);
    expect(result).toContain("No annotations stored");
  });

  it("returns usage hint for missing set args", () => {
    const result = runAnnotateCommand(["set", "api"], storePath);
    expect(result).toContain("Usage");
  });

  it("returns error for unknown subcommand", () => {
    const result = runAnnotateCommand(["explode"], storePath);
    expect(result).toContain("Unknown subcommand");
  });
});
