import * as fs from "fs";
import * as path from "path";
import { ResolveOptions, ResolveResult, ResolveStore } from "./resolveTypes";

const DEFAULT_DIR = "./configs";

export function loadResolveStore(storePath: string): ResolveStore {
  if (!fs.existsSync(storePath)) {
    return { defaultDir: DEFAULT_DIR, profileDirs: {} };
  }
  const raw = fs.readFileSync(storePath, "utf-8");
  return JSON.parse(raw) as ResolveStore;
}

export function saveResolveStore(storePath: string, store: ResolveStore): void {
  fs.writeFileSync(storePath, JSON.stringify(store, null, 2), "utf-8");
}

export function resolveServicePath(
  service: string,
  options: ResolveOptions,
  store: ResolveStore
): ResolveResult {
  let resolvedPath: string;
  let source: ResolveResult["source"];

  if (options.configPath) {
    resolvedPath = options.configPath;
    source = "explicit";
  } else if (options.profile && store.profileDirs[options.profile]) {
    resolvedPath = path.join(store.profileDirs[options.profile], `${service}.yaml`);
    source = "profile";
  } else {
    const dir = options.defaultDir ?? store.defaultDir ?? DEFAULT_DIR;
    resolvedPath = path.join(dir, `${service}.yaml`);
    source = "default";
  }

  const exists = fs.existsSync(resolvedPath);
  return { service, resolvedPath, exists, source };
}

export function formatResolveResult(result: ResolveResult): string {
  const status = result.exists ? "✔" : "✘";
  return `[${status}] ${result.service} → ${result.resolvedPath} (source: ${result.source})`;
}
