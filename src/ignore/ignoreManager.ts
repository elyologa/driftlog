import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

export interface IgnoreRule {
  service?: string;
  keys: string[];
}

export interface IgnoreStore {
  rules: IgnoreRule[];
}

const DEFAULT_IGNORE_FILE = '.driftignore.yaml';

export function loadIgnoreStore(filePath: string = DEFAULT_IGNORE_FILE): IgnoreStore {
  if (!fs.existsSync(filePath)) {
    return { rules: [] };
  }
  const raw = fs.readFileSync(filePath, 'utf-8');
  const parsed = yaml.load(raw) as IgnoreStore;
  if (!parsed || !Array.isArray(parsed.rules)) {
    return { rules: [] };
  }
  return parsed;
}

export function saveIgnoreStore(store: IgnoreStore, filePath: string = DEFAULT_IGNORE_FILE): void {
  const content = yaml.dump(store);
  fs.writeFileSync(filePath, content, 'utf-8');
}

export function addIgnoreRule(
  store: IgnoreStore,
  keys: string[],
  service?: string
): IgnoreStore {
  const existing = store.rules.find(
    (r) => r.service === service
  );
  if (existing) {
    const merged = Array.from(new Set([...existing.keys, ...keys]));
    return {
      rules: store.rules.map((r) =>
        r.service === service ? { ...r, keys: merged } : r
      ),
    };
  }
  return {
    rules: [...store.rules, { service, keys }],
  };
}

export function getIgnoredKeys(store: IgnoreStore, service?: string): string[] {
  const global = store.rules
    .filter((r) => r.service === undefined)
    .flatMap((r) => r.keys);
  const specific = service
    ? store.rules
        .filter((r) => r.service === service)
        .flatMap((r) => r.keys)
    : [];
  return Array.from(new Set([...global, ...specific]));
}

export function shouldIgnoreKey(key: string, ignoredKeys: string[]): boolean {
  return ignoredKeys.some((pattern) => {
    if (pattern.endsWith('.*')) {
      const prefix = pattern.slice(0, -2);
      return key === prefix || key.startsWith(prefix + '.');
    }
    return key === pattern;
  });
}
