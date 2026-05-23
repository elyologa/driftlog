import { WatchOptions, WatchHandle, WatchState } from './types';
import { parseYamlFile } from '../parser/yamlParser';
import { getSnapshot } from '../snapshot/snapshotManager';
import { detectDrift } from '../drift/detector';
import { formatReport } from '../drift/reporter';

export function startWatcher(
  options: WatchOptions,
  snapshotStorePath: string
): WatchHandle {
  const state: WatchState = {
    serviceName: options.serviceName,
    configPath: options.configPath,
    intervalMs: options.intervalMs,
    isRunning: true,
    lastCheckedAt: null,
    driftCount: 0,
    errorCount: 0,
  };

  async function check() {
    if (!state.isRunning) return;
    try {
      const config = await parseYamlFile(options.configPath);
      const snapshot = await getSnapshot(snapshotStorePath, options.serviceName);
      if (!snapshot) {
        options.onError?.(new Error(`No snapshot found for service: ${options.serviceName}`));
        state.errorCount++;
      } else {
        const drifts = detectDrift(snapshot.config, config);
        state.lastCheckedAt = new Date().toISOString();
        if (drifts.length > 0) {
          state.driftCount++;
          const report = formatReport(options.serviceName, drifts);
          options.onDrift?.(report);
        }
      }
    } catch (err) {
      state.errorCount++;
      options.onError?.(err instanceof Error ? err : new Error(String(err)));
    }
  }

  const timer = setInterval(check, options.intervalMs);
  check();

  return {
    stop() {
      state.isRunning = false;
      clearInterval(timer);
    },
    getState() {
      return { ...state };
    },
  };
}
