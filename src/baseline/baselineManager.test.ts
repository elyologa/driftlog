import * as fs from 'fs';
import * as path from 'path';
import {
  loadBaselineStore,
  saveBaselineStore,
  captureBaseline,
  getBaseline,
  removeBaseline,
  listBaselines,
  BaselineStore,
} from './baselineManager';
import { DriftResult } from '../drift/types';

const TEST_PATH = '/tmp/driftlog-test-baselines.json';

const mockDriftResult: DriftResult = {
  service: 'api-gateway',
  diffs: [
    { key: 'replicas', expected: 3, actual: 2 },
    { key: 'image.tag', expected: 'v1.2.0', actual: 'v1.1.9' },
  ],
};

afterEach(() => {
  if (fs.existsSync(TEST_PATH)) {
    fs.unlinkSync(TEST_PATH);
  }
});

describe('loadBaselineStore', () => {
  it('returns empty store when file does not exist', () => {
    const store = loadBaselineStore('/tmp/nonexistent-baseline.json');
    expect(store.version).toBe(1);
    expect(store.baselines).toEqual({});
  });

  it('loads existing store from file', () => {
    const initial: BaselineStore = { version: 1, baselines: {} };
    fs.writeFileSync(TEST_PATH, JSON.stringify(initial), 'utf-8');
    const store = loadBaselineStore(TEST_PATH);
    expect(store).toEqual(initial);
  });
});

describe('saveBaselineStore', () => {
  it('writes store to file and creates directory if needed', () => {
    const store: BaselineStore = { version: 1, baselines: {} };
    saveBaselineStore(store, TEST_PATH);
    expect(fs.existsSync(TEST_PATH)).toBe(true);
    const loaded = JSON.parse(fs.readFileSync(TEST_PATH, 'utf-8'));
    expect(loaded).toEqual(store);
  });
});

describe('captureBaseline', () => {
  it('adds a baseline entry for the service', () => {
    const store: BaselineStore = { version: 1, baselines: {} };
    const updated = captureBaseline(store, mockDriftResult);
    expect(updated.baselines['api-gateway']).toBeDefined();
    expect(updated.baselines['api-gateway'].service).toBe('api-gateway');
    expect(updated.baselines['api-gateway'].driftKeys).toEqual(['replicas', 'image.tag']);
    expect(updated.baselines['api-gateway'].expectedValues['replicas']).toBe(3);
  });

  it('overwrites an existing baseline for the same service', () => {
    let store: BaselineStore = { version: 1, baselines: {} };
    store = captureBaseline(store, mockDriftResult);
    const newDrift: DriftResult = { service: 'api-gateway', diffs: [{ key: 'cpu', expected: '500m', actual: '250m' }] };
    store = captureBaseline(store, newDrift);
    expect(store.baselines['api-gateway'].driftKeys).toEqual(['cpu']);
  });
});

describe('getBaseline', () => {
  it('returns undefined for unknown service', () => {
    const store: BaselineStore = { version: 1, baselines: {} };
    expect(getBaseline(store, 'unknown')).toBeUndefined();
  });

  it('returns the baseline entry for a known service', () => {
    let store: BaselineStore = { version: 1, baselines: {} };
    store = captureBaseline(store, mockDriftResult);
    const entry = getBaseline(store, 'api-gateway');
    expect(entry?.service).toBe('api-gateway');
  });
});

describe('removeBaseline', () => {
  it('removes the baseline for a given service', () => {
    let store: BaselineStore = { version: 1, baselines: {} };
    store = captureBaseline(store, mockDriftResult);
    store = removeBaseline(store, 'api-gateway');
    expect(store.baselines['api-gateway']).toBeUndefined();
  });
});

describe('listBaselines', () => {
  it('returns all baseline entries', () => {
    let store: BaselineStore = { version: 1, baselines: {} };
    store = captureBaseline(store, mockDriftResult);
    const list = listBaselines(store);
    expect(list).toHaveLength(1);
    expect(list[0].service).toBe('api-gateway');
  });
});
