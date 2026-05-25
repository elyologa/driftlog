import fs from "fs";
import { PinEntry, PinStore, PinResult } from "./pinTypes";

export function loadPinStore(storePath: string): PinStore {
  if (!fs.existsSync(storePath)) return { pins: [] };
  const raw = fs.readFileSync(storePath, "utf-8");
  return JSON.parse(raw) as PinStore;
}

export function savePinStore(storePath: string, store: PinStore): void {
  fs.writeFileSync(storePath, JSON.stringify(store, null, 2), "utf-8");
}

export function addPin(
  store: PinStore,
  service: string,
  field: string,
  expectedValue: unknown,
  note?: string
): PinStore {
  const existing = store.pins.findIndex(
    (p) => p.service === service && p.field === field
  );
  const entry: PinEntry = {
    service,
    field,
    expectedValue,
    pinnedAt: new Date().toISOString(),
    ...(note ? { note } : {}),
  };
  const pins = [...store.pins];
  if (existing >= 0) {
    pins[existing] = entry;
  } else {
    pins.push(entry);
  }
  return { pins };
}

export function removePin(
  store: PinStore,
  service: string,
  field: string
): PinStore {
  return {
    pins: store.pins.filter(
      (p) => !(p.service === service && p.field === field)
    ),
  };
}

export function getPinsForService(store: PinStore, service: string): PinEntry[] {
  return store.pins.filter((p) => p.service === service);
}

export function checkPins(
  store: PinStore,
  service: string,
  liveValues: Record<string, unknown>
): PinResult[] {
  const pins = getPinsForService(store, service);
  return pins.map((pin) => {
    const actualValue = liveValues[pin.field];
    const violated = JSON.stringify(actualValue) !== JSON.stringify(pin.expectedValue);
    return {
      service: pin.service,
      field: pin.field,
      expectedValue: pin.expectedValue,
      actualValue,
      pinned: true,
      violated,
    };
  });
}

export function formatPinResults(results: PinResult[]): string {
  if (results.length === 0) return "No pins checked.";
  return results
    .map((r) => {
      const status = r.violated ? "VIOLATED" : "OK";
      return `[${status}] ${r.service}.${r.field}: expected=${JSON.stringify(
        r.expectedValue
      )} actual=${JSON.stringify(r.actualValue)}`;
    })
    .join("\n");
}
