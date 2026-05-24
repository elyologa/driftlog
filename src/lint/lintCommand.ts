import * as fs from "fs";
import * as path from "path";
import { parseYamlFile } from "../parser/yamlParser";
import { lintServiceConfig, formatLintResult } from "./lintManager";
import { LintResult } from "./lintTypes";

export interface LintCommandOptions {
  file: string;
  format?: "text" | "json";
  strict?: boolean;
}

export async function runLintCommand(
  options: LintCommandOptions,
  output: (msg: string) => void = console.log
): Promise<number> {
  const filePath = path.resolve(options.file);

  if (!fs.existsSync(filePath)) {
    output(`Error: File not found: ${filePath}`);
    return 1;
  }

  let config: unknown;
  try {
    config = parseYamlFile(filePath);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    output(`Error: Failed to parse YAML: ${message}`);
    return 1;
  }

  const result: LintResult = lintServiceConfig(config, { strict: options.strict ?? false });

  if (options.format === "json") {
    output(JSON.stringify(result, null, 2));
  } else {
    output(formatLintResult(result));
  }

  return result.errors.length > 0 ? 2 : result.warnings.length > 0 ? 0 : 0;
}
