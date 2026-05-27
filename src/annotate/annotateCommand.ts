import fs from "fs";
import { loadAnnotateStore, saveAnnotateStore, setAnnotation, removeAnnotation, getAnnotationsForService, listAllAnnotations } from "./annotateManager";

export function runAnnotateCommand(args: string[], storePath: string): string {
  const [subcommand, service, key, ...rest] = args;
  const store = loadAnnotateStore(storePath);

  switch (subcommand) {
    case "set": {
      if (!service || !key || rest.length === 0) {
        return "Usage: annotate set <service> <key> <value>";
      }
      const value = rest.join(" ");
      const updated = setAnnotation(store, service, key, value);
      saveAnnotateStore(storePath, updated);
      return `Annotation '${key}' set for service '${service}'.`;
    }

    case "remove": {
      if (!service || !key) {
        return "Usage: annotate remove <service> <key>";
      }
      const updated = removeAnnotation(store, service, key);
      saveAnnotateStore(storePath, updated);
      return `Annotation '${key}' removed from service '${service}'.`;
    }

    case "get": {
      if (!service) {
        return "Usage: annotate get <service>";
      }
      const annotations = getAnnotationsForService(store, service);
      const entries = Object.entries(annotations);
      if (entries.length === 0) {
        return `No annotations found for service '${service}'.`;
      }
      return entries.map(([k, v]) => `  ${k}: ${v}`).join("\n");
    }

    case "list": {
      const all = listAllAnnotations(store);
      const services = Object.keys(all);
      if (services.length === 0) {
        return "No annotations stored.";
      }
      return services
        .map((svc) => {
          const entries = Object.entries(all[svc])
            .map(([k, v]) => `    ${k}: ${v}`)
            .join("\n");
          return `${svc}:\n${entries}`;
        })
        .join("\n");
    }

    default:
      return "Unknown subcommand. Use: set | remove | get | list";
  }
}
