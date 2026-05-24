import fs from "fs";
import os from "os";
import path from "path";
import {
  loadProfileStore,
  saveProfileStore,
  upsertProfile,
  removeProfile,
  getProfile,
  listProfiles,
} from "./profileManager";
import { ProfileStore } from "./profileTypes";

function makeTempFile(): string {
  return path.join(os.tmpdir(), `profile-test-${Date.now()}.json`);
}

describe("profileManager", () => {
  it("loadProfileStore returns empty store when file missing", () => {
    const store = loadProfileStore("/nonexistent/path.json");
    expect(store.profiles).toEqual({});
  });

  it("saveProfileStore and loadProfileStore round-trip", () => {
    const tmp = makeTempFile();
    const store: ProfileStore = { profiles: {} };
    upsertProfile(store, "svc-a", "./config/svc-a.yaml");
    saveProfileStore(tmp, store);
    const loaded = loadProfileStore(tmp);
    expect(loaded.profiles["svc-a"].service).toBe("svc-a");
    fs.unlinkSync(tmp);
  });

  it("upsertProfile creates a new profile", () => {
    const store: ProfileStore = { profiles: {} };
    const profile = upsertProfile(store, "svc-b", "./svc-b.yaml", {
      endpoint: "http://localhost:3000",
      description: "test service",
    });
    expect(profile.service).toBe("svc-b");
    expect(profile.yamlPath).toBe("./svc-b.yaml");
    expect(profile.liveEndpoint).toBe("http://localhost:3000");
    expect(profile.description).toBe("test service");
    expect(profile.createdAt).toBe(profile.updatedAt);
  });

  it("upsertProfile updates existing profile preserving createdAt", () => {
    const store: ProfileStore = { profiles: {} };
    const first = upsertProfile(store, "svc-c", "./old.yaml");
    const second = upsertProfile(store, "svc-c", "./new.yaml");
    expect(second.createdAt).toBe(first.createdAt);
    expect(second.yamlPath).toBe("./new.yaml");
  });

  it("removeProfile deletes an existing profile", () => {
    const store: ProfileStore = { profiles: {} };
    upsertProfile(store, "svc-d", "./svc-d.yaml");
    const result = removeProfile(store, "svc-d");
    expect(result).toBe(true);
    expect(store.profiles["svc-d"]).toBeUndefined();
  });

  it("removeProfile returns false for missing service", () => {
    const store: ProfileStore = { profiles: {} };
    expect(removeProfile(store, "nonexistent")).toBe(false);
  });

  it("getProfile returns undefined for missing service", () => {
    const store: ProfileStore = { profiles: {} };
    expect(getProfile(store, "missing")).toBeUndefined();
  });

  it("listProfiles returns profiles sorted alphabetically", () => {
    const store: ProfileStore = { profiles: {} };
    upsertProfile(store, "zebra", "./z.yaml");
    upsertProfile(store, "alpha", "./a.yaml");
    const list = listProfiles(store);
    expect(list[0].service).toBe("alpha");
    expect(list[1].service).toBe("zebra");
  });
});
