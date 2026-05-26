import fs from "fs";
import { GroupStore, ServiceGroup, GroupResult } from "./groupTypes";

export function loadGroupStore(storePath: string): GroupStore {
  if (!fs.existsSync(storePath)) return { groups: {} };
  const raw = fs.readFileSync(storePath, "utf-8");
  return JSON.parse(raw) as GroupStore;
}

export function saveGroupStore(storePath: string, store: GroupStore): void {
  fs.writeFileSync(storePath, JSON.stringify(store, null, 2), "utf-8");
}

export function upsertGroup(
  store: GroupStore,
  name: string,
  services: string[],
  description?: string
): ServiceGroup {
  const now = new Date().toISOString();
  const existing = store.groups[name];
  const group: ServiceGroup = {
    name,
    description: description ?? existing?.description,
    services,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
  store.groups[name] = group;
  return group;
}

export function removeGroup(store: GroupStore, name: string): GroupResult {
  if (!store.groups[name]) {
    return { success: false, message: `Group "${name}" not found.` };
  }
  delete store.groups[name];
  return { success: true, message: `Group "${name}" removed.` };
}

export function getGroup(store: GroupStore, name: string): ServiceGroup | undefined {
  return store.groups[name];
}

export function listGroups(store: GroupStore): ServiceGroup[] {
  return Object.values(store.groups);
}

export function addServiceToGroup(
  store: GroupStore,
  groupName: string,
  service: string
): GroupResult {
  const group = store.groups[groupName];
  if (!group) return { success: false, message: `Group "${groupName}" not found.` };
  if (group.services.includes(service)) {
    return { success: false, message: `Service "${service}" already in group "${groupName}".` };
  }
  group.services.push(service);
  group.updatedAt = new Date().toISOString();
  return { success: true, message: `Service "${service}" added to group "${groupName}".`, group };
}

export function removeServiceFromGroup(
  store: GroupStore,
  groupName: string,
  service: string
): GroupResult {
  const group = store.groups[groupName];
  if (!group) return { success: false, message: `Group "${groupName}" not found.` };
  const idx = group.services.indexOf(service);
  if (idx === -1) {
    return { success: false, message: `Service "${service}" not in group "${groupName}".` };
  }
  group.services.splice(idx, 1);
  group.updatedAt = new Date().toISOString();
  return { success: true, message: `Service "${service}" removed from group "${groupName}".`, group };
}
