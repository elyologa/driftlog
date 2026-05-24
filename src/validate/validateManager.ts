import { parseYamlFile } from '../parser/yamlParser';
import { lintServiceConfig } from '../lint/lintManager';
import { getBaseline } from '../baseline/baselineManager';
import { detectDrift } from '../drift/detector';

export interface ValidationResult {
  service: string;
  file: string;
  valid: boolean;
  errors: string[];
  warnings: string[];
  driftCount: number;
}

export function validateService(
  service: string,
  filePath: string,
  snapshotStorePath: string,
  baselineStorePath: string
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  let driftCount = 0;

  let config: Record<string, unknown>;
  try {
    config = parseYamlFile(filePath) as Record<string, unknown>;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { service, file: filePath, valid: false, errors: [`Parse error: ${message}`], warnings, driftCount };
  }

  const lintResult = lintServiceConfig(config);
  for (const issue of lintResult.issues) {
    if (issue.severity === 'error') {
      errors.push(`[lint] ${issue.field}: ${issue.message}`);
    } else {
      warnings.push(`[lint] ${issue.field}: ${issue.message}`);
    }
  }

  const baseline = getBaseline(baselineStorePath, service);
  if (baseline) {
    const drifts = detectDrift(baseline.config as Record<string, unknown>, config);
    driftCount = drifts.length;
    if (driftCount > 0) {
      warnings.push(`${driftCount} drift(s) detected against baseline`);
    }
  } else {
    warnings.push('No baseline found; skipping drift check');
  }

  return {
    service,
    file: filePath,
    valid: errors.length === 0,
    errors,
    warnings,
    driftCount,
  };
}

export function formatValidationResult(result: ValidationResult): string {
  const lines: string[] = [];
  const status = result.valid ? '✅ VALID' : '❌ INVALID';
  lines.push(`Service: ${result.service} — ${status}`);
  lines.push(`File: ${result.file}`);
  if (result.errors.length > 0) {
    lines.push('Errors:');
    result.errors.forEach(e => lines.push(`  - ${e}`));
  }
  if (result.warnings.length > 0) {
    lines.push('Warnings:');
    result.warnings.forEach(w => lines.push(`  - ${w}`));
  }
  if (result.driftCount > 0) {
    lines.push(`Drift count: ${result.driftCount}`);
  }
  return lines.join('\n');
}
