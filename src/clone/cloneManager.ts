import * as fs from "fs";
import * as path from "path";
import { ServiceConfig } from "../parser/yamlParser";

export interface CloneEntry {
  originalService: string;
  clonedService: string;
  clonedAt: string;
  sourceFile: string;
}

export interface CloneStore {
  clones: CloneEntry[];
}

export function loadCloneStore(storePath: string): CloneStore {
  if (!fs.existsSync(storePath)) {
    return { clones: [] };
  }
  const raw = fs.readFileSync(storePath, "utf-8");
  return JSON.parse(raw) as CloneStore;
}

export function saveCloneStore(storePath: string, store: CloneStore): void {
  fs.mkdirSync(path.dirname(storePath), { recursive: true });
  fs.writeFileSync(storePath, JSON.stringify(store, null, 2), "utf-8");
}

export function cloneService(
  config: ServiceConfig,
  newName: string,
  outputDir: string,
  storePath: string
): { outputFile: string; entry: CloneEntry } {
  const clonedConfig: ServiceConfig = {
    ...config,
    name: newName,
  };

  fs.mkdirSync(outputDir, { recursive: true });
  const outputFile = path.join(outputDir, `${newName}.json`);
  fs.writeFileSync(outputFile, JSON.stringify(clonedConfig, null, 2), "utf-8");

  const entry: CloneEntry = {
    originalService: config.name,
    clonedService: newName,
    clonedAt: new Date().toISOString(),
    sourceFile: outputFile,
  };

  const store = loadCloneStore(storePath);
  store.clones.push(entry);
  saveCloneStore(storePath, store);

  return { outputFile, entry };
}

export function getClonesForService(storePath: string, serviceName: string): CloneEntry[] {
  const store = loadCloneStore(storePath);
  return store.clones.filter(
    (c) => c.originalService === serviceName || c.clonedService === serviceName
  );
}

export function formatCloneResult(entry: CloneEntry, outputFile: string): string {
  return [
    `Cloned service "${entry.originalService}" → "${entry.clonedService}"`,
    `Output: ${outputFile}`,
    `Timestamp: ${entry.clonedAt}`,
  ].join("\n");
}
