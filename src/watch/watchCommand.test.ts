import { runWatchCommand } from './watchCommand';
import * as watcher from './watcher';

jest.mock('./watcher');

const mockStartWatcher = watcher.startWatcher as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  mockStartWatcher.mockReturnValue({
    stop: jest.fn(),
    getState: jest.fn().mockReturnValue({
      isRunning: false,
      lastCheckedAt: '2024-01-01T00:00:00.000Z',
      driftCount: 0,
      errorCount: 0,
    }),
  });
});

test('starts watcher with correct options', () => {
  const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
  runWatchCommand({ serviceName: 'api', configPath: 'api.yaml', intervalMs: 5000 });

  expect(mockStartWatcher).toHaveBeenCalledWith(
    expect.objectContaining({
      serviceName: 'api',
      configPath: 'api.yaml',
      intervalMs: 5000,
    }),
    expect.any(String)
  );
  consoleSpy.mockRestore();
});

test('uses default intervalMs when not provided', () => {
  const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
  runWatchCommand({ serviceName: 'api', configPath: 'api.yaml' });

  expect(mockStartWatcher).toHaveBeenCalledWith(
    expect.objectContaining({ intervalMs: 30000 }),
    expect.any(String)
  );
  consoleSpy.mockRestore();
});

test('onDrift logs warning when not quiet', () => {
  const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
  const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
  runWatchCommand({ serviceName: 'api', configPath: 'api.yaml' });

  const opts = mockStartWatcher.mock.calls[0][0];
  opts.onDrift('drift report text');
  expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('drift report text'));

  warnSpy.mockRestore();
  consoleSpy.mockRestore();
});

test('onError logs error message', () => {
  const errSpy = jest.spyOn(console, 'error').mockImplementation();
  const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
  runWatchCommand({ serviceName: 'api', configPath: 'api.yaml' });

  const opts = mockStartWatcher.mock.calls[0][0];
  opts.onError(new Error('file not found'));
  expect(errSpy).toHaveBeenCalledWith(expect.stringContaining('file not found'));

  errSpy.mockRestore();
  consoleSpy.mockRestore();
});
