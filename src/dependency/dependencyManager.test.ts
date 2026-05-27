import fs from 'fs';
import os from 'os';
import path from 'path';
import {
  loadDependencyStore,
  saveDependencyStore,
  setDependencies,
  getDependencies,
  removeDependencies,
  buildDependencyGraph,
  checkDependencies,
  formatDependencyResult,
} from './dependencyManager';

function makeTempFile(): string {
  return path.join(os.tmpdir(), `dep-test-${Date.now()}.json`);
}

describe('dependencyManager', () => {
  it('loads empty store when file missing', () => {
    const store = loadDependencyStore('/nonexistent/path.json');
    expect(store.dependencies).toEqual({});
  });

  it('saves and loads store', () => {
    const f = makeTempFile();
    const store = { dependencies: {} };
    setDependencies(store, 'api', ['db', 'cache']);
    saveDependencyStore(f, store);
    const loaded = loadDependencyStore(f);
    expect(loaded.dependencies['api'].dependsOn).toEqual(['db', 'cache']);
    fs.unlinkSync(f);
  });

  it('setDependencies updates entry', () => {
    const store = { dependencies: {} };
    const entry = setDependencies(store, 'web', ['api']);
    expect(entry.service).toBe('web');
    expect(store.dependencies['web'].dependsOn).toContain('api');
  });

  it('getDependencies returns undefined for unknown', () => {
    const store = { dependencies: {} };
    expect(getDependencies(store, 'unknown')).toBeUndefined();
  });

  it('removeDependencies returns false if not found', () => {
    const store = { dependencies: {} };
    expect(removeDependencies(store, 'ghost')).toBe(false);
  });

  it('removeDependencies removes entry', () => {
    const store = { dependencies: {} };
    setDependencies(store, 'svc', ['dep']);
    expect(removeDependencies(store, 'svc')).toBe(true);
    expect(store.dependencies['svc']).toBeUndefined();
  });

  it('buildDependencyGraph produces correct nodes and edges', () => {
    const store = { dependencies: {} };
    setDependencies(store, 'a', ['b', 'c']);
    const graph = buildDependencyGraph(store);
    expect(graph.nodes).toContain('a');
    expect(graph.nodes).toContain('b');
    expect(graph.edges).toContainEqual({ from: 'a', to: 'b' });
  });

  it('checkDependencies reports missing services', () => {
    const store = { dependencies: {} };
    setDependencies(store, 'frontend', ['backend']);
    const result = checkDependencies(store, 'frontend');
    expect(result.missing).toContain('backend');
    expect(result.valid).toBe(false);
  });

  it('checkDependencies valid when all deps registered', () => {
    const store = { dependencies: {} };
    setDependencies(store, 'backend', []);
    setDependencies(store, 'frontend', ['backend']);
    const result = checkDependencies(store, 'frontend');
    expect(result.missing).toHaveLength(0);
    expect(result.valid).toBe(true);
  });

  it('formatDependencyResult includes service name', () => {
    const store = { dependencies: {} };
    setDependencies(store, 'svc', []);
    const result = checkDependencies(store, 'svc');
    const text = formatDependencyResult(result);
    expect(text).toContain('svc');
  });
});
