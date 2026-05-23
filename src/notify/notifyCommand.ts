import * as fs from "fs";
import { loadNotifyStore, saveNotifyStore, setNotifyConfig, buildWebhookPayload } from "./notifyManager";
import { detectDrift } from "../drift/detector";
import { parseYamlFile } from "../parser/yamlParser";

export async function runNotifyCommand(args: string[]): Promise<void> {
  const subcommand = args[0];

  if (subcommand === "set") {
    const serviceName = args[1];
    const webhookUrl = args[2];
    if (!serviceName || !webhookUrl) {
      console.error("Usage: notify set <serviceName> <webhookUrl> [--on-drift-only]");
      process.exit(1);
    }
    const onDriftOnly = args.includes("--on-drift-only");
    const storeFile = process.env.NOTIFY_STORE || "notify-store.json";
    const store = loadNotifyStore(storeFile);
    const updated = setNotifyConfig(store, serviceName, { webhookUrl, onDriftOnly });
    saveNotifyStore(storeFile, updated);
    console.log(`Notify config set for service "${serviceName}".`);
    return;
  }

  if (subcommand === "send") {
    const serviceName = args[1];
    const yamlFile = args[2];
    const liveJsonFile = args[3];
    if (!serviceName || !yamlFile || !liveJsonFile) {
      console.error("Usage: notify send <serviceName> <yamlFile> <liveJsonFile>");
      process.exit(1);
    }
    const storeFile = process.env.NOTIFY_STORE || "notify-store.json";
    const store = loadNotifyStore(storeFile);
    const config = store[serviceName];
    if (!config) {
      console.error(`No notify config found for service "${serviceName}".`);
      process.exit(1);
    }

    const expected = parseYamlFile(yamlFile);
    const live = JSON.parse(fs.readFileSync(liveJsonFile, "utf-8"));
    const driftResults = detectDrift(expected, live);

    if (config.onDriftOnly && driftResults.length === 0) {
      console.log("No drift detected. Skipping notification.");
      return;
    }

    const payload = buildWebhookPayload(serviceName, driftResults);
    const response = await fetch(config.webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error(`Webhook request failed with status ${response.status}.`);
      process.exit(1);
    }
    console.log(`Notification sent for service "${serviceName}".`);
    return;
  }

  console.error("Unknown notify subcommand. Use: set | send");
  process.exit(1);
}
