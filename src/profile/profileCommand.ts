import path from "path";
import {
  loadProfileStore,
  saveProfileStore,
  upsertProfile,
  removeProfile,
  getProfile,
  listProfiles,
} from "./profileManager";
import { ProfileCommandOptions } from "./profileTypes";

const DEFAULT_STORE = path.resolve(process.cwd(), ".driftlog", "profiles.json");

export function runProfileCommand(
  args: string[],
  opts: ProfileCommandOptions,
  storePath: string = DEFAULT_STORE
): void {
  const store = loadProfileStore(storePath);

  if (opts.list) {
    const profiles = listProfiles(store);
    if (profiles.length === 0) {
      console.log("No service profiles found.");
      return;
    }
    profiles.forEach((p) => {
      console.log(
        `[${p.service}] yaml=${p.yamlPath}${
          p.liveEndpoint ? ` endpoint=${p.liveEndpoint}` : ""
        }${p.description ? ` desc="${p.description}"` : ""}`
      );
    });
    return;
  }

  if (opts.show) {
    const profile = getProfile(store, opts.show);
    if (!profile) {
      console.error(`No profile found for service: ${opts.show}`);
      process.exitCode = 1;
      return;
    }
    console.log(JSON.stringify(profile, null, 2));
    return;
  }

  const service = args[0];
  if (!service) {
    console.error("Service name is required.");
    process.exitCode = 1;
    return;
  }

  if (opts.remove) {
    const removed = removeProfile(store, service);
    if (!removed) {
      console.error(`Profile not found for service: ${service}`);
      process.exitCode = 1;
      return;
    }
    saveProfileStore(storePath, store);
    console.log(`Removed profile for service: ${service}`);
    return;
  }

  if (!opts.yaml) {
    console.error("--yaml <path> is required when adding a profile.");
    process.exitCode = 1;
    return;
  }

  const profile = upsertProfile(store, service, opts.yaml, {
    endpoint: opts.endpoint,
    description: opts.description,
  });
  saveProfileStore(storePath, store);
  console.log(`Profile saved for service: ${profile.service}`);
}
