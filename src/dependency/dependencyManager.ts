import fs from 'fs';
import { DependencyStore, ServiceDependency, DependencyGraph, DependencyCheckResult } from './dependencyTypes';

export function loadDependencyStore(storePath: string): DependencyStore {
  if (!fs.existsSync(storePath)) return { dependencies: {} };
  return JSON.parse(fs.readFileSync(storePath, 'utf-8'));
}

export function saveDependencyStore(storePath: string, store: DependencyStore): void {
  fs.writeFileSync(storePath, JSON.stringify(store, null, 2));
}

export function setDependencies(
  store: DependencyStore,
  service: string,
  dependsOn: string[]
): ServiceDependency {
  const entry: ServiceDependency = { service, dependsOn, updatedAt: new Date().toISOString() };
  store.dependencies[service] = entry;
  return entry;
}

export function getDependencies(store: DependencyStore, service: string): ServiceDependency | undefined {
  return store.dependencies[service];
}

export function removeDependencies(store: DependencyStore, service: string): boolean {
  if (!store.dependencies[service]) return false;
  delete store.dependencies[service];
  return true;
}

export function buildDependencyGraph(store: DependencyStore): DependencyGraph {
  const nodeSet = new Set<string>();
  const edges: Array<{ from: string; to: string }> = [];
  for (const dep of Object.values(store.dependencies)) {
    nodeSet.add(dep.service);
    for (const d of dep.dependsOn) {
      nodeSet.add(d);
      edges.push({ from: dep.service, to: d });
    }
  }
  return { nodes: Array.from(nodeSet), edges };
}

function detectCycles(service: string, store: DependencyStore, visited: Set<string>, stack: Set<string>): string[] {
  visited.add(service);
  stack.add(service);
  const deps = store.dependencies[service]?.dependsOn ?? [];
  for (const dep of deps) {
    if (!visited.has(dep)) {
      const cycle = detectCycles(dep, store, visited, stack);
      if (cycle.length) return cycle;
    } else if (stack.has(dep)) {
      return [dep];
    }
  }
  stack.delete(service);
  return [];
}

export function checkDependencies(store: DependencyStore, service: string): DependencyCheckResult {
  const entry = store.dependencies[service];
  const allServices = Object.keys(store.dependencies);
  const missing = entry ? entry.dependsOn.filter(d => !allServices.includes(d)) : [];
  const circular = detectCycles(service, store, new Set(), new Set());
  return { service, missing, circular, valid: missing.length === 0 && circular.length === 0 };
}

export function formatDependencyResult(result: DependencyCheckResult): string {
  const lines: string[] = [`Service: ${result.service}`, `Valid: ${result.valid}`];
  if (result.missing.length) lines.push(`Missing: ${result.missing.join(', ')}`);
  if (result.circular.length) lines.push(`Circular: ${result.circular.join(', ')}`);
  return lines.join('\n');
}
