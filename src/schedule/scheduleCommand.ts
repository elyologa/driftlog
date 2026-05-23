import * as fs from "fs";
import {
  upsertSchedule,
  removeSchedule,
  getSchedule,
  listSchedules,
  loadScheduleStore,
  saveScheduleStore,
} from "./scheduleManager";
import { ScheduleEntry } from "./scheduleTypes";

export async function runScheduleCommand(
  args: string[],
  storeFile: string
): Promise<string> {
  const [subcommand, serviceName, ...rest] = args;

  if (!subcommand) {
    return "Usage: schedule <set|remove|get|list|run> [service] [options]";
  }

  const store = loadScheduleStore(storeFile);

  if (subcommand === "set") {
    if (!serviceName || !rest[0]) {
      return "Usage: schedule set <service> <intervalSeconds> [yamlPath]";
    }
    const intervalSeconds = parseInt(rest[0], 10);
    if (isNaN(intervalSeconds) || intervalSeconds <= 0) {
      return "Error: intervalSeconds must be a positive integer";
    }
    const yamlPath = rest[1] || undefined;
    const entry: ScheduleEntry = {
      serviceName,
      intervalSeconds,
      yamlPath,
      lastRunAt: undefined,
    };
    const updated = upsertSchedule(store, entry);
    saveScheduleStore(storeFile, updated);
    return `Schedule set for "${serviceName}" every ${intervalSeconds}s`;
  }

  if (subcommand === "remove") {
    if (!serviceName) return "Usage: schedule remove <service>";
    const updated = removeSchedule(store, serviceName);
    saveScheduleStore(storeFile, updated);
    return `Schedule removed for "${serviceName}"`;
  }

  if (subcommand === "get") {
    if (!serviceName) return "Usage: schedule get <service>";
    const entry = getSchedule(store, serviceName);
    if (!entry) return `No schedule found for "${serviceName}"`;
    return JSON.stringify(entry, null, 2);
  }

  if (subcommand === "list") {
    const entries = listSchedules(store);
    if (entries.length === 0) return "No schedules configured.";
    return entries
      .map(
        (e) =>
          `${e.serviceName}: every ${e.intervalSeconds}s` +
          (e.lastRunAt ? ` (last run: ${e.lastRunAt})` : " (never run)")
      )
      .join("\n");
  }

  return `Unknown subcommand: ${subcommand}`;
}
