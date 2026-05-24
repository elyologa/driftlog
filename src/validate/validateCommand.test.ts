import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { runValidateCommand } from './validateCommand';
import { saveBaselineStore } from '../baseline/baselineManager';

function makeTempFile(content: string, ext = '.yaml'): string {
  const tmp = path.join(os.tmpdir(), `driftlog-validate-${Date.now()}${ext}`);
  fs.writeFileSync(tmp, content, 'utf-8');
  return tmp;
}

describe('runValidateCommand', () => {
  it('returns 1 when file does not exist', () => {
    const lines: string[] = [];
    const code = runValidateCommand({
      service: 'svc',
      file: '/nonexistent/path.yaml',
      out: (m) => lines.push(m),
    });
    expect(code).toBe(1);
    expect(lines[0]).toMatch(/file not found/);
  });

  it('returns 0 for a valid yaml with no baseline', () => {
    const yaml = `name: svc\nversion: "1.0"\nenvironment: production\n`;
    const file = makeTempFile(yaml);
    const baselineStore = makeTempFile('{}', '.json');
    const lines: string[] = [];
    const code = runValidateCommand({
      service: 'svc',
      file,
      baselineStore,
      out: (m) => lines.push(m),
    });
    expect(code).toBe(0);
    expect(lines.join('\n')).toMatch(/VALID/);
    fs.unlinkSync(file);
    fs.unlinkSync(baselineStore);
  });

  it('outputs json when json flag is set', () => {
    const yaml = `name: svc\nversion: "1.0"\nenvironment: production\n`;
    const file = makeTempFile(yaml);
    const baselineStore = makeTempFile('{}', '.json');
    const lines: string[] = [];
    runValidateCommand({
      service: 'svc',
      file,
      baselineStore,
      json: true,
      out: (m) => lines.push(m),
    });
    const parsed = JSON.parse(lines[0]);
    expect(parsed).toHaveProperty('service', 'svc');
    expect(parsed).toHaveProperty('valid');
    fs.unlinkSync(file);
    fs.unlinkSync(baselineStore);
  });

  it('warns about drift when baseline exists', () => {
    const yaml = `name: svc\nversion: "2.0"\nenvironment: production\n`;
    const file = makeTempFile(yaml);
    const baselineStore = makeTempFile('{}', '.json');
    saveBaselineStore(baselineStore, {
      svc: { service: 'svc', config: { name: 'svc', version: '1.0', environment: 'production' }, capturedAt: new Date().toISOString() },
    });
    const lines: string[] = [];
    runValidateCommand({
      service: 'svc',
      file,
      baselineStore,
      out: (m) => lines.push(m),
    });
    const output = lines.join('\n');
    expect(output).toMatch(/drift/i);
    fs.unlinkSync(file);
    fs.unlinkSync(baselineStore);
  });
});
