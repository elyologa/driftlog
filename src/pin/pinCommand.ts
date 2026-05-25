import path from "path";
import {
  loadPinStore,
  savePinStore,
  addPin,
  removePin,
  getPinsForService,
  checkPins,
  formatPinResults,
} from "./pinManager";

const DEFAULT_STORE = path.resolve(process.cwd(), ".driftlog", "pins.json");

export function runPinCommand(
  args: string[],
  storePath: string = DEFAULT_STORE,
  log: (msg: string) => void = console.log
): void {
  const [subcommand, service, field, ...rest] = args;

  if (!subcommand) {
    log("Usage: pin <add|remove|list|check> <service> [field] [value] [--note <note>]");
    return;
  }

  const store = loadPinStore(storePath);

  if (subcommand === "add") {
    if (!service || !field || rest.length === 0) {
      log("Usage: pin add <service> <field> <value> [--note <note>]");
      return;
    }
    const noteIdx = rest.indexOf("--note");
    const rawValue = noteIdx >= 0 ? rest.slice(0, noteIdx).join(" ") : rest.join(" ");
    const note = noteIdx >= 0 ? rest.slice(noteIdx + 1).join(" ") : undefined;
    let parsed: unknown = rawValue;
    try { parsed = JSON.parse(rawValue); } catch { /* keep as string */ }
    const updated = addPin(store, service, field, parsed, note);
    savePinStore(storePath, updated);
    log(`Pinned ${service}.${field} = ${JSON.stringify(parsed)}`);
    return;
  }

  if (subcommand === "remove") {
    if (!service || !field) {
      log("Usage: pin remove <service> <field>");
      return;
    }
    const updated = removePin(store, service, field);
    savePinStore(storePath, updated);
    log(`Removed pin for ${service}.${field}`);
    return;
  }

  if (subcommand === "list") {
    if (!service) {
      log("Usage: pin list <service>");
      return;
    }
    const pins = getPinsForService(store, service);
    if (pins.length === 0) {
      log(`No pins for service "${service}".`);
    } else {
      pins.forEach((p) =>
        log(`  ${p.field} = ${JSON.stringify(p.expectedValue)}${p.note ? ` (${p.note})` : ""}  [${p.pinnedAt}]`)
      );
    }
    return;
  }

  if (subcommand === "check") {
    if (!service || rest.length === 0) {
      log("Usage: pin check <service> <json-live-values>");
      return;
    }
    let liveValues: Record<string, unknown>;
    try {
      liveValues = JSON.parse(rest.join(" "));
    } catch {
      log("Error: live values must be valid JSON.");
      return;
    }
    const results = checkPins(store, service, liveValues);
    log(formatPinResults(results));
    return;
  }

  log(`Unknown subcommand: ${subcommand}`);
}
