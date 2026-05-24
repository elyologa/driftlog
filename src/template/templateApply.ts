import { Template } from "./templateTypes";

export interface ApplyResult {
  serviceName: string;
  applied: Record<string, string>;
  overrides: Record<string, string>;
  merged: Record<string, string>;
}

/**
 * Merges a template's fields with service-specific overrides.
 * Service overrides take precedence over template defaults.
 */
export function applyTemplate(
  template: Template,
  serviceName: string,
  overrides: Record<string, string> = {}
): ApplyResult {
  const merged: Record<string, string> = {
    ...template.fields,
    ...overrides,
  };

  return {
    serviceName,
    applied: { ...template.fields },
    overrides: { ...overrides },
    merged,
  };
}

/**
 * Formats an ApplyResult as a human-readable string.
 */
export function formatApplyResult(result: ApplyResult): string {
  const lines: string[] = [
    `Service: ${result.serviceName}`,
    `Template fields applied: ${Object.keys(result.applied).length}`,
    `Overrides: ${Object.keys(result.overrides).length}`,
    `Merged config:`,
  ];
  for (const [k, v] of Object.entries(result.merged)) {
    const source = result.overrides[k] !== undefined ? "(override)" : "(template)";
    lines.push(`  ${k}: ${v}  ${source}`);
  }
  return lines.join("\n");
}
