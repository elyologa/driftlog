import { parseYamlFile } from '../parser/yamlParser';
import { flattenObject } from '../drift/detector';
import { MergeOptions, MergeResult, MergeFieldResult } from './mergeTypes';
import * as fs from 'fs';
import * as yaml from 'js-yaml';

export function mergeConfigs(options: MergeOptions): MergeResult {
  const source = parseYamlFile(options.sourceFile);
  const target = parseYamlFile(options.targetFile);

  const sourceFlat = flattenObject(source as Record<string, unknown>);
  const targetFlat = flattenObject(target as Record<string, unknown>);

  const fields: MergeFieldResult[] = [];
  const merged: Record<string, unknown> = { ...(target as Record<string, unknown>) };

  for (const [key, sourceValue] of Object.entries(sourceFlat)) {
    const targetValue = targetFlat[key];
    if (!(key in targetFlat)) {
      fields.push({ key, sourceValue, targetValue: undefined, action: 'added' });
      setNestedValue(merged, key, sourceValue);
    } else if (options.overwrite && sourceValue !== targetValue) {
      fields.push({ key, sourceValue, targetValue, action: 'updated' });
      setNestedValue(merged, key, sourceValue);
    } else if (sourceValue === targetValue) {
      fields.push({ key, sourceValue, targetValue, action: 'unchanged' });
    } else {
      fields.push({ key, sourceValue, targetValue, action: 'skipped' });
    }
  }

  if (!options.dryRun) {
    fs.writeFileSync(options.targetFile, yaml.dump(merged), 'utf-8');
  }

  return {
    serviceName: options.serviceName,
    sourceFile: options.sourceFile,
    targetFile: options.targetFile,
    fields,
    totalAdded: fields.filter(f => f.action === 'added').length,
    totalUpdated: fields.filter(f => f.action === 'updated').length,
    totalUnchanged: fields.filter(f => f.action === 'unchanged').length,
    dryRun: options.dryRun ?? false,
  };
}

function setNestedValue(obj: Record<string, unknown>, dotKey: string, value: unknown): void {
  const parts = dotKey.split('.');
  let current = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (typeof current[parts[i]] !== 'object' || current[parts[i]] === null) {
      current[parts[i]] = {};
    }
    current = current[parts[i]] as Record<string, unknown>;
  }
  current[parts[parts.length - 1]] = value;
}

export function formatMergeResult(result: MergeResult): string {
  const lines: string[] = [
    `Merge result for "${result.serviceName}"${result.dryRun ? ' [DRY RUN]' : ''}:`,
    `  Source: ${result.sourceFile}`,
    `  Target: ${result.targetFile}`,
    `  Added: ${result.totalAdded}, Updated: ${result.totalUpdated}, Unchanged: ${result.totalUnchanged}`,
    '',
  ];
  for (const f of result.fields) {
    if (f.action !== 'unchanged') {
      lines.push(`  [${f.action.toUpperCase()}] ${f.key}: ${JSON.stringify(f.sourceValue)}`);
    }
  }
  return lines.join('\n');
}
