import fs from "fs";
import { ProfileStore, ServiceProfile } from "./profileTypes";

const EMPTY_STORE: ProfileStore = { profiles: {} };

export function loadProfileStore(storePath: string): ProfileStore {
  if (!fs.existsSync(storePath)) return { ...EMPTY_STORE, profiles: {} };
  const raw = fs.readFileSync(storePath, "utf-8");
  return JSON.parse(raw) as ProfileStore;
}

export function saveProfileStore(storePath: string, store: ProfileStore): void {
  fs.writeFileSync(storePath, JSON.stringify(store, null, 2), "utf-8");
}

export function upsertProfile(
  store: ProfileStore,
  service: string,
  yamlPath: string,
  options: { endpoint?: string; description?: string } = {}
): ServiceProfile {
  const now = new Date().toISOString();
  const existing = store.profiles[service];
  const profile: ServiceProfile = {
    service,
    yamlPath,
    liveEndpoint: options.endpoint ?? existing?.liveEndpoint,
    description: options.description ?? existing?.description,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
  store.profiles[service] = profile;
  return profile;
}

export function removeProfile(store: ProfileStore, service: string): boolean {
  if (!store.profiles[service]) return false;
  delete store.profiles[service];
  return true;
}

export function getProfile(
  store: ProfileStore,
  service: string
): ServiceProfile | undefined {
  return store.profiles[service];
}

export function listProfiles(store: ProfileStore): ServiceProfile[] {
  return Object.values(store.profiles).sort((a, b) =>
    a.service.localeCompare(b.service)
  );
}
