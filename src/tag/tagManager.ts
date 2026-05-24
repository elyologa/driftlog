import * as fs from "fs";
import { TagStore } from "./tagTypes";

export function loadTagStore(storeFile: string): TagStore {
  if (!fs.existsSync(storeFile)) {
    return { tags: {} };
  }
  const raw = fs.readFileSync(storeFile, "utf-8");
  return JSON.parse(raw) as TagStore;
}

export function saveTagStore(storeFile: string, store: TagStore): void {
  fs.writeFileSync(storeFile, JSON.stringify(store, null, 2));
}

export function addTag(
  store: TagStore,
  service: string,
  tag: string
): TagStore {
  const existing = store.tags[service] ?? [];
  if (existing.includes(tag)) return store;
  return {
    ...store,
    tags: {
      ...store.tags,
      [service]: [...existing, tag],
    },
  };
}

export function removeTag(
  store: TagStore,
  service: string,
  tag: string
): TagStore {
  const existing = store.tags[service] ?? [];
  return {
    ...store,
    tags: {
      ...store.tags,
      [service]: existing.filter((t) => t !== tag),
    },
  };
}

export function getTagsForService(store: TagStore, service: string): string[] {
  return store.tags[service] ?? [];
}

export function getServicesForTag(store: TagStore, tag: string): string[] {
  return Object.entries(store.tags)
    .filter(([, tags]) => tags.includes(tag))
    .map(([service]) => service);
}

export function listAllTags(store: TagStore): string[] {
  const tagSet = new Set<string>();
  for (const tags of Object.values(store.tags)) {
    for (const tag of tags) {
      tagSet.add(tag);
    }
  }
  return Array.from(tagSet).sort();
}
