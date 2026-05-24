export interface LintRule {
  key: string;
  description: string;
  severity: 'error' | 'warning' | 'info';
}

export interface LintViolation {
  rule: string;
  field: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

export interface LintResult {
  service: string;
  violations: LintViolation[];
  passed: boolean;
}

export const BUILT_IN_RULES: LintRule[] = [
  { key: 'required-name', description: 'Service must have a name field', severity: 'error' },
  { key: 'required-version', description: 'Service must have a version field', severity: 'error' },
  { key: 'required-env', description: 'Service must define at least one environment variable', severity: 'warning' },
  { key: 'no-latest-tag', description: 'Image tag should not be "latest"', severity: 'warning' },
  { key: 'has-replicas', description: 'Service should specify replica count', severity: 'info' },
];
