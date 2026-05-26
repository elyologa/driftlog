import fs from "fs";
import os from "os";
import path from "path";
import { runGroupCommand } from "./groupCommand";
import { loadGroupStore } from "./groupManager";

function makeTempFile(): string {
  return path.join(os.tmpdir(), `group-cmd-test-${Date.now()}.json`);
}

describe("runGroupCommand", () => {
  it("creates a group", () => {
    const tmp = makeTempFile();
    runGroupCommand(["create", "mygroup", "svc-a", "svc-b"], tmp);
    const store = loadGroupStore(tmp);
    expect(store.groups["mygroup"].services).toEqual(["svc-a", "svc-b"]);
    fs.unlinkSync(tmp);
  });

  it("removes a group", () => {
    const tmp = makeTempFile();
    runGroupCommand(["create", "toremove", "x"], tmp);
    runGroupCommand(["remove", "toremove"], tmp);
    const store = loadGroupStore(tmp);
    expect(store.groups["toremove"]).toBeUndefined();
    fs.unlinkSync(tmp);
  });

  it("adds a service to a group", () => {
    const tmp = makeTempFile();
    runGroupCommand(["create", "grp", "a"], tmp);
    runGroupCommand(["add-service", "grp", "b"], tmp);
    const store = loadGroupStore(tmp);
    expect(store.groups["grp"].services).toContain("b");
    fs.unlinkSync(tmp);
  });

  it("removes a service from a group", () => {
    const tmp = makeTempFile();
    runGroupCommand(["create", "grp", "a", "b"], tmp);
    runGroupCommand(["remove-service", "grp", "a"], tmp);
    const store = loadGroupStore(tmp);
    expect(store.groups["grp"].services).not.toContain("a");
    fs.unlinkSync(tmp);
  });

  it("lists groups", () => {
    const tmp = makeTempFile();
    runGroupCommand(["create", "g1", "svc1"], tmp);
    runGroupCommand(["create", "g2", "svc2"], tmp);
    const spy = jest.spyOn(console, "log").mockImplementation(() => {});
    runGroupCommand(["list"], tmp);
    expect(spy).toHaveBeenCalledTimes(2);
    spy.mockRestore();
    fs.unlinkSync(tmp);
  });

  it("shows a group as JSON", () => {
    const tmp = makeTempFile();
    runGroupCommand(["create", "shown", "svc-x"], tmp);
    const spy = jest.spyOn(console, "log").mockImplementation(() => {});
    runGroupCommand(["show", "shown"], tmp);
    const output = spy.mock.calls[0][0];
    const parsed = JSON.parse(output);
    expect(parsed.name).toBe("shown");
    spy.mockRestore();
    fs.unlinkSync(tmp);
  });

  it("exits with error for unknown subcommand", () => {
    const tmp = makeTempFile();
    const mockExit = jest.spyOn(process, "exit").mockImplementation(() => { throw new Error("exit"); });
    expect(() => runGroupCommand(["bogus"], tmp)).toThrow("exit");
    mockExit.mockRestore();
  });
});
