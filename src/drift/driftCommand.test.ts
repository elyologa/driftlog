import { runDriftCommand } from './driftCommand';
import * as yamlParser from '../parser/yamlParser';
import * as snapshotManager from '../snapshot/snapshotManager';
import * as detector from './detector';

jest.mock('../parser/yamlParser');
jest.mock('../snapshot/snapshotManager');
jest.mock('./detector');

const mockParseYamlFile = yamlParser.parseYamlFile as jest.MockedFunction<typeof yamlParser.parseYamlFile>;
const mockGetSnapshot = snapshotManager.getSnapshot as jest.MockedFunction<typeof snapshotManager.getSnapshot>;
const mockDetectDrift = detector.detectDrift as jest.MockedFunction<typeof detector.detectDrift>;

describe('runDriftCommand', () => {
  const baseOptions = {
    yamlPath: 'service.yaml',
    serviceName: 'my-service',
    snapshotStorePath: 'snapshots.json',
  };

  const fakeConfig = { port: 8080, env: 'production' };
  const fakeSnapshot = { serviceName: 'my-service', capturedAt: '2024-01-01T00:00:00Z', config: { port: 8080, env: 'staging' } };

  beforeEach(() => {
    jest.clearAllMocks();
    mockParseYamlFile.mockResolvedValue(fakeConfig);
    mockGetSnapshot.mockResolvedValue(fakeSnapshot);
  });

  it('returns empty array and logs no-drift message when configs match', async () => {
    mockDetectDrift.mockReturnValue([]);
    const output: string[] = [];
    const results = await runDriftCommand({ ...baseOptions, outputFn: (m) => output.push(m) });
    expect(results).toHaveLength(0);
    expect(output[0]).toContain('No drift detected');
  });

  it('returns drift results and logs text report by default', async () => {
    const drifts = [{ key: 'env', snapshotValue: 'staging', currentValue: 'production' }];
    mockDetectDrift.mockReturnValue(drifts);
    const output: string[] = [];
    const results = await runDriftCommand({ ...baseOptions, outputFn: (m) => output.push(m) });
    expect(results).toHaveLength(1);
    expect(output[0]).toContain('my-service');
  });

  it('outputs JSON when format is json', async () => {
    const drifts = [{ key: 'port', snapshotValue: 3000, currentValue: 8080 }];
    mockDetectDrift.mockReturnValue(drifts);
    const output: string[] = [];
    await runDriftCommand({ ...baseOptions, format: 'json', outputFn: (m) => output.push(m) });
    const parsed = JSON.parse(output[0]);
    expect(parsed).toHaveProperty('service', 'my-service');
  });

  it('throws when no snapshot is found', async () => {
    mockGetSnapshot.mockResolvedValue(null);
    await expect(runDriftCommand(baseOptions)).rejects.toThrow('No snapshot found');
  });
});
