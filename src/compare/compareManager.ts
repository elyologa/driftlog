import { CompareResult, FieldDiff } from './compareTypes';
import { getSnapshot } from '../snapshot/snapshotManager';
import { flattenObject } from '../drift/detector';

export function compareSnapshots(
  snapshotFile: string,
  serviceA: string,
  serviceB: string
): CompareResult {
  const snapA = getSnapshot(snapshotFile, serviceA);
  const snapB = getSnapshot(snapshotFile, serviceB);

  if (!snapA) throw new Error(`No snapshot found for service: ${serviceA}`);
  if (!snapB) throw new Error(`No snapshot found for service: ${serviceB}`);

  const flatA = flattenObject(snapA.config);
  const flatB = flattenObject(snapB.config);

  const keysA = new Set(Object.keys(flatA));
  const keysB = new Set(Object.keys(flatB));
  const allKeys = new Set([...keysA, ...keysB]);

  const onlyInA: string[] = [];
  const onlyInB: string[] = [];
  const different: FieldDiff[] = [];
  const identical: string[] = [];

  for (const key of allKeys) {
    const inA = keysA.has(key);
    const inB = keysB.has(key);

    if (inA && !inB) {
      onlyInA.push(key);
    } else if (!inA && inB) {
      onlyInB.push(key);
    } else if (String(flatA[key]) !== String(flatB[key])) {
      different.push({ key, valueA: flatA[key], valueB: flatB[key] });
    } else {
      identical.push(key);
    }
  }

  return { serviceA, serviceB, onlyInA, onlyInB, different, identical };
}

export function formatCompareResult(result: CompareResult): string {
  const lines: string[] = [];
  lines.push(`Comparing "${result.serviceA}" vs "${result.serviceB}"`);
  lines.push(`${'='.repeat(50)}`);

  if (result.different.length > 0) {
    lines.push(`\nDifferent values (${result.different.length}):`);
    for (const d of result.different) {
      lines.push(`  ~ ${d.key}`);
      lines.push(`      [${result.serviceA}] ${d.valueA}`);
      lines.push(`      [${result.serviceB}] ${d.valueB}`);
    }
  }

  if (result.onlyInA.length > 0) {
    lines.push(`\nOnly in "${result.serviceA}" (${result.onlyInA.length}):`);
    for (const k of result.onlyInA) lines.push(`  + ${k}`);
  }

  if (result.onlyInB.length > 0) {
    lines.push(`\nOnly in "${result.serviceB}" (${result.onlyInB.length}):`);
    for (const k of result.onlyInB) lines.push(`  + ${k}`);
  }

  lines.push(`\nIdentical fields: ${result.identical.length}`);
  return lines.join('\n');
}
