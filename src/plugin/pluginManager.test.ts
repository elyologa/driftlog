import fs from "fs";
import os from "os";
import path from "path";
import {
  loadPluginStore,
  savePluginStore,
  registerPlugin,
  unregisterPlugin,
  setPluginEnabled,
  listPlugins,
} from "./pluginManager";
import { DriftPlugin, PluginStore } from "./pluginTypes";

function makeTempFile(): string {
  return path.join(os.tmpdir(), `plugins-${Date.now()}.json`);
}

const mockPlugin: DriftPlugin = {
  name: "test-plugin",
  version: "1.0.0",
  description: "A test plugin",
  hooks: {},
};

describe("pluginManager", () => {
  it("loads default store when file does not exist", () => {
    const store = loadPluginStore("/nonexistent/path.json");
    expect(store.plugins).toEqual([]);
  });

  it("saves and loads store", () => {
    const tmp = makeTempFile();
    const store: PluginStore = { plugins: [] };
    savePluginStore(tmp, store);
    const loaded = loadPluginStore(tmp);
    expect(loaded).toEqual(store);
    fs.unlinkSync(tmp);
  });

  it("registers a new plugin", () => {
    const store: PluginStore = { plugins: [] };
    const updated = registerPlugin(store, mockPlugin);
    expect(updated.plugins).toHaveLength(1);
    expect(updated.plugins[0].name).toBe("test-plugin");
    expect(updated.plugins[0].enabled).toBe(true);
  });

  it("overwrites existing plugin on re-register", () => {
    let store: PluginStore = { plugins: [] };
    store = registerPlugin(store, mockPlugin);
    store = registerPlugin(store, { ...mockPlugin, version: "2.0.0" });
    expect(store.plugins).toHaveLength(1);
    expect(store.plugins[0].version).toBe("2.0.0");
  });

  it("unregisters a plugin", () => {
    let store: PluginStore = { plugins: [] };
    store = registerPlugin(store, mockPlugin);
    store = unregisterPlugin(store, "test-plugin");
    expect(store.plugins).toHaveLength(0);
  });

  it("enables and disables a plugin", () => {
    let store: PluginStore = { plugins: [] };
    store = registerPlugin(store, mockPlugin);
    store = setPluginEnabled(store, "test-plugin", false);
    expect(store.plugins[0].enabled).toBe(false);
    store = setPluginEnabled(store, "test-plugin", true);
    expect(store.plugins[0].enabled).toBe(true);
  });

  it("lists plugins", () => {
    let store: PluginStore = { plugins: [] };
    store = registerPlugin(store, mockPlugin);
    const list = listPlugins(store);
    expect(list).toHaveLength(1);
    expect(list[0].name).toBe("test-plugin");
  });
});
