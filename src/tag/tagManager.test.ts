import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import {
  loadTagStore,
  saveTagStore,
  addTag,
  removeTag,
  getTagsForService,
  getServicesByTag,
  listAllTags,
} from "./tagManager";
import { TagStore } from "./tagTypes";

function makeTempFile(): string {
  return path.join(os.tmpdir(), `tagstore-${Date.now()}.json`);
}

describe("loadTagStore", () => {
  it("returns empty object if file does not exist", () => {
    expect(loadTagStore("/nonexistent/path.json")).toEqual({});
  });

  it("loads store from file", () => {
    const tmp = makeTempFile();
    const store: TagStore = {
      svcA: { service: "svcA", tags: ["prod"], updatedAt: "2024-01-01T00:00:00.000Z" },
    };
    fs.writeFileSync(tmp, JSON.stringify(store));
    expect(loadTagStore(tmp)).toEqual(store);
    fs.unlinkSync(tmp);
  });
});

describe("addTag", () => {
  it("adds a new tag to a service", () => {
    const store = addTag({}, "svcA", "prod");
    expect(store["svcA"].tags).toContain("prod");
  });

  it("does not duplicate an existing tag", () => {
    let store = addTag({}, "svcA", "prod");
    store = addTag(store, "svcA", "prod");
    expect(store["svcA"].tags.filter((t) => t === "prod").length).toBe(1);
  });
});

describe("removeTag", () => {
  it("removes a tag from a service", () => {
    let store = addTag({}, "svcA", "prod");
    store = addTag(store, "svcA", "staging");
    store = removeTag(store, "svcA", "prod");
    expect(store["svcA"].tags).not.toContain("prod");
    expect(store["svcA"].tags).toContain("staging");
  });
});

describe("getTagsForService", () => {
  it("returns tags for a known service", () => {
    const store = addTag({}, "svcA", "prod");
    expect(getTagsForService(store, "svcA")).toEqual(["prod"]);
  });

  it("returns empty array for unknown service", () => {
    expect(getTagsForService({}, "unknown")).toEqual([]);
  });
});

describe("getServicesByTag", () => {
  it("returns services that have the given tag", () => {
    let store = addTag({}, "svcA", "prod");
    store = addTag(store, "svcB", "prod");
    store = addTag(store, "svcC", "staging");
    expect(getServicesByTag(store, "prod").sort()).toEqual(["svcA", "svcB"]);
  });
});

describe("listAllTags", () => {
  it("returns all unique tags sorted", () => {
    let store = addTag({}, "svcA", "prod");
    store = addTag(store, "svcB", "staging");
    store = addTag(store, "svcC", "prod");
    expect(listAllTags(store)).toEqual(["prod", "staging"]);
  });
});
