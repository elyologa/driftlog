import fs from "fs";
import os from "os";
import path from "path";
import { runPinCommand } from "./pinCommand";

function makeTempFile(): string {
  return path.join(os.tmpdir(), `pin-cmd-test-${Date.now()}.json`);
}

describe("runPinCommand", () => {
  it("prints usage when no subcommand", () => {
    const logs: string[] = [];
    runPinCommand([], makeTempFile(), (m) => logs.push(m));
    expect(logs[0]).toContain("Usage");
  });

  it("adds a pin and persists it", () => {
    const tmp = makeTempFile();
    const logs: string[] = [];
    runPinCommand(["add", "api", "replicas", "3"], tmp, (m) => logs.push(m));
    expect(logs[0]).toContain("Pinned api.replicas");
    const raw = JSON.parse(fs.readFileSync(tmp, "utf-8"));
    expect(raw.pins).toHaveLength(1);
    expect(raw.pins[0].expectedValue).toBe(3);
    fs.unlinkSync(tmp);
  });

  it("adds a pin with a note", () => {
    const tmp = makeTempFile();
    const logs: string[] = [];
    runPinCommand(["add", "api", "replicas", "3", "--note", "critical scaling"], tmp, (m) => logs.push(m));
    const raw = JSON.parse(fs.readFileSync(tmp, "utf-8"));
    expect(raw.pins[0].note).toBe("critical scaling");
    fs.unlinkSync(tmp);
  });

  it("removes a pin", () => {
    const tmp = makeTempFile();
    runPinCommand(["add", "api", "replicas", "3"], tmp, () => {});
    const logs: string[] = [];
    runPinCommand(["remove", "api", "replicas"], tmp, (m) => logs.push(m));
    expect(logs[0]).toContain("Removed");
    const raw = JSON.parse(fs.readFileSync(tmp, "utf-8"));
    expect(raw.pins).toHaveLength(0);
    fs.unlinkSync(tmp);
  });

  it("lists pins for a service", () => {
    const tmp = makeTempFile();
    runPinCommand(["add", "api", "replicas", "3"], tmp, () => {});
    const logs: string[] = [];
    runPinCommand(["list", "api"], tmp, (m) => logs.push(m));
    expect(logs.some((l) => l.includes("replicas"))).toBe(true);
    fs.unlinkSync(tmp);
  });

  it("reports no pins when list is empty", () => {
    const tmp = makeTempFile();
    const logs: string[] = [];
    runPinCommand(["list", "api"], tmp, (m) => logs.push(m));
    expect(logs[0]).toContain("No pins");
  });

  it("checks pins against live values", () => {
    const tmp = makeTempFile();
    runPinCommand(["add", "api", "replicas", "3"], tmp, () => {});
    const logs: string[] = [];
    runPinCommand(["check", "api", JSON.stringify({ replicas: 5 })], tmp, (m) => logs.push(m));
    expect(logs[0]).toContain("VIOLATED");
    fs.unlinkSync(tmp);
  });

  it("handles invalid JSON in check", () => {
    const tmp = makeTempFile();
    const logs: string[] = [];
    runPinCommand(["check", "api", "not-json"], tmp, (m) => logs.push(m));
    expect(logs[0]).toContain("Error");
  });

  it("reports unknown subcommand", () => {
    const logs: string[] = [];
    runPinCommand(["bogus"], makeTempFile(), (m) => logs.push(m));
    expect(logs[0]).toContain("Unknown");
  });
});
