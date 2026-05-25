import * as fs from "fs";
import {
  loadLockStore,
  saveLockStore,
  lockService,
  unlockService,
  getLock,
  listLocks,
  isLocked,
} from "./lockManager";

export function runLockCommand(
  args: string[],
  storePath: string,
  out: (msg: string) => void = console.log
): void {
  const [subcommand, serviceName, ...rest] = args;

  if (!subcommand) {
    out("Usage: lock <add|remove|status|list> [service] [reason]");
    return;
  }

  const store = loadLockStore(storePath);

  switch (subcommand) {
    case "add": {
      if (!serviceName) {
        out("Error: service name required");
        return;
      }
      const reason = rest.join(" ") || "No reason provided";
      const lockedBy = process.env.USER || "unknown";
      const updated = lockService(store, serviceName, lockedBy, reason);
      saveLockStore(storePath, updated);
      out(`Locked service "${serviceName}" by ${lockedBy}: ${reason}`);
      break;
    }
    case "remove": {
      if (!serviceName) {
        out("Error: service name required");
        return;
      }
      if (!isLocked(store, serviceName)) {
        out(`Service "${serviceName}" is not locked`);
        return;
      }
      const updated = unlockService(store, serviceName);
      saveLockStore(storePath, updated);
      out(`Unlocked service "${serviceName}"`);
      break;
    }
    case "status": {
      if (!serviceName) {
        out("Error: service name required");
        return;
      }
      const lock = getLock(store, serviceName);
      if (!lock) {
        out(`Service "${serviceName}" is not locked`);
      } else {
        out(`Service "${serviceName}" is locked`);
        out(`  Locked by: ${lock.lockedBy}`);
        out(`  Reason:    ${lock.reason}`);
        out(`  At:        ${lock.lockedAt}`);
      }
      break;
    }
    case "list": {
      const locks = listLocks(store);
      if (locks.length === 0) {
        out("No services are currently locked");
      } else {
        out(`Locked services (${locks.length}):`);
        for (const lock of locks) {
          out(`  ${lock.service} — ${lock.lockedBy}: ${lock.reason} (${lock.lockedAt})`);
        }
      }
      break;
    }
    default:
      out(`Unknown subcommand: ${subcommand}`);
  }
}
