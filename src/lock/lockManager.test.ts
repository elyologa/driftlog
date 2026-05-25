import fs from "fs";
import os from "os";
import path from "path";
import {
  loadLockStore,
  saveLockStore,
  lockService,
  unlockService,
  getLock,
  listLocks,
  isLocked,
} from "./lockManager";

function makeTempFile(): string {
  return path.join(os.tmpdir(), `lockstore-${Date.now()}.json`);
}

describe("lockManager", () => {
  it("loads empty store when file does not exist", () => {
    const store = loadLockStore("/nonexistent/path.json");
    expect(store.locks).toEqual({});
  });

  it("saves and loads a store", () => {
    const tmp = makeTempFile();
    const store = { locks: {} };
    lockService(store, "api", "alice", "deploy freeze");
    saveLockStore(tmp, store);
    const loaded = loadLockStore(tmp);
    expect(loaded.locks["api"]).toBeDefined();
    expect(loaded.locks["api"].lockedBy).toBe("alice");
    fs.unlinkSync(tmp);
  });

  it("locks a service successfully", () => {
    const store = { locks: {} };
    const result = lockService(store, "api", "alice", "maintenance");
    expect(result.success).toBe(true);
    expect(store.locks["api"]).toBeDefined();
  });

  it("fails to lock an already-locked service", () => {
    const store = { locks: {} };
    lockService(store, "api", "alice");
    const result = lockService(store, "api", "bob");
    expect(result.success).toBe(false);
    expect(result.message).toContain("already locked");
  });

  it("unlocks a service", () => {
    const store = { locks: {} };
    lockService(store, "api", "alice");
    const result = unlockService(store, "api", "alice");
    expect(result.success).toBe(true);
    expect(store.locks["api"]).toBeUndefined();
  });

  it("returns failure when unlocking a non-locked service", () => {
    const store = { locks: {} };
    const result = unlockService(store, "api", "alice");
    expect(result.success).toBe(false);
  });

  it("getLock returns the lock or undefined", () => {
    const store = { locks: {} };
    lockService(store, "svc", "bob");
    expect(getLock(store, "svc")).toBeDefined();
    expect(getLock(store, "other")).toBeUndefined();
  });

  it("listLocks returns all locks", () => {
    const store = { locks: {} };
    lockService(store, "a", "alice");
    lockService(store, "b", "bob");
    expect(listLocks(store)).toHaveLength(2);
  });

  it("isLocked returns false for expired locks", () => {
    const store = { locks: {} };
    lockService(store, "svc", "alice", undefined, new Date(Date.now() - 1000).toISOString());
    expect(isLocked(store, "svc")).toBe(false);
  });

  it("isLocked returns true for active locks", () => {
    const store = { locks: {} };
    lockService(store, "svc", "alice");
    expect(isLocked(store, "svc")).toBe(true);
  });
});
