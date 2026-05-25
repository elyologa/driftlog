import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import {
  loadPromoteStore,
  savePromoteStore,
  promoteService,
  getPromotionsForService,
  getLatestPromotion,
  formatPromoteResult,
} from "./promoteManager";

function makeTempFile(): string {
  return path.join(os.tmpdir(), `promote-test-${Date.now()}.json`);
}

describe("promoteManager", () => {
  it("loadPromoteStore returns empty store if file missing", () => {
    const store = loadPromoteStore("/nonexistent/path/store.json");
    expect(store.promotions).toEqual([]);
  });

  it("savePromoteStore and loadPromoteStore round-trip", () => {
    const tmp = makeTempFile();
    const store = { promotions: [] };
    promoteService(store, "api", "staging", "production", { replicas: 3 });
    savePromoteStore(tmp, store);
    const loaded = loadPromoteStore(tmp);
    expect(loaded.promotions).toHaveLength(1);
    expect(loaded.promotions[0].service).toBe("api");
    fs.unlinkSync(tmp);
  });

  it("promoteService adds an entry with correct fields", () => {
    const store = { promotions: [] };
    const entry = promoteService(store, "worker", "dev", "staging", { timeout: 30 });
    expect(entry.service).toBe("worker");
    expect(entry.fromEnv).toBe("dev");
    expect(entry.toEnv).toBe("staging");
    expect(entry.config).toEqual({ timeout: 30 });
    expect(entry.promotedAt).toBeTruthy();
    expect(store.promotions).toHaveLength(1);
  });

  it("getPromotionsForService filters by service", () => {
    const store = { promotions: [] };
    promoteService(store, "api", "dev", "staging", {});
    promoteService(store, "worker", "dev", "staging", {});
    promoteService(store, "api", "staging", "production", {});
    const results = getPromotionsForService(store, "api");
    expect(results).toHaveLength(2);
    results.forEach((r) => expect(r.service).toBe("api"));
  });

  it("getLatestPromotion returns most recent matching entry", () => {
    const store = { promotions: [] };
    promoteService(store, "api", "dev", "staging", { v: 1 });
    promoteService(store, "api", "dev", "staging", { v: 2 });
    const latest = getLatestPromotion(store, "api", "staging");
    expect(latest?.config).toEqual({ v: 2 });
  });

  it("getLatestPromotion returns undefined if no match", () => {
    const store = { promotions: [] };
    expect(getLatestPromotion(store, "api", "production")).toBeUndefined();
  });

  it("formatPromoteResult returns readable string", () => {
    const store = { promotions: [] };
    const entry = promoteService(store, "api", "staging", "production", { replicas: 5 });
    const result = formatPromoteResult(entry);
    expect(result).toContain("api");
    expect(result).toContain("staging");
    expect(result).toContain("production");
    expect(result).toContain("replicas");
  });
});
