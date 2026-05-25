import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { runLockCommand } from "./lockCommand";
import { loadLockStore, saveLockStore, lockService } from "./lockManager";

function makeTempFile(): string {
  return path.join(os.tmpdir(), `lock-cmd-test-${Date.now()}.json`);
}

describe("runLockCommand", () => {
  let storePath: string;
  let output: string[];
  const log = (msg: string) => output.push(msg);

  beforeEach(() => {
    storePath = makeTempFile();
    output = [];
  });

  afterEach(() => {
    if (fs.existsSync(storePath)) fs.unlinkSync(storePath);
  });

  it("shows usage when no subcommand given", () => {
    runLockCommand([], storePath, log);
    expect(output[0]).toMatch(/Usage/);
  });

  it("locks a service", () => {
    runLockCommand(["add", "api-service", "deploying"], storePath, log);
    expect(output[0]).toContain('Locked service "api-service"');
    const store = loadLockStore(storePath);
    expect(store["api-service"]).toBeDefined();
    expect(store["api-service"].reason).toBe("deploying");
  });

  it("requires service name for add", () => {
    runLockCommand(["add"], storePath, log);
    expect(output[0]).toContain("Error");
  });

  it("unlocks a locked service", () => {
    runLockCommand(["add", "api-service", "maintenance"], storePath, log);
    output = [];
    runLockCommand(["remove", "api-service"], storePath, log);
    expect(output[0]).toContain('Unlocked service "api-service"');
    const store = loadLockStore(storePath);
    expect(store["api-service"]).toBeUndefined();
  });

  it("reports not locked when removing unlocked service", () => {
    runLockCommand(["remove", "ghost-service"], storePath, log);
    expect(output[0]).toContain("is not locked");
  });

  it("shows status of a locked service", () => {
    runLockCommand(["add", "api-service", "freeze"], storePath, log);
    output = [];
    runLockCommand(["status", "api-service"], storePath, log);
    expect(output[0]).toContain("is locked");
    expect(output.join("\n")).toContain("freeze");
  });

  it("shows status of an unlocked service", () => {
    runLockCommand(["status", "no-such-service"], storePath, log);
    expect(output[0]).toContain("is not locked");
  });

  it("lists all locked services", () => {
    runLockCommand(["add", "svc-a", "reason A"], storePath, log);
    runLockCommand(["add", "svc-b", "reason B"], storePath, log);
    output = [];
    runLockCommand(["list"], storePath, log);
    expect(output[0]).toContain("Locked services (2)");
    const joined = output.join("\n");
    expect(joined).toContain("svc-a");
    expect(joined).toContain("svc-b");
  });

  it("reports no locks when list is empty", () => {
    runLockCommand(["list"], storePath, log);
    expect(output[0]).toContain("No services");
  });

  it("handles unknown subcommand", () => {
    runLockCommand(["explode", "svc"], storePath, log);
    expect(output[0]).toContain("Unknown subcommand");
  });
});
