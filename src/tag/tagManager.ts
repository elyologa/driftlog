import * as fs from "fs";
import { TagStore, TagEntry } from "./tagTypes";

export function loadTagStore(storePath: string): TagStore {
  if (!fs.existsSync(storePath)) return {};
  const raw = fs.readFileSync(storePath, "utf-8");
  return JSON.parse(raw) as TagStore;
}

export function saveTagStore(storePath: string, store: TagStore): void {
  fs.writeFileSync(storePath, JSON.stringify(store, null, 2), "utf-8");
}

export function addTag(store: TagStore, service: string, tag: string): TagStore {
  const existing = store[service]?.tags ?? [];
  if (existing.includes(tag)) return store;
  const updated: TagEntry = {
    service,
    tags: [...existing, tag],
    updatedAt: new Date().toISOString(),
  };
  return { ...store, [service]: updated };
}

export function removeTag(store: TagStore, service: string, tag: string): TagStore {
  const existing = store[service]?.tags ?? [];
  const filtered = existing.filter((t) => t !== tag);
  const updated: TagEntry = {
    service,
    tags: filtered,
    updatedAt: new Date().toISOString(),
  };
  return { ...store, [service]: updated };
}

export function getTagsForService(store: TagStore, service: string): string[] {
  return store[service]?.tags ?? [];
}

export function getServicesByTag(store: TagStore, tag: string): string[] {
  return Object.values(store)
    .filter((entry) => entry.tags.includes(tag))
    .map((entry) => entry.service);
}

export function listAllTags(store: TagStore): string[] {
  const tagSet = new Set<string>();
  for (const entry of Object.values(store)) {
    for (const tag of entry.tags) {
      tagSet.add(tag);
    }
  }
  return Array.from(tagSet).sort();
}
