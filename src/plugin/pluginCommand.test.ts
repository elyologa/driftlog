import fs from "fs";
import os from "os";
import path from "path";
import { runPluginCommand } from "./pluginCommand";
import { loadPluginStore } from "./pluginManager";

function makeTempFile(): string {
  return path.join(os.tmpdir(), `plugins-cmd-${Date.now()}.json`);
}

describe("runPluginCommand", () => {
  let tmp: string;
  beforeEach(() => { tmp = makeTempFile(); });
  afterEach(() => { if (fs.existsSync(tmp)) fs.unlinkSync(tmp); });

  it("registers a plugin", () => {
    runPluginCommand(["register", "my-plugin", "1.2.3", "desc"], tmp);
    const store = loadPluginStore(tmp);
    expect(store.plugins[0].name).toBe("my-plugin");
    expect(store.plugins[0].version).toBe("1.2.3");
  });

  it("unregisters a plugin", () => {
    runPluginCommand(["register", "my-plugin", "1.0.0"], tmp);
    runPluginCommand(["unregister", "my-plugin"], tmp);
    const store = loadPluginStore(tmp);
    expect(store.plugins).toHaveLength(0);
  });

  it("disables and enables a plugin", () => {
    runPluginCommand(["register", "my-plugin", "1.0.0"], tmp);
    runPluginCommand(["disable", "my-plugin"], tmp);
    expect(loadPluginStore(tmp).plugins[0].enabled).toBe(false);
    runPluginCommand(["enable", "my-plugin"], tmp);
    expect(loadPluginStore(tmp).plugins[0].enabled).toBe(true);
  });

  it("lists plugins without error", () => {
    runPluginCommand(["register", "alpha", "0.1.0"], tmp);
    expect(() => runPluginCommand(["list"], tmp)).not.toThrow();
  });

  it("exits on missing name for register", () => {
    const mockExit = jest.spyOn(process, "exit").mockImplementation(() => { throw new Error("exit"); });
    expect(() => runPluginCommand(["register"], tmp)).toThrow("exit");
    mockExit.mockRestore();
  });

  it("exits on unknown subcommand", () => {
    const mockExit = jest.spyOn(process, "exit").mockImplementation(() => { throw new Error("exit"); });
    expect(() => runPluginCommand(["unknown"], tmp)).toThrow("exit");
    mockExit.mockRestore();
  });
});
