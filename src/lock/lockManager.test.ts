import * as fs from "fs";
import * as os from "os";
import * as path from "path";
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
  return path.join(os.tmpdir(), `lock-mgr-test-${Date.now()}.json`);
}

describe("lockManager", () => {
  let storePath: string;

  beforeEach(() => {
    storePath = makeTempFile();
  });

  afterEach(() => {
    if (fs.existsSync(storePath)) fs.unlinkSync(storePath);
  });

  it("loads an empty store when file does not exist", () => {
    const store = loadLockStore(storePath);
    expect(store).toEqual({});
  });

  it("saves and reloads a store", () => {
    const store = { "svc-a": { service: "svc-a", lockedBy: "alice", reason: "test", lockedAt: "2024-01-01T00:00:00.000Z" } };
    saveLockStore(storePath, store);
    const loaded = loadLockStore(storePath);
    expect(loaded["svc-a"].lockedBy).toBe("alice");
  });

  it("locks a service and returns updated store", () => {
    const store = loadLockStore(storePath);
    const updated = lockService(store, "api", "bob", "freeze for release");
    expect(updated["api"]).toBeDefined();
    expect(updated["api"].lockedBy).toBe("bob");
    expect(updated["api"].reason).toBe("freeze for release");
    expect(updated["api"].lockedAt).toBeTruthy();
  });

  it("does not mutate original store on lock", () => {
    const store = loadLockStore(storePath);
    lockService(store, "api", "bob", "test");
    expect(store["api"]).toBeUndefined();
  });

  it("unlocks a service", () => {
    let store = loadLockStore(storePath);
    store = lockService(store, "api", "bob", "test");
    const updated = unlockService(store, "api");
    expect(updated["api"]).toBeUndefined();
  });

  it("returns undefined for getLock on unlocked service", () => {
    const store = loadLockStore(storePath);
    expect(getLock(store, "missing")).toBeUndefined();
  });

  it("returns lock entry for getLock on locked service", () => {
    let store = loadLockStore(storePath);
    store = lockService(store, "svc", "carol", "hotfix");
    const lock = getLock(store, "svc");
    expect(lock?.lockedBy).toBe("carol");
  });

  it("isLocked returns true for locked service", () => {
    let store = loadLockStore(storePath);
    store = lockService(store, "svc", "dave", "reason");
    expect(isLocked(store, "svc")).toBe(true);
  });

  it("isLocked returns false for unlocked service", () => {
    const store = loadLockStore(storePath);
    expect(isLocked(store, "svc")).toBe(false);
  });

  it("listLocks returns all locked services", () => {
    let store = loadLockStore(storePath);
    store = lockService(store, "a", "x", "r1");
    store = lockService(store, "b", "y", "r2");
    const locks = listLocks(store);
    expect(locks).toHaveLength(2);
    const names = locks.map((l) => l.service);
    expect(names).toContain("a");
    expect(names).toContain("b");
  });

  it("listLocks returns empty array when no locks", () => {
    const store = loadLockStore(storePath);
    expect(listLocks(store)).toEqual([]);
  });
});
