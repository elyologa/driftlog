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

const DEFAULT_STORE = path.resolve('dependency-store.json');

export function runDependencyCommand(args: string[], storePath = DEFAULT_STORE): string {
  const [subcommand, service, ...rest] = args;
  const store = loadDependencyStore(storePath);

  if (subcommand === 'set') {
    if (!service) return 'Error: service name required';
    const deps = rest.length ? rest : [];
    const entry = setDependencies(store, service, deps);
    saveDependencyStore(storePath, store);
    return `Dependencies set for "${entry.service}": [${entry.dependsOn.join(', ')}]`;
  }

  if (subcommand === 'get') {
    if (!service) return 'Error: service name required';
    const entry = getDependencies(store, service);
    if (!entry) return `No dependencies found for "${service}"`;
    return `${entry.service} depends on: [${entry.dependsOn.join(', ')}]`;
  }

  if (subcommand === 'remove') {
    if (!service) return 'Error: service name required';
    const removed = removeDependencies(store, service);
    if (!removed) return `No entry found for "${service}"`;
    saveDependencyStore(storePath, store);
    return `Dependencies removed for "${service}"`;
  }

  if (subcommand === 'graph') {
    const graph = buildDependencyGraph(store);
    const lines = [`Nodes: ${graph.nodes.join(', ')}`, 'Edges:'];
    for (const e of graph.edges) lines.push(`  ${e.from} -> ${e.to}`);
    return lines.join('\n');
  }

  if (subcommand === 'check') {
    if (!service) return 'Error: service name required';
    const result = checkDependencies(store, service);
    return formatDependencyResult(result);
  }

  return 'Usage: dependency <set|get|remove|graph|check> [service] [deps...]';
}
