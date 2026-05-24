export interface AuditEntry {
  service: string;
  action: string;
  timestamp: string;
  details: string;
}

export interface AuditStore {
  entries: AuditEntry[];
}

export type AuditAction =
  | "snapshot"
  | "drift"
  | "baseline-capture"
  | "baseline-remove"
  | "ignore-add"
  | "ignore-remove"
  | "notify-set"
  | "schedule-upsert"
  | "schedule-remove"
  | "export"
  | "history-prune";
