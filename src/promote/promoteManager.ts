import * as fs from "fs";
import * as path from "path";
import { ServiceConfig } from "../parser/yamlParser";

export interface PromoteEntry {
  service: string;
  fromEnv: string;
  toEnv: string;
  config: Record<string, unknown>;
  promotedAt: string;
}

export interface PromoteStore {
  promotions: PromoteEntry[];
}

export function loadPromoteStore(storePath: string): PromoteStore {
  if (!fs.existsSync(storePath)) {
    return { promotions: [] };
  }
  const raw = fs.readFileSync(storePath, "utf-8");
  return JSON.parse(raw) as PromoteStore;
}

export function savePromoteStore(storePath: string, store: PromoteStore): void {
  fs.mkdirSync(path.dirname(storePath), { recursive: true });
  fs.writeFileSync(storePath, JSON.stringify(store, null, 2), "utf-8");
}

export function promoteService(
  store: PromoteStore,
  service: string,
  fromEnv: string,
  toEnv: string,
  config: Record<string, unknown>
): PromoteEntry {
  const entry: PromoteEntry = {
    service,
    fromEnv,
    toEnv,
    config,
    promotedAt: new Date().toISOString(),
  };
  store.promotions.push(entry);
  return entry;
}

export function getPromotionsForService(
  store: PromoteStore,
  service: string
): PromoteEntry[] {
  return store.promotions.filter((p) => p.service === service);
}

export function getLatestPromotion(
  store: PromoteStore,
  service: string,
  toEnv: string
): PromoteEntry | undefined {
  const matches = store.promotions.filter(
    (p) => p.service === service && p.toEnv === toEnv
  );
  return matches.length > 0 ? matches[matches.length - 1] : undefined;
}

export function formatPromoteResult(entry: PromoteEntry): string {
  return [
    `Promoted: ${entry.service}`,
    `  From: ${entry.fromEnv}`,
    `  To:   ${entry.toEnv}`,
    `  At:   ${entry.promotedAt}`,
    `  Keys: ${Object.keys(entry.config).join(", ") || "(none)"}`,
  ].join("\n");
}
