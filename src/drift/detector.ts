import { ConfigMap, DriftEntry, DriftReport } from './types';

function flattenObject(
  obj: unknown,
  prefix = ''
): Record<string, unknown> {
  if (typeof obj !== 'object' || obj === null) {
    return { [prefix]: obj };
  }
  return Object.entries(obj as Record<string, unknown>).reduce(
    (acc, [key, value]) => {
      const newKey = prefix ? `${prefix}.${key}` : key;
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        Object.assign(acc, flattenObject(value, newKey));
      } else {
        acc[newKey] = value;
      }
      return acc;
    },
    {} as Record<string, unknown>
  );
}

/**
 * Compares expected and actual configuration maps for a given service and
 * returns a DriftReport describing any missing, changed, or extra keys.
 *
 * @param serviceName - Identifier for the service being checked.
 * @param expected    - The source-of-truth configuration.
 * @param actual      - The deployed configuration to compare against.
 * @returns A DriftReport with all detected drift entries.
 */
export function detectDrift(
  serviceName: string,
  expected: ConfigMap,
  actual: ConfigMap
): DriftReport {
  const flatExpected = flattenObject(expected);
  const flatActual = flattenObject(actual);
  const drifts: DriftEntry[] = [];

  for (const [path, expectedValue] of Object.entries(flatExpected)) {
    if (!(path in flatActual)) {
      drifts.push({
        path,
        severity: 'missing',
        expected: expectedValue,
        message: `Key "${path}" is missing from deployed config`,
      });
    } else if (JSON.stringify(flatActual[path]) !== JSON.stringify(expectedValue)) {
      drifts.push({
        path,
        severity: 'changed',
        expected: expectedValue,
        actual: flatActual[path],
        message: `Key "${path}" differs: expected ${JSON.stringify(expectedValue)}, got ${JSON.stringify(flatActual[path])}`,
      });
    }
  }

  for (const path of Object.keys(flatActual)) {
    if (!(path in flatExpected)) {
      drifts.push({
        path,
        severity: 'extra',
        actual: flatActual[path],
        message: `Key "${path}" is present in deployed config but not in source-of-truth`,
      });
    }
  }

  return {
    serviceName,
    timestamp: new Date().toISOString(),
    hasDrift: drifts.length > 0,
    drifts,
  };
}
