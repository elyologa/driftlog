import * as fs from 'fs';
import * as path from 'path';
import { validateService, formatValidationResult } from './validateManager';

export interface ValidateCommandOptions {
  service: string;
  file: string;
  snapshotStore?: string;
  baselineStore?: string;
  json?: boolean;
  out?: (msg: string) => void;
}

export function runValidateCommand(opts: ValidateCommandOptions): number {
  const out = opts.out ?? console.log;
  const snapshotStore = opts.snapshotStore ?? 'snapshots.json';
  const baselineStore = opts.baselineStore ?? 'baselines.json';

  if (!fs.existsSync(opts.file)) {
    out(`Error: file not found: ${opts.file}`);
    return 1;
  }

  const result = validateService(
    opts.service,
    path.resolve(opts.file),
    snapshotStore,
    baselineStore
  );

  if (opts.json) {
    out(JSON.stringify(result, null, 2));
  } else {
    out(formatValidationResult(result));
  }

  return result.valid ? 0 : 1;
}
