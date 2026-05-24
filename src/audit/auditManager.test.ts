import fs from 'fs';
import os from 'os';
import path from 'path';
import {
  loadAuditStore,
  saveAuditStore,
  appendAuditEntry,
  getAuditLog,
  clearAuditLog,
} from './auditManager';
import { MAX_AUDIT_ENTRIES } from './auditTypes';

function makeTempFile(): string {
  return path.join(os.tmpdir(), `audit-test-${Date.now()}-${Math.random()}.json`);
}

describe('auditManager', () => {
  it('returns empty store when file does not exist', () => {
    const store = loadAuditStore('/nonexistent/path/audit.json');
    expect(store.entries).toEqual([]);
  });

  it('saves and loads a store', () => {
    const file = makeTempFile();
    saveAuditStore(file, { entries: [] });
    const store = loadAuditStore(file);
    expect(store.entries).toEqual([]);
    fs.unlinkSync(file);
  });

  it('appends an audit entry', () => {
    const file = makeTempFile();
    const entry = appendAuditEntry(file, 'snapshot', 'api', 'Snapshot taken', 'alice');
    expect(entry.action).toBe('snapshot');
    expect(entry.service).toBe('api');
    expect(entry.details).toBe('Snapshot taken');
    expect(entry.user).toBe('alice');
    expect(entry.id).toBeTruthy();
    expect(entry.timestamp).toBeTruthy();
    const store = loadAuditStore(file);
    expect(store.entries).toHaveLength(1);
    fs.unlinkSync(file);
  });

  it('prunes entries beyond MAX_AUDIT_ENTRIES', () => {
    const file = makeTempFile();
    for (let i = 0; i < MAX_AUDIT_ENTRIES + 10; i++) {
      appendAuditEntry(file, 'drift-check', `svc-${i}`, 'check');
    }
    const store = loadAuditStore(file);
    expect(store.entries.length).toBe(MAX_AUDIT_ENTRIES);
    fs.unlinkSync(file);
  });

  it('filters by service in getAuditLog', () => {
    const file = makeTempFile();
    appendAuditEntry(file, 'snapshot', 'api', 'snap');
    appendAuditEntry(file, 'snapshot', 'worker', 'snap');
    appendAuditEntry(file, 'drift-check', 'api', 'drift');
    const entries = getAuditLog(file, 'api');
    expect(entries.every((e) => e.service === 'api')).toBe(true);
    expect(entries).toHaveLength(2);
    fs.unlinkSync(file);
  });

  it('respects limit in getAuditLog', () => {
    const file = makeTempFile();
    for (let i = 0; i < 10; i++) {
      appendAuditEntry(file, 'snapshot', 'svc', `snap ${i}`);
    }
    const entries = getAuditLog(file, undefined, 3);
    expect(entries).toHaveLength(3);
    fs.unlinkSync(file);
  });

  it('clears the audit log', () => {
    const file = makeTempFile();
    appendAuditEntry(file, 'snapshot', 'api', 'snap');
    clearAuditLog(file);
    const store = loadAuditStore(file);
    expect(store.entries).toHaveLength(0);
    fs.unlinkSync(file);
  });
});
