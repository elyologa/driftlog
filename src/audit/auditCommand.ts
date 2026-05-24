import path from 'path';
import { getAuditLog, clearAuditLog } from './auditManager';
import { AuditEntry } from './auditTypes';

const DEFAULT_AUDIT_FILE = path.resolve(process.cwd(), '.driftlog-audit.json');

function formatEntry(entry: AuditEntry): string {
  const user = entry.user ? ` [${entry.user}]` : '';
  return `${entry.timestamp}${user} | ${entry.action} | ${entry.service} | ${entry.details}`;
}

export function runAuditCommand(
  args: string[],
  auditFile = DEFAULT_AUDIT_FILE
): void {
  const sub = args[0];

  if (sub === 'clear') {
    clearAuditLog(auditFile);
    console.log('Audit log cleared.');
    return;
  }

  // Default: list
  const serviceFlag = args.indexOf('--service');
  const service = serviceFlag !== -1 ? args[serviceFlag + 1] : undefined;

  const limitFlag = args.indexOf('--limit');
  const limit = limitFlag !== -1 ? parseInt(args[limitFlag + 1], 10) : 50;

  const entries = getAuditLog(auditFile, service, limit);

  if (entries.length === 0) {
    console.log('No audit entries found.');
    return;
  }

  console.log(`Audit log (${entries.length} entries):`);
  entries.forEach((e) => console.log(formatEntry(e)));
}
