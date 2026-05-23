import * as fs from 'fs';
import * as path from 'path';
import { DriftResult } from '../drift/types';

export interface BaselineEntry {
  service: string;
  capturedAt: string;
  driftKeys: string[];
  expectedValues: Record<string, unknown>;
}

export interface BaselineStore {
  version: number;
  baselines: Record<string, BaselineEntry>;
}

const DEFAULT_BASELINE_PATH = '.driftlog/baselines.json';

export function loadBaselineStore(filePath: string = DEFAULT_BASELINE_PATH): BaselineStore {
  if (!fs.existsSync(filePath)) {
    return { version: 1, baselines: {} };
  }
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw) as BaselineStore;
}

export function saveBaselineStore(
  store: BaselineStore,
  filePath: string = DEFAULT_BASELINE_PATH
): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, JSON.stringify(store, null, 2), 'utf-8');
}

export function captureBaseline(
  store: BaselineStore,
  driftResult: DriftResult
): BaselineStore {
  const entry: BaselineEntry = {
    service: driftResult.service,
    capturedAt: new Date().toISOString(),
    driftKeys: driftResult.diffs.map((d) => d.key),
    expectedValues: Object.fromEntries(
      driftResult.diffs.map((d) => [d.key, d.expected])
    ),
  };
  return {
    ...store,
    baselines: {
      ...store.baselines,
      [driftResult.service]: entry,
    },
  };
}

export function getBaseline(
  store: BaselineStore,
  service: string
): BaselineEntry | undefined {
  return store.baselines[service];
}

export function removeBaseline(
  store: BaselineStore,
  service: string
): BaselineStore {
  const updated = { ...store, baselines: { ...store.baselines } };
  delete updated.baselines[service];
  return updated;
}

export function listBaselines(store: BaselineStore): BaselineEntry[] {
  return Object.values(store.baselines);
}
