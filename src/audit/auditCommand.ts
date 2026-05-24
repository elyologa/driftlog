import { appendAuditEntry, clearAuditLog, getAuditLog, loadAuditStore } from "./auditManager";
import { AuditEntry } from "./auditTypes";

export interface AuditCommandOptions {
  auditFile: string;
  action: "list" | "clear" | "append";
  service?: string;
  entry?: Omit<AuditEntry, "timestamp">;
}

export function formatEntry(entry: AuditEntry): string {
  return `[${entry.timestamp}] service=${entry.service} action=${entry.action} — ${entry.details}`;
}

export function runAuditCommand(opts: AuditCommandOptions): void {
  const { auditFile, action, service } = opts;

  if (action === "list") {
    const entries = getAuditLog(auditFile, service);
    if (entries.length === 0) {
      console.log("No audit entries found.");
      return;
    }
    entries.forEach((entry) => console.log(formatEntry(entry)));
    return;
  }

  if (action === "clear") {
    clearAuditLog(auditFile);
    console.log("Audit log cleared.");
    return;
  }

  if (action === "append") {
    if (!opts.entry) {
      console.error("No entry provided for append action.");
      return;
    }
    const full: AuditEntry = { ...opts.entry, timestamp: new Date().toISOString() };
    appendAuditEntry(auditFile, full);
    console.log(`Audit entry appended for service "${full.service}".`);
    return;
  }

  console.warn(`Unknown audit action: "${action}".`);
}
