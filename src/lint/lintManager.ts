import { LintResult, LintViolation, BUILT_IN_RULES } from './lintTypes';

export function lintServiceConfig(service: string, config: Record<string, unknown>): LintResult {
  const violations: LintViolation[] = [];

  // required-name
  if (!config['name'] || typeof config['name'] !== 'string' || config['name'].trim() === '') {
    violations.push({
      rule: 'required-name',
      field: 'name',
      message: 'Missing or empty "name" field',
      severity: 'error',
    });
  }

  // required-version
  if (config['version'] === undefined || config['version'] === null) {
    violations.push({
      rule: 'required-version',
      field: 'version',
      message: 'Missing "version" field',
      severity: 'error',
    });
  }

  // required-env
  const env = config['env'] ?? config['environment'];
  const envEmpty =
    !env ||
    (typeof env === 'object' && !Array.isArray(env) && Object.keys(env as object).length === 0) ||
    (Array.isArray(env) && (env as unknown[]).length === 0);
  if (envEmpty) {
    violations.push({
      rule: 'required-env',
      field: 'env',
      message: 'No environment variables defined',
      severity: 'warning',
    });
  }

  // no-latest-tag
  const image = config['image'];
  if (typeof image === 'string' && image.endsWith(':latest')) {
    violations.push({
      rule: 'no-latest-tag',
      field: 'image',
      message: `Image tag "latest" is not recommended: ${image}`,
      severity: 'warning',
    });
  }

  // has-replicas
  if (config['replicas'] === undefined) {
    violations.push({
      rule: 'has-replicas',
      field: 'replicas',
      message: 'Replica count not specified',
      severity: 'info',
    });
  }

  const hasErrors = violations.some((v) => v.severity === 'error');
  return { service, violations, passed: !hasErrors };
}

export function formatLintResult(result: LintResult): string {
  const lines: string[] = [];
  lines.push(`Lint results for "${result.service}": ${result.passed ? 'PASSED' : 'FAILED'}`);
  if (result.violations.length === 0) {
    lines.push('  No violations found.');
  } else {
    for (const v of result.violations) {
      lines.push(`  [${v.severity.toUpperCase()}] (${v.rule}) ${v.field}: ${v.message}`);
    }
  }
  return lines.join('\n');
}
