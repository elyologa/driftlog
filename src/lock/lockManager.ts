import fs from "fs";
import { LockStore, ServiceLock, LockResult } from "./lockTypes";

const EMPTY_STORE: LockStore = { locks: {} };

export function loadLockStore(storePath: string): LockStore {
  if (!fs.existsSync(storePath)) return { ...EMPTY_STORE, locks: {} };
  const raw = fs.readFileSync(storePath, "utf-8");
  return JSON.parse(raw) as LockStore;
}

export function saveLockStore(storePath: string, store: LockStore): void {
  fs.writeFileSync(storePath, JSON.stringify(store, null, 2), "utf-8");
}

export function lockService(
  store: LockStore,
  service: string,
  lockedBy: string,
  reason?: string,
  expiresAt?: string
): LockResult {
  if (store.locks[service]) {
    const existing = store.locks[service];
    return {
      success: false,
      service,
      message: `Service "${service}" is already locked by "${existing.lockedBy}" since ${existing.lockedAt}.`,
      lock: existing,
    };
  }
  const lock: ServiceLock = {
    service,
    lockedBy,
    lockedAt: new Date().toISOString(),
    reason,
    expiresAt,
  };
  store.locks[service] = lock;
  return { success: true, service, message: `Service "${service}" locked by "${lockedBy}".`, lock };
}

export function unlockService(
  store: LockStore,
  service: string,
  requestedBy: string
): LockResult {
  const lock = store.locks[service];
  if (!lock) {
    return { success: false, service, message: `Service "${service}" is not locked.` };
  }
  delete store.locks[service];
  return { success: true, service, message: `Service "${service}" unlocked by "${requestedBy}".` };
}

export function getLock(store: LockStore, service: string): ServiceLock | undefined {
  return store.locks[service];
}

export function listLocks(store: LockStore): ServiceLock[] {
  return Object.values(store.locks);
}

export function isLocked(store: LockStore, service: string): boolean {
  const lock = store.locks[service];
  if (!lock) return false;
  if (lock.expiresAt && new Date(lock.expiresAt) < new Date()) {
    delete store.locks[service];
    return false;
  }
  return true;
}
