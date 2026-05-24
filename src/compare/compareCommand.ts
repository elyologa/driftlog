import { CompareOptions } from './compareTypes';
import { compareSnapshots, formatCompareResult } from './compareManager';

export function runCompareCommand(
  options: CompareOptions,
  log: (msg: string) => void = console.log
): void {
  const { serviceA, serviceB, snapshotFile } = options;

  if (!serviceA || !serviceB) {
    log('Error: --serviceA and --serviceB are required.');
    return;
  }

  let result;
  try {
    result = compareSnapshots(snapshotFile, serviceA, serviceB);
  } catch (err: unknown) {
    log(`Error: ${err instanceof Error ? err.message : String(err)}`);
    return;
  }

  const summary = formatCompareResult(result);
  log(summary);

  const totalDiffs = result.different.length + result.onlyInA.length + result.onlyInB.length;
  if (totalDiffs === 0) {
    log('\nResult: Services are identical.');
  } else {
    log(`\nResult: ${totalDiffs} difference(s) found.`);
  }
}
