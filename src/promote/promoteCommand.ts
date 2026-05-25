import * as fs from "fs";
import * as path from "path";
import {
  loadPromoteStore,
  savePromoteStore,
  promoteService,
  getPromotionsForService,
  getLatestPromotion,
} from "./promoteManager";

export function runPromoteCommand(
  args: string[],
  storeFile: string = "promote-store.json"
): string {
  const sub = args[0];

  if (sub === "promote") {
    const service = args[1];
    const fromEnv = args[2];
    const toEnv = args[3];
    if (!service || !fromEnv || !toEnv) {
      return "Usage: promote promote <service> <fromEnv> <toEnv> [note]";
    }
    const note = args[4];
    const store = loadPromoteStore(storeFile);
    const result = promoteService(store, { service, fromEnv, toEnv, note });
    if (result.success) {
      savePromoteStore(storeFile, store);
    }
    return result.message;
  }

  if (sub === "list") {
    const service = args[1];
    if (!service) {
      return "Usage: promote list <service>";
    }
    const store = loadPromoteStore(storeFile);
    const records = getPromotionsForService(store, service);
    if (records.length === 0) {
      return `No promotions found for service '${service}'.`;
    }
    return records
      .map(
        (r) =>
          `[${r.promotedAt}] ${r.service}: ${r.fromEnv} -> ${r.toEnv}${
            r.note ? ` (${r.note})` : ""
          }`
      )
      .join("\n");
  }

  if (sub === "latest") {
    const service = args[1];
    if (!service) {
      return "Usage: promote latest <service>";
    }
    const store = loadPromoteStore(storeFile);
    const record = getLatestPromotion(store, service);
    if (!record) {
      return `No promotions found for service '${service}'.`;
    }
    return `Latest promotion for '${service}': ${record.fromEnv} -> ${record.toEnv} at ${record.promotedAt}${
      record.note ? ` (${record.note})` : ""
    }`;
  }

  return `Unknown subcommand: ${sub}. Use promote, list, or latest.`;
}
