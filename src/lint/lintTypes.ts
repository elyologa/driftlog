export type LintSeverity = "error" | "warning" | "info";

export interface LintIssue {
  field: string;
  message: string;
  severity: LintSeverity;
}

export interface LintResult {
  service: string;
  errors: LintIssue[];
  warnings: LintIssue[];
  infos: LintIssue[];
  passed: boolean;
}

export interface LintOptions {
  strict: boolean;
}

export const REQUIRED_FIELDS = ["name", "version", "environment"] as const;
export const RECOMMENDED_FIELDS = ["replicas", "image", "resources"] as const;
