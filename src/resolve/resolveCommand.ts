import * as path from "path";
import {
  loadResolveStore,
  resolveServicePath,
  formatResolveResult,
} from "./resolveManager";
import { ResolveOptions } from "./resolveTypes";

const DEFAULT_STORE = path.join(process.cwd(), ".driftlog", "resolve.json");

export function runResolveCommand(
  args: string[],
  flags: Record<string, string | undefined>,
  storePath: string = DEFAULT_STORE
): void {
  const services = args;
  if (services.length === 0) {
    console.error("Usage: driftlog resolve <service> [--profile <name>] [--config <path>] [--dir <dir>]");
    process.exit(1);
  }

  const store = loadResolveStore(storePath);
  const options: ResolveOptions = {
    configPath: flags["--config"],
    profile: flags["--profile"],
    defaultDir: flags["--dir"],
  };

  let hasError = false;
  for (const service of services) {
    const result = resolveServicePath(service, options, store);
    console.log(formatResolveResult(result));
    if (!result.exists) hasError = true;
  }

  if (hasError) process.exit(1);
}
