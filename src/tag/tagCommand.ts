import * as fs from "fs";
import {
  loadTagStore,
  saveTagStore,
  addTag,
  removeTag,
  getTagsForService,
  getServicesForTag,
} from "./tagManager";

export async function runTagCommand(
  args: string[],
  storeFile: string
): Promise<void> {
  const [subcommand, ...rest] = args;

  if (!storeFile || !fs.existsSync(storeFile)) {
    const store = { tags: {} };
    if (storeFile) {
      fs.writeFileSync(storeFile, JSON.stringify(store, null, 2));
    }
  }

  const store = loadTagStore(storeFile);

  switch (subcommand) {
    case "add": {
      const [service, ...tags] = rest;
      if (!service || tags.length === 0) {
        console.error("Usage: tag add <service> <tag> [tag...]");
        process.exit(1);
      }
      let updated = store;
      for (const tag of tags) {
        updated = addTag(updated, service, tag);
      }
      saveTagStore(storeFile, updated);
      console.log(`Added tags [${tags.join(", ")}] to service "${service}".`);
      break;
    }

    case "remove": {
      const [service, tag] = rest;
      if (!service || !tag) {
        console.error("Usage: tag remove <service> <tag>");
        process.exit(1);
      }
      const updated = removeTag(store, service, tag);
      saveTagStore(storeFile, updated);
      console.log(`Removed tag "${tag}" from service "${service}".`);
      break;
    }

    case "list": {
      const [service] = rest;
      if (!service) {
        console.error("Usage: tag list <service>");
        process.exit(1);
      }
      const tags = getTagsForService(store, service);
      if (tags.length === 0) {
        console.log(`No tags found for service "${service}".`);
      } else {
        console.log(`Tags for "${service}": ${tags.join(", ")}`);
      }
      break;
    }

    case "services": {
      const [tag] = rest;
      if (!tag) {
        console.error("Usage: tag services <tag>");
        process.exit(1);
      }
      const services = getServicesForTag(store, tag);
      if (services.length === 0) {
        console.log(`No services found with tag "${tag}".`);
      } else {
        console.log(`Services with tag "${tag}": ${services.join(", ")}`);
      }
      break;
    }

    default:
      console.error(
        "Unknown subcommand. Use: add | remove | list | services"
      );
      process.exit(1);
  }
}
