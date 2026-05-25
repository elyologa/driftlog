import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { mergeConfigs, formatMergeResult } from './mergeManager';

function makeTempYaml(data: object): string {
  const file = path.join(os.tmpdir(), `driftlog-merge-${Date.now()}-${Math.random()}.yaml`);
  fs.writeFileSync(file, yaml.dump(data), 'utf-8');
  return file;
}

describe('mergeConfigs', () => {
  it('adds keys from source that are missing in target', () => {
    const src = makeTempYaml({ name: 'svc', version: '2.0', newKey: 'hello' });
    const tgt = makeTempYaml({ name: 'svc', version: '1.0' });
    const result = mergeConfigs({ serviceName: 'svc', sourceFile: src, targetFile: tgt, dryRun: true });
    const added = result.fields.find(f => f.key === 'newKey');
    expect(added?.action).toBe('added');
    expect(result.totalAdded).toBe(1);
  });

  it('does not overwrite existing keys without overwrite flag', () => {
    const src = makeTempYaml({ name: 'svc', version: '2.0' });
    const tgt = makeTempYaml({ name: 'svc', version: '1.0' });
    const result = mergeConfigs({ serviceName: 'svc', sourceFile: src, targetFile: tgt, dryRun: true });
    const skipped = result.fields.find(f => f.key === 'version');
    expect(skipped?.action).toBe('skipped');
  });

  it('overwrites existing keys when overwrite is true', () => {
    const src = makeTempYaml({ name: 'svc', version: '2.0' });
    const tgt = makeTempYaml({ name: 'svc', version: '1.0' });
    const result = mergeConfigs({ serviceName: 'svc', sourceFile: src, targetFile: tgt, overwrite: true, dryRun: true });
    const updated = result.fields.find(f => f.key === 'version');
    expect(updated?.action).toBe('updated');
    expect(result.totalUpdated).toBe(1);
  });

  it('writes merged file when dryRun is false', () => {
    const src = makeTempYaml({ name: 'svc', extra: 'value' });
    const tgt = makeTempYaml({ name: 'svc' });
    mergeConfigs({ serviceName: 'svc', sourceFile: src, targetFile: tgt, dryRun: false });
    const written = yaml.load(fs.readFileSync(tgt, 'utf-8')) as Record<string, unknown>;
    expect(written['extra']).toBe('value');
  });

  it('marks unchanged fields correctly', () => {
    const src = makeTempYaml({ name: 'svc', version: '1.0' });
    const tgt = makeTempYaml({ name: 'svc', version: '1.0' });
    const result = mergeConfigs({ serviceName: 'svc', sourceFile: src, targetFile: tgt, dryRun: true });
    expect(result.totalUnchanged).toBe(2);
  });
});

describe('formatMergeResult', () => {
  it('includes dry run label when applicable', () => {
    const src = makeTempYaml({ name: 'svc', newField: 'x' });
    const tgt = makeTempYaml({ name: 'svc' });
    const result = mergeConfigs({ serviceName: 'svc', sourceFile: src, targetFile: tgt, dryRun: true });
    const text = formatMergeResult(result);
    expect(text).toContain('[DRY RUN]');
    expect(text).toContain('[ADDED]');
    expect(text).toContain('newField');
  });

  it('omits dry run label when not dry run', () => {
    const src = makeTempYaml({ name: 'svc' });
    const tgt = makeTempYaml({ name: 'svc' });
    const result = mergeConfigs({ serviceName: 'svc', sourceFile: src, targetFile: tgt, dryRun: false });
    const text = formatMergeResult(result);
    expect(text).not.toContain('[DRY RUN]');
  });
});
