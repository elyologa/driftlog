import path from "path";
import { loadPluginStore, savePluginStore, registerPlugin, unregisterPlugin, setPluginEnabled, listPlugins } from "./pluginManager";
import { DriftPlugin } from "./pluginTypes";

const DEFAULT_STORE_PATH = path.resolve(process.cwd(), ".driftlog", "plugins.json");

export function runPluginCommand(
  args: string[],
  storePath: string = DEFAULT_STORE_PATH
): void {
  const [subcommand, ...rest] = args;
  const store = loadPluginStore(storePath);

  switch (subcommand) {
    case "register": {
      const [name, version, description] = rest;
      if (!name || !version) {
        console.error("Usage: plugin register <name> <version> [description]");
        process.exit(1);
      }
      const plugin: DriftPlugin = { name, version, description, hooks: {} };
      const updated = registerPlugin(store, plugin);
      savePluginStore(storePath, updated);
      console.log(`Plugin '${name}@${version}' registered.`);
      break;
    }
    case "unregister": {
      const [name] = rest;
      if (!name) { console.error("Usage: plugin unregister <name>"); process.exit(1); }
      const updated = unregisterPlugin(store, name);
      savePluginStore(storePath, updated);
      console.log(`Plugin '${name}' unregistered.`);
      break;
    }
    case "enable":
    case "disable": {
      const [name] = rest;
      if (!name) { console.error(`Usage: plugin ${subcommand} <name>`); process.exit(1); }
      const enabled = subcommand === "enable";
      const updated = setPluginEnabled(store, name, enabled);
      savePluginStore(storePath, updated);
      console.log(`Plugin '${name}' ${enabled ? "enabled" : "disabled"}.`);
      break;
    }
    case "list": {
      const plugins = listPlugins(store);
      if (plugins.length === 0) { console.log("No plugins registered."); break; }
      plugins.forEach((p) =>
        console.log(`  ${p.enabled ? "✓" : "✗"} ${p.name}@${p.version}${p.description ? " — " + p.description : ""}`)  
      );
      break;
    }
    default:
      console.error("Unknown subcommand. Use: register | unregister | enable | disable | list");
      process.exit(1);
  }
}
