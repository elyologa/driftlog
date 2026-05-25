import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { runPromoteCommand } from "./promoteCommand";

function makeTempFile(): string {
  return path.join(os.tmpdir(), `promote-test-${Date.now()}-${Math.random()}.json`);
}

describe("runPromoteCommand", () => {
  let tempFile: string;

  beforeEach(() => {
    tempFile = makeTempFile();
  });

  afterEach(() => {
    if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
  });

  it("returns usage when promote args are missing", () => {
    const result = runPromoteCommand(["promote"], tempFile);
    expect(result).toContain("Usage");
  });

  it("promotes a service and records it", () => {
    const result = runPromoteCommand(
      ["promote", "api", "staging", "production", "approved by QA"],
      tempFile
    );
    expect(result).toContain("api");
    expect(result).toContain("staging");
    expect(result).toContain("production");
  });

  it("lists promotions for a service", () => {
    runPromoteCommand(["promote", "api", "staging", "production"], tempFile);
    const result = runPromoteCommand(["list", "api"], tempFile);
    expect(result).toContain("api");
    expect(result).toContain("staging -> production");
  });

  it("returns message when no promotions exist for list", () => {
    const result = runPromoteCommand(["list", "unknown-service"], tempFile);
    expect(result).toContain("No promotions found");
  });

  it("returns usage when list service is missing", () => {
    const result = runPromoteCommand(["list"], tempFile);
    expect(result).toContain("Usage");
  });

  it("gets latest promotion for a service", () => {
    runPromoteCommand(["promote", "svc", "dev", "staging"], tempFile);
    runPromoteCommand(["promote", "svc", "staging", "production"], tempFile);
    const result = runPromoteCommand(["latest", "svc"], tempFile);
    expect(result).toContain("staging -> production");
  });

  it("returns message when no latest promotion exists", () => {
    const result = runPromoteCommand(["latest", "ghost"], tempFile);
    expect(result).toContain("No promotions found");
  });

  it("returns error for unknown subcommand", () => {
    const result = runPromoteCommand(["unknown"], tempFile);
    expect(result).toContain("Unknown subcommand");
  });
});
