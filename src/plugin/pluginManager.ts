import fs from "fs";
import { PluginStore, DriftPlugin, RegisteredPlugin } from "./pluginTypes";

const DEFAULT_STORE: PluginStore = { plugins: [] };

export function loadPluginStore(storePath: string): PluginStore {
  if (!fs.existsSync(storePath)) return { ...DEFAULT_STORE };
  const raw = fs.readFileSync(storePath, "utf-8");
  return JSON.parse(raw) as PluginStore;
}

export function savePluginStore(storePath: string, store: PluginStore): void {
  fs.writeFileSync(storePath, JSON.stringify(store, null, 2), "utf-8");
}

export function registerPlugin(
  store: PluginStore,
  plugin: DriftPlugin
): PluginStore {
  const existing = store.plugins.findIndex((p) => p.name === plugin.name);
  const entry: RegisteredPlugin = {
    name: plugin.name,
    version: plugin.version,
    description: plugin.description,
    enabled: true,
    registeredAt: new Date().toISOString(),
  };
  const plugins = [...store.plugins];
  if (existing >= 0) {
    plugins[existing] = entry;
  } else {
    plugins.push(entry);
  }
  return { ...store, plugins };
}

export function unregisterPlugin(
  store: PluginStore,
  name: string
): PluginStore {
  return { ...store, plugins: store.plugins.filter((p) => p.name !== name) };
}

export function setPluginEnabled(
  store: PluginStore,
  name: string,
  enabled: boolean
): PluginStore {
  return {
    ...store,
    plugins: store.plugins.map((p) =>
      p.name === name ? { ...p, enabled } : p
    ),
  };
}

export function listPlugins(store: PluginStore): RegisteredPlugin[] {
  return store.plugins;
}

export async function runHook<K extends keyof import("./pluginTypes").PluginHooks>(
  plugins: DriftPlugin[],
  hook: K,
  ...args: Parameters<NonNullable<import("./pluginTypes").PluginHooks[K]>>
): Promise<void> {
  for (const plugin of plugins) {
    const fn = plugin.hooks[hook] as ((...a: unknown[]) => Promise<void> | void) | undefined;
    if (fn) await fn(...(args as unknown[]));
  }
}
