import fs from 'fs';
import { randomUUID } from 'crypto';
import { AuditEntry, AuditStore, AuditAction, MAX_AUDIT_ENTRIES } from './auditTypes';

export function loadAuditStore(filePath: string): AuditStore {
  if (!fs.existsSync(filePath)) {
    return { entries: [] };
  }
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw) as AuditStore;
}

export function saveAuditStore(filePath: string, store: AuditStore): void {
  fs.writeFileSync(filePath, JSON.stringify(store, null, 2), 'utf-8');
}

export function appendAuditEntry(
  filePath: string,
  action: AuditAction,
  service: string,
  details: string,
  user?: string
): AuditEntry {
  const store = loadAuditStore(filePath);
  const entry: AuditEntry = {
    id: randomUUID(),
    timestamp: new Date().toISOString(),
    action,
    service,
    details,
    user,
  };
  store.entries.push(entry);
  if (store.entries.length > MAX_AUDIT_ENTRIES) {
    store.entries = store.entries.slice(store.entries.length - MAX_AUDIT_ENTRIES);
  }
  saveAuditStore(filePath, store);
  return entry;
}

export function getAuditLog(
  filePath: string,
  service?: string,
  limit = 50
): AuditEntry[] {
  const store = loadAuditStore(filePath);
  const filtered = service
    ? store.entries.filter((e) => e.service === service)
    : store.entries;
  return filtered.slice(-limit).reverse();
}

export function clearAuditLog(filePath: string): void {
  saveAuditStore(filePath, { entries: [] });
}
