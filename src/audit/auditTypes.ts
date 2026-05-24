export type AuditAction =
  | 'snapshot'
  | 'drift-check'
  | 'baseline-capture'
  | 'baseline-remove'
  | 'ignore-add'
  | 'ignore-remove'
  | 'notify-set'
  | 'schedule-set'
  | 'schedule-remove';

export interface AuditEntry {
  id: string;
  timestamp: string;
  action: AuditAction;
  service: string;
  details: string;
  user?: string;
}

export interface AuditStore {
  entries: AuditEntry[];
}

export const MAX_AUDIT_ENTRIES = 500;
