import * as fs from "fs";
import {
  loadIgnoreStore,
  saveIgnoreStore,
  addIgnoreRule,
  getIgnoredKeys,
} from "./ignoreManager";

export interface IgnoreCommandOptions {
  storeFile: string;
}

export async function runIgnoreCommand(
  subcommand: string,
  serviceName: string,
  keyPattern: string | undefined,
  options: IgnoreCommandOptions
): Promise<string> {
  const store = loadIgnoreStore(options.storeFile);

  switch (subcommand) {
    case "add": {
      if (!keyPattern) {
        return "Error: key pattern is required for 'add' subcommand.";
      }
      const updated = addIgnoreRule(store, serviceName, keyPattern);
      saveIgnoreStore(options.storeFile, updated);
      return `Ignore rule '${keyPattern}' added for service '${serviceName}'.`;
    }

    case "list": {
      const keys = getIgnoredKeys(store, serviceName);
      if (keys.length === 0) {
        return `No ignore rules found for service '${serviceName}'.`;
      }
      const lines = keys.map((k) => `  - ${k}`).join("\n");
      return `Ignore rules for '${serviceName}':\n${lines}`;
    }

    case "remove": {
      if (!keyPattern) {
        return "Error: key pattern is required for 'remove' subcommand.";
      }
      const entry = store[serviceName];
      if (!entry || !entry.ignoredKeys.includes(keyPattern)) {
        return `Rule '${keyPattern}' not found for service '${serviceName}'.`;
      }
      entry.ignoredKeys = entry.ignoredKeys.filter((k) => k !== keyPattern);
      saveIgnoreStore(options.storeFile, store);
      return `Ignore rule '${keyPattern}' removed from service '${serviceName}'.`;
    }

    case "clear": {
      if (store[serviceName]) {
        delete store[serviceName];
        saveIgnoreStore(options.storeFile, store);
      }
      return `All ignore rules cleared for service '${serviceName}'.`;
    }

    default:
      return `Unknown subcommand '${subcommand}'. Use: add, list, remove, clear.`;
  }
}
