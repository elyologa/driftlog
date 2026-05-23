import { startWatcher } from './watcher';
import * as yamlParser from '../parser/yamlParser';
import * as snapshotManager from '../snapshot/snapshotManager';
import * as detector from '../drift/detector';

jest.mock('../parser/yamlParser');
jest.mock('../snapshot/snapshotManager');
jest.mock('../drift/detector');

const mockParseYamlFile = yamlParser.parseYamlFile as jest.Mock;
const mockGetSnapshot = snapshotManager.getSnapshot as jest.Mock;
const mockDetectDrift = detector.detectDrift as jest.Mock;

beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
});

afterEach(() => {
  jest.useRealTimers();
});

test('calls onDrift when drift is detected', async () => {
  const config = { replicas: 2 };
  const snapshot = { serviceName: 'svc', config: { replicas: 1 }, createdAt: '' };
  mockParseYamlFile.mockResolvedValue(config);
  mockGetSnapshot.mockResolvedValue(snapshot);
  mockDetectDrift.mockReturnValue([{ key: 'replicas', expected: 1, actual: 2 }]);

  const onDrift = jest.fn();
  const handle = startWatcher(
    { intervalMs: 1000, configPath: 'cfg.yaml', serviceName: 'svc', onDrift },
    'store.json'
  );

  await Promise.resolve();
  expect(onDrift).toHaveBeenCalled();
  handle.stop();
});

test('calls onError when snapshot is missing', async () => {
  mockParseYamlFile.mockResolvedValue({});
  mockGetSnapshot.mockResolvedValue(null);

  const onError = jest.fn();
  const handle = startWatcher(
    { intervalMs: 1000, configPath: 'cfg.yaml', serviceName: 'svc', onError },
    'store.json'
  );

  await Promise.resolve();
  expect(onError).toHaveBeenCalledWith(expect.any(Error));
  handle.stop();
});

test('stop halts the watcher', async () => {
  mockParseYamlFile.mockResolvedValue({});
  mockGetSnapshot.mockResolvedValue({ serviceName: 'svc', config: {}, createdAt: '' });
  mockDetectDrift.mockReturnValue([]);

  const handle = startWatcher(
    { intervalMs: 500, configPath: 'cfg.yaml', serviceName: 'svc' },
    'store.json'
  );

  await Promise.resolve();
  handle.stop();
  expect(handle.getState().isRunning).toBe(false);
});
