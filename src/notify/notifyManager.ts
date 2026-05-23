import * as fs from "fs";
import { DriftResult } from "../drift/types";

export interface NotifyConfig {
  webhook?: string;
  onDriftOnly?: boolean;
}

export interface NotifyStore {
  config: NotifyConfig;
}

const DEFAULT_STORE: NotifyStore = {
  config: {
    onDriftOnly: true,
  },
};

export function loadNotifyStore(storePath: string): NotifyStore {
  if (!fs.existsSync(storePath)) {
    return { ...DEFAULT_STORE };
  }
  const raw = fs.readFileSync(storePath, "utf-8");
  return JSON.parse(raw) as NotifyStore;
}

export function saveNotifyStore(storePath: string, store: NotifyStore): void {
  fs.writeFileSync(storePath, JSON.stringify(store, null, 2), "utf-8");
}

export function setNotifyConfig(
  storePath: string,
  config: Partial<NotifyConfig>
): NotifyStore {
  const store = loadNotifyStore(storePath);
  store.config = { ...store.config, ...config };
  saveNotifyStore(storePath, store);
  return store;
}

export function buildWebhookPayload(
  results: DriftResult[]
): Record<string, unknown> {
  const drifted = results.filter((r) => r.drifted);
  return {
    timestamp: new Date().toISOString(),
    totalServices: results.length,
    driftedServices: drifted.length,
    services: drifted.map((r) => ({
      service: r.service,
      driftCount: r.differences.length,
      differences: r.differences,
    })),
  };
}

export async function sendWebhookNotification(
  webhookUrl: string,
  payload: Record<string, unknown>
): Promise<void> {
  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(
      `Webhook notification failed: ${response.status} ${response.statusText}`
    );
  }
}

export async function notifyIfDrift(
  storePath: string,
  results: DriftResult[]
): Promise<boolean> {
  const store = loadNotifyStore(storePath);
  const { webhook, onDriftOnly } = store.config;
  if (!webhook) return false;

  const hasDrift = results.some((r) => r.drifted);
  if (onDriftOnly && !hasDrift) return false;

  const payload = buildWebhookPayload(results);
  await sendWebhookNotification(webhook, payload);
  return true;
}
