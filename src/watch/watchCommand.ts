import * as path from 'path';
import { startWatcher } from './watcher';
import { WatchOptions } from './types';

export interface WatchCommandArgs {
  serviceName: string;
  configPath: string;
  intervalMs?: number;
  snapshotStore?: string;
  quiet?: boolean;
}

export function runWatchCommand(args: WatchCommandArgs): void {
  const intervalMs = args.intervalMs ?? 30000;
  const snapshotStore = args.snapshotStore ?? path.resolve(process.cwd(), 'snapshots.json');

  const options: WatchOptions = {
    serviceName: args.serviceName,
    configPath: args.configPath,
    intervalMs,
    onDrift(report) {
      if (!args.quiet) {
        console.warn(`[driftlog] Drift detected for "${args.serviceName}":\n${report}`);
      }
    },
    onError(err) {
      console.error(`[driftlog] Watch error for "${args.serviceName}": ${err.message}`);
    },
  };

  const handle = startWatcher(options, snapshotStore);

  console.log(
    `[driftlog] Watching "${args.serviceName}" every ${intervalMs}ms. Press Ctrl+C to stop.`
  );

  process.on('SIGINT', () => {
    handle.stop();
    const state = handle.getState();
    console.log(
      `\n[driftlog] Stopped. Checks: lastCheckedAt=${state.lastCheckedAt}, driftCount=${state.driftCount}, errorCount=${state.errorCount}`
    );
    process.exit(0);
  });
}
