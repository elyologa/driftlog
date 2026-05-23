import { parseYamlFile } from '../parser/yamlParser';
import { detectDrift } from './detector';
import { formatReport, formatReportJson } from './reporter';
import { getSnapshot } from '../snapshot/snapshotManager';
import { DriftResult } from './types';

export interface DriftCommandOptions {
  yamlPath: string;
  serviceName: string;
  snapshotStorePath: string;
  format?: 'text' | 'json';
  outputFn?: (msg: string) => void;
}

export async function runDriftCommand(options: DriftCommandOptions): Promise<DriftResult[]> {
  const {
    yamlPath,
    serviceName,
    snapshotStorePath,
    format = 'text',
    outputFn = console.log,
  } = options;

  const serviceConfig = await parseYamlFile(yamlPath);
  const snapshot = await getSnapshot(snapshotStorePath, serviceName);

  if (!snapshot) {
    throw new Error(
      `No snapshot found for service "${serviceName}". Run the snapshot command first.`
    );
  }

  const driftResults = detectDrift(snapshot.config, serviceConfig);

  if (driftResults.length === 0) {
    outputFn(`No drift detected for service "${serviceName}".`);
    return driftResults;
  }

  if (format === 'json') {
    outputFn(formatReportJson(serviceName, driftResults));
  } else {
    outputFn(formatReport(serviceName, driftResults));
  }

  return driftResults;
}
