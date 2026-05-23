import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

export interface ServiceConfig {
  name: string;
  version: string;
  image: string;
  replicas?: number;
  env?: Record<string, string>;
  ports?: number[];
  resources?: {
    cpu?: string;
    memory?: string;
  };
}

export interface ParseResult {
  success: boolean;
  config?: ServiceConfig;
  error?: string;
  filePath: string;
}

/**
 * Validates that a parsed object contains all required ServiceConfig fields.
 * Returns an error message string if validation fails, or null if valid.
 */
function validateServiceConfig(parsed: ServiceConfig): string | null {
  if (!parsed.name || !parsed.version || !parsed.image) {
    const missing = (['name', 'version', 'image'] as const)
      .filter((field) => !parsed[field])
      .join(', ');
    return `Missing required fields: ${missing}`;
  }
  return null;
}

export function parseYamlFile(filePath: string): ParseResult {
  const resolvedPath = path.resolve(filePath);

  if (!fs.existsSync(resolvedPath)) {
    return {
      success: false,
      error: `File not found: ${resolvedPath}`,
      filePath: resolvedPath,
    };
  }

  try {
    const raw = fs.readFileSync(resolvedPath, 'utf-8');
    const parsed = yaml.load(raw) as ServiceConfig;

    if (!parsed || typeof parsed !== 'object') {
      return {
        success: false,
        error: 'YAML content is empty or not an object',
        filePath: resolvedPath,
      };
    }

    const validationError = validateServiceConfig(parsed);
    if (validationError) {
      return { success: false, error: validationError, filePath: resolvedPath };
    }

    return {
      success: true,
      config: parsed,
      filePath: resolvedPath,
    };
  } catch (err) {
    return {
      success: false,
      error: `Failed to parse YAML: ${(err as Error).message}`,
      filePath: resolvedPath,
    };
  }
}

export function parseYamlString(content: string, label = '<inline>'): ParseResult {
  try {
    const parsed = yaml.load(content) as ServiceConfig;

    if (!parsed || typeof parsed !== 'object') {
      return { success: false, error: 'YAML content is empty or not an object', filePath: label };
    }

    const validationError = validateServiceConfig(parsed);
    if (validationError) {
      return { success: false, error: validationError, filePath: label };
    }

    return { success: true, config: parsed, filePath: label };
  } catch (err) {
    return { success: false, error: `Failed to parse YAML: ${(err as Error).message}`, filePath: label };
  }
}
