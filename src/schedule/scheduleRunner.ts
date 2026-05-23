import {
  loadScheduleStore,
  saveScheduleStore,
  getDueSchedules,
} from "./scheduleManager";
import { ScheduleStore } from "./scheduleTypes";

export type RunDriftFn = (
  serviceName: string,
  yamlPath?: string
) => Promise<void>;

export interface ScheduleRunResult {
  serviceName: string;
  ranAt: string;
  error?: string;
}

export async function runDueSchedules(
  storeFile: string,
  runDrift: RunDriftFn,
  now: Date = new Date()
): Promise<ScheduleRunResult[]> {
  const store = loadScheduleStore(storeFile);
  const due = getDueSchedules(store, now);
  const results: ScheduleRunResult[] = [];

  for (const entry of due) {
    const ranAt = now.toISOString();
    try {
      await runDrift(entry.serviceName, entry.yamlPath);
      store.schedules[entry.serviceName] = {
        ...entry,
        lastRunAt: ranAt,
      };
      results.push({ serviceName: entry.serviceName, ranAt });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      results.push({
        serviceName: entry.serviceName,
        ranAt,
        error: message,
      });
    }
  }

  saveScheduleStore(storeFile, store);
  return results;
}

export function formatRunResults(results: ScheduleRunResult[]): string {
  if (results.length === 0) return "No schedules were due.";
  return results
    .map((r) =>
      r.error
        ? `[ERROR] ${r.serviceName} at ${r.ranAt}: ${r.error}`
        : `[OK]    ${r.serviceName} at ${r.ranAt}`
    )
    .join("\n");
}
