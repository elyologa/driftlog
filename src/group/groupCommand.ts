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

const DEFAULT_STORE = path.resolve(process.cwd(), ".driftlog", "groups.json");

export function runGroupCommand(args: string[], storePath = DEFAULT_STORE): void {
  const [subcommand, ...rest] = args;
  const store = loadGroupStore(storePath);

  switch (subcommand) {
    case "create": {
      const [name, ...services] = rest;
      if (!name) { console.error("Usage: group create <name> [service...]"); process.exit(1); }
      const group = upsertGroup(store, name, services);
      saveGroupStore(storePath, store);
      console.log(`Group "${group.name}" created with ${group.services.length} service(s).`);
      break;
    }
    case "remove": {
      const [name] = rest;
      if (!name) { console.error("Usage: group remove <name>"); process.exit(1); }
      const result = removeGroup(store, name);
      if (!result.success) { console.error(result.message); process.exit(1); }
      saveGroupStore(storePath, store);
      console.log(result.message);
      break;
    }
    case "add-service": {
      const [groupName, service] = rest;
      if (!groupName || !service) { console.error("Usage: group add-service <group> <service>"); process.exit(1); }
      const result = addServiceToGroup(store, groupName, service);
      if (!result.success) { console.error(result.message); process.exit(1); }
      saveGroupStore(storePath, store);
      console.log(result.message);
      break;
    }
    case "remove-service": {
      const [groupName, service] = rest;
      if (!groupName || !service) { console.error("Usage: group remove-service <group> <service>"); process.exit(1); }
      const result = removeServiceFromGroup(store, groupName, service);
      if (!result.success) { console.error(result.message); process.exit(1); }
      saveGroupStore(storePath, store);
      console.log(result.message);
      break;
    }
    case "show": {
      const [name] = rest;
      if (!name) { console.error("Usage: group show <name>"); process.exit(1); }
      const group = getGroup(store, name);
      if (!group) { console.error(`Group "${name}" not found.`); process.exit(1); }
      console.log(JSON.stringify(group, null, 2));
      break;
    }
    case "list": {
      const groups = listGroups(store);
      if (groups.length === 0) { console.log("No groups defined."); break; }
      groups.forEach(g => console.log(`${g.name} (${g.services.length} services): ${g.services.join(", ") || "none"}`));
      break;
    }
    default:
      console.error("Unknown subcommand. Use: create | remove | add-service | remove-service | show | list");
      process.exit(1);
  }
}
