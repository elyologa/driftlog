import path from 'path';
import { parseYamlFile } from '../parser/yamlParser';
import { detectDrift } from '../drift/detector';
import { formatReport, formatReportJson } from '../drift/reporter';
import {
  createSnapshot,
  loadSnapshotStore,
  saveSnapshotStore,
  upsertSnapshot,
  getSnapshot,
} from './snapshotManager';

const DEFAULT_STORE_PATH = path.resolve(process.cwd(), '.driftlog', 'snapshots.json');

export interface SnapshotCommandOptions {
  yamlFile: string;
  serviceId?: string;
  storePath?: string;
  format?: 'text' | 'json';
  dryRun?: boolean;
}

export function runSnapshotCommand(options: SnapshotCommandOptions): string {
  const {
    yamlFile,
    storePath = DEFAULT_STORE_PATH,
    format = 'text',
    dryRun = false,
  } = options;

  const parsed = parseYamlFile(yamlFile);
  const serviceId = options.serviceId ?? parsed.name;
  const store = loadSnapshotStore(storePath);
  const previous = getSnapshot(store, serviceId);

  const newSnapshot = createSnapshot(serviceId, parsed as Record<string, unknown>, 'yaml');

  let output = '';

  if (previous) {
    const driftResults = detectDrift(previous.config, newSnapshot.config);
    if (format === 'json') {
      output = formatReportJson(serviceId, driftResults);
    } else {
      output = formatReport(serviceId, driftResults);
    }
  } else {
    output =
      format === 'json'
        ? JSON.stringify({ serviceId, status: 'new_baseline', message: 'No previous snapshot found. Baseline recorded.' })
        : `[${serviceId}] No previous snapshot found. Baseline recorded.`;
  }

  if (!dryRun) {
    upsertSnapshot(store, newSnapshot);
    saveSnapshotStore(storePath, store);
  }

  return output;
}
