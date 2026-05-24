import * as fs from "fs";
import {
  loadTemplateStore,
  saveTemplateStore,
  upsertTemplate,
  removeTemplate,
  getTemplate,
  listTemplates,
} from "./templateManager";
import { TemplateStore } from "./templateTypes";

export async function runTemplateCommand(
  args: string[],
  storeFile: string,
  outputFn: (msg: string) => void = console.log
): Promise<void> {
  const [subcommand, ...rest] = args;
  const store: TemplateStore = fs.existsSync(storeFile)
    ? loadTemplateStore(storeFile)
    : { templates: {} };

  switch (subcommand) {
    case "add": {
      const [name, ...kvPairs] = rest;
      if (!name || kvPairs.length === 0) {
        outputFn("Usage: template add <name> key=value ...");
        return;
      }
      const fields: Record<string, string> = {};
      for (const pair of kvPairs) {
        const idx = pair.indexOf("=");
        if (idx === -1) {
          outputFn(`Invalid key=value pair: ${pair}`);
          return;
        }
        fields[pair.slice(0, idx)] = pair.slice(idx + 1);
      }
      const updated = upsertTemplate(store, name, fields);
      saveTemplateStore(storeFile, updated);
      outputFn(`Template '${name}' saved with ${Object.keys(fields).length} field(s).`);
      break;
    }
    case "remove": {
      const [name] = rest;
      if (!name) {
        outputFn("Usage: template remove <name>");
        return;
      }
      const updated = removeTemplate(store, name);
      saveTemplateStore(storeFile, updated);
      outputFn(`Template '${name}' removed.`);
      break;
    }
    case "get": {
      const [name] = rest;
      if (!name) {
        outputFn("Usage: template get <name>");
        return;
      }
      const tpl = getTemplate(store, name);
      if (!tpl) {
        outputFn(`Template '${name}' not found.`);
        return;
      }
      outputFn(`Template: ${name}`);
      for (const [k, v] of Object.entries(tpl.fields)) {
        outputFn(`  ${k}: ${v}`);
      }
      outputFn(`  created: ${tpl.createdAt}`);
      outputFn(`  updated: ${tpl.updatedAt}`);
      break;
    }
    case "list": {
      const templates = listTemplates(store);
      if (templates.length === 0) {
        outputFn("No templates defined.");
        return;
      }
      outputFn(`Templates (${templates.length}):`);
      for (const tpl of templates) {
        const fieldCount = Object.keys(tpl.fields).length;
        outputFn(`  ${tpl.name} — ${fieldCount} field(s), updated: ${tpl.updatedAt}`);
      }
      break;
    }
    default:
      outputFn("Unknown subcommand. Use: add | remove | get | list");
  }
}
