import * as fs from 'fs';
import * as path from 'path';
import { parseYamlFile } from '../parser/yamlParser';
import { detectDrift } from '../drift/detector';
import { ExportOptions, ExportResult } from './exportTypes';
import { formatExport } from './exportFormatter';

export async function runExportCommand(
  yamlPath: string,
  liveConfig: Record<string, unknown>,
  options: ExportOptions
): Promise<ExportResult> {
  const parsed = parseYamlFile(yamlPath);
  if (!parsed.success || !parsed.config) {
    throw new Error(`Failed to parse YAML at ${yamlPath}: ${parsed.errors?.join(', ')}`);
  }

  const driftResults = detectDrift(parsed.config as Record<string, unknown>, liveConfig);
  const serviceName = options.serviceName ?? path.basename(yamlPath, path.extname(yamlPath));
  const timestamp = options.includeTimestamp ? new Date().toISOString() : undefined;

  const content = formatExport(options.format, serviceName, driftResults, timestamp);

  let writtenToDisk = false;
  if (options.outputPath) {
    fs.mkdirSync(path.dirname(options.outputPath), { recursive: true });
    fs.writeFileSync(options.outputPath, content, 'utf-8');
    writtenToDisk = true;
  }

  return {
    format: options.format,
    content,
    outputPath: options.outputPath,
    writtenToDisk,
  };
}
