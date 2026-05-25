import * as fs from "fs";
import {
  archiveService,
  getArchivedService,
  listArchivedServices,
  restoreService,
  unarchiveService,
} from "./archiveManager";

export async function runArchiveCommand(
  action: string,
  args: Record<string, string>,
  storePath: string
): Promise<string> {
  switch (action) {
    case "add": {
      const { service, reason } = args;
      if (!service) return "Error: --service is required";
      const configPath = args.config;
      if (!configPath || !fs.existsSync(configPath)) {
        return `Error: config file not found: ${configPath}`;
      }
      const raw = fs.readFileSync(configPath, "utf-8");
      let config: Record<string, unknown>;
      try {
        config = JSON.parse(raw);
      } catch {
        return "Error: invalid JSON config";
      }
      const result = await archiveService(storePath, service, config, reason);
      return result.message;
    }
    case "get": {
      const { service } = args;
      if (!service) return "Error: --service is required";
      const entry = await getArchivedService(storePath, service);
      if (!entry) return `No archived entry found for service: ${service}`;
      return JSON.stringify(entry, null, 2);
    }
    case "list": {
      const entries = await listArchivedServices(storePath);
      if (entries.length === 0) return "No archived services.";
      return entries
        .map((e) => `${e.name} (archived: ${e.archivedAt})${e.reason ? ` — ${e.reason}` : ""}`)
        .join("\n");
    }
    case "restore": {
      const { service } = args;
      if (!service) return "Error: --service is required";
      const result = await restoreService(storePath, service);
      return result.message;
    }
    case "remove": {
      const { service } = args;
      if (!service) return "Error: --service is required";
      const result = await unarchiveService(storePath, service);
      return result.message;
    }
    default:
      return `Unknown archive action: ${action}. Use add | get | list | restore | remove`;
  }
}
