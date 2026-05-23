import fs from 'fs';
import os from 'os';
import path from 'path';
import { runSnapshotCommand } from './snapshotCommand';
import { loadSnapshotStore } from './snapshotManager';

const FIXTURE_DIR = path.join(__dirname, '../../__fixtures__');
const YAML_FIXTURE = path.join(FIXTURE_DIR, 'test-service.yaml');
const TMP_STORE = path.join(os.tmpdir(), 'driftlog-cmd-test', 'snapshots.json');

beforeAll(() => {
  if (!fs.existsSync(FIXTURE_DIR)) fs.mkdirSync(FIXTURE_DIR, { recursive: true });
  fs.writeFileSync(
    YAML_FIXTURE,
    'name: test-service\nreplicas: 2\nenv: staging\n',
    'utf-8'
  );
});

afterEach(() => {
  if (fs.existsSync(TMP_STORE)) fs.unlinkSync(TMP_STORE);
});

afterAll(() => {
  if (fs.existsSync(YAML_FIXTURE)) fs.unlinkSync(YAML_FIXTURE);
});

describe('runSnapshotCommand', () => {
  test('records baseline when no previous snapshot exists', () => {
    const output = runSnapshotCommand({ yamlFile: YAML_FIXTURE, storePath: TMP_STORE });
    expect(output).toContain('Baseline recorded');
    const store = loadSnapshotStore(TMP_STORE);
    expect(store.snapshots).toHaveLength(1);
    expect(store.snapshots[0].serviceId).toBe('test-service');
  });

  test('detects no drift when config unchanged', () => {
    runSnapshotCommand({ yamlFile: YAML_FIXTURE, storePath: TMP_STORE });
    const output = runSnapshotCommand({ yamlFile: YAML_FIXTURE, storePath: TMP_STORE });
    expect(output).toContain('No drift detected');
  });

  test('dry-run does not persist snapshot', () => {
    runSnapshotCommand({ yamlFile: YAML_FIXTURE, storePath: TMP_STORE, dryRun: true });
    const store = loadSnapshotStore(TMP_STORE);
    expect(store.snapshots).toHaveLength(0);
  });

  test('returns json format when requested', () => {
    const output = runSnapshotCommand({
      yamlFile: YAML_FIXTURE,
      storePath: TMP_STORE,
      format: 'json',
    });
    const parsed = JSON.parse(output);
    expect(parsed).toHaveProperty('serviceId', 'test-service');
  });

  test('uses explicit serviceId override', () => {
    const output = runSnapshotCommand({
      yamlFile: YAML_FIXTURE,
      storePath: TMP_STORE,
      serviceId: 'custom-id',
    });
    expect(output).toContain('custom-id');
    const store = loadSnapshotStore(TMP_STORE);
    expect(store.snapshots[0].serviceId).toBe('custom-id');
  });
});
