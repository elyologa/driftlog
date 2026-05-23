import { addIgnoreRule, getIgnoredKeys, loadIgnoreStore, saveIgnoreStore, shouldIgnoreKey } from './ignoreManager';
import * as fs from 'fs';
import * as path from 'path';

const TEST_FILE = path.join(__dirname, '__test_driftignore.yaml');

afterEach(() => {
  if (fs.existsSync(TEST_FILE)) {
    fs.unlinkSync(TEST_FILE);
  }
});

describe('loadIgnoreStore', () => {
  it('returns empty rules when file does not exist', () => {
    const store = loadIgnoreStore('/nonexistent/path.yaml');
    expect(store.rules).toEqual([]);
  });

  it('loads and parses a valid ignore file', () => {
    saveIgnoreStore({ rules: [{ keys: ['env', 'version'] }] }, TEST_FILE);
    const store = loadIgnoreStore(TEST_FILE);
    expect(store.rules).toHaveLength(1);
    expect(store.rules[0].keys).toContain('env');
  });
});

describe('addIgnoreRule', () => {
  it('adds a new global rule', () => {
    const store = addIgnoreRule({ rules: [] }, ['env', 'version']);
    expect(store.rules).toHaveLength(1);
    expect(store.rules[0].keys).toEqual(['env', 'version']);
    expect(store.rules[0].service).toBeUndefined();
  });

  it('adds a service-specific rule', () => {
    const store = addIgnoreRule({ rules: [] }, ['replicas'], 'api');
    expect(store.rules[0].service).toBe('api');
    expect(store.rules[0].keys).toContain('replicas');
  });

  it('merges keys for existing service rule', () => {
    let store = addIgnoreRule({ rules: [] }, ['env'], 'api');
    store = addIgnoreRule(store, ['version'], 'api');
    expect(store.rules).toHaveLength(1);
    expect(store.rules[0].keys).toContain('env');
    expect(store.rules[0].keys).toContain('version');
  });
});

describe('getIgnoredKeys', () => {
  it('returns global and service-specific keys combined', () => {
    let store = addIgnoreRule({ rules: [] }, ['env']);
    store = addIgnoreRule(store, ['replicas'], 'api');
    const keys = getIgnoredKeys(store, 'api');
    expect(keys).toContain('env');
    expect(keys).toContain('replicas');
  });

  it('returns only global keys when no service specified', () => {
    let store = addIgnoreRule({ rules: [] }, ['env']);
    store = addIgnoreRule(store, ['replicas'], 'api');
    const keys = getIgnoredKeys(store);
    expect(keys).toContain('env');
    expect(keys).not.toContain('replicas');
  });
});

describe('shouldIgnoreKey', () => {
  it('returns true for exact match', () => {
    expect(shouldIgnoreKey('env', ['env', 'version'])).toBe(true);
  });

  it('returns false for non-matching key', () => {
    expect(shouldIgnoreKey('image', ['env', 'version'])).toBe(false);
  });

  it('supports wildcard prefix matching', () => {
    expect(shouldIgnoreKey('metadata.labels', ['metadata.*'])).toBe(true);
    expect(shouldIgnoreKey('metadata', ['metadata.*'])).toBe(true);
    expect(shouldIgnoreKey('spec.replicas', ['metadata.*'])).toBe(false);
  });
});
