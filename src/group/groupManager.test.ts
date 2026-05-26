import fs from "fs";
import os from "os";
import path from "path";
import {
  loadGroupStore,
  saveGroupStore,
  upsertGroup,
  removeGroup,
  getGroup,
  listGroups,
  addServiceToGroup,
  removeServiceFromGroup,
} from "./groupManager";

function makeTempFile(): string {
  return path.join(os.tmpdir(), `group-test-${Date.now()}.json`);
}

describe("groupManager", () => {
  it("loads an empty store when file does not exist", () => {
    const store = loadGroupStore("/nonexistent/path.json");
    expect(store.groups).toEqual({});
  });

  it("saves and loads a store", () => {
    const tmp = makeTempFile();
    const store = { groups: {} };
    upsertGroup(store, "backend", ["api", "worker"]);
    saveGroupStore(tmp, store);
    const loaded = loadGroupStore(tmp);
    expect(loaded.groups["backend"].services).toEqual(["api", "worker"]);
    fs.unlinkSync(tmp);
  });

  it("upserts a group", () => {
    const store = { groups: {} };
    const g = upsertGroup(store, "frontend", ["web"], "Frontend services");
    expect(g.name).toBe("frontend");
    expect(g.description).toBe("Frontend services");
    expect(g.services).toContain("web");
  });

  it("preserves createdAt on update", () => {
    const store = { groups: {} };
    const first = upsertGroup(store, "g1", ["svc-a"]);
    const second = upsertGroup(store, "g1", ["svc-a", "svc-b"]);
    expect(second.createdAt).toBe(first.createdAt);
    expect(second.services).toHaveLength(2);
  });

  it("removes a group", () => {
    const store = { groups: {} };
    upsertGroup(store, "temp", ["x"]);
    const result = removeGroup(store, "temp");
    expect(result.success).toBe(true);
    expect(store.groups["temp"]).toBeUndefined();
  });

  it("returns error when removing nonexistent group", () => {
    const store = { groups: {} };
    const result = removeGroup(store, "ghost");
    expect(result.success).toBe(false);
  });

  it("lists all groups", () => {
    const store = { groups: {} };
    upsertGroup(store, "g1", []);
    upsertGroup(store, "g2", []);
    expect(listGroups(store)).toHaveLength(2);
  });

  it("adds a service to a group", () => {
    const store = { groups: {} };
    upsertGroup(store, "grp", ["a"]);
    const result = addServiceToGroup(store, "grp", "b");
    expect(result.success).toBe(true);
    expect(store.groups["grp"].services).toContain("b");
  });

  it("prevents duplicate service in group", () => {
    const store = { groups: {} };
    upsertGroup(store, "grp", ["a"]);
    const result = addServiceToGroup(store, "grp", "a");
    expect(result.success).toBe(false);
  });

  it("removes a service from a group", () => {
    const store = { groups: {} };
    upsertGroup(store, "grp", ["a", "b"]);
    const result = removeServiceFromGroup(store, "grp", "a");
    expect(result.success).toBe(true);
    expect(store.groups["grp"].services).not.toContain("a");
  });

  it("gets a specific group", () => {
    const store = { groups: {} };
    upsertGroup(store, "target", ["svc"]);
    const g = getGroup(store, "target");
    expect(g?.name).toBe("target");
  });
});
