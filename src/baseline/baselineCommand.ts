import * as fs from "fs";
import * as path from "path";
import { parseYamlFile } from "../parser/yamlParser";
import {
  captureBaseline,
  getBaseline,
  removeBaseline,
  loadBaselineStore,
} from "./baselineManager";
import { detectDrift } from "../drift/detector";
import { formatReport } from "../drift/reporter";

export async function runBaselineCommand(
  action: string,
  serviceName: string,
  options: {
    yamlPath?: string;
    baselinePath?: string;
    json?: boolean;
  }
): Promise<void> {
  const baselinePath = options.baselinePath ?? "baselines.json";

  if (action === "capture") {
    if (!options.yamlPath) {
      console.error("Error: --yaml is required for capture action");
      process.exit(1);
    }
    const config = parseYamlFile(options.yamlPath);
    const store = loadBaselineStore(baselinePath);
    const updated = captureBaseline(store, serviceName, config);
    const { saveBaselineStore } = await import("./baselineManager");
    saveBaselineStore(baselinePath, updated);
    console.log(`Baseline captured for service: ${serviceName}`);
    return;
  }

  if (action === "compare") {
    if (!options.yamlPath) {
      console.error("Error: --yaml is required for compare action");
      process.exit(1);
    }
    const store = loadBaselineStore(baselinePath);
    const baseline = getBaseline(store, serviceName);
    if (!baseline) {
      console.error(`No baseline found for service: ${serviceName}`);
      process.exit(1);
    }
    const current = parseYamlFile(options.yamlPath);
    const drifts = detectDrift(serviceName, baseline.config, current);
    if (options.json) {
      console.log(JSON.stringify(drifts, null, 2));
    } else {
      console.log(formatReport(serviceName, drifts));
    }
    return;
  }

  if (action === "remove") {
    const store = loadBaselineStore(baselinePath);
    const updated = removeBaseline(store, serviceName);
    const { saveBaselineStore } = await import("./baselineManager");
    saveBaselineStore(baselinePath, updated);
    console.log(`Baseline removed for service: ${serviceName}`);
    return;
  }

  if (action === "list") {
    const store = loadBaselineStore(baselinePath);
    const names = Object.keys(store.baselines);
    if (names.length === 0) {
      console.log("No baselines stored.");
    } else {
      names.forEach((n) => {
        const b = store.baselines[n];
        console.log(`  ${n}  (captured: ${b.capturedAt})`);
      });
    }
    return;
  }

  console.error(`Unknown action: ${action}`);
  process.exit(1);
}
