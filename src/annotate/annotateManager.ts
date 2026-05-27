import * as fs from "fs";

export interface Annotation {
  service: string;
  key: string;
  value: string;
  createdAt: string;
  updatedAt: string;
}

export interface AnnotateStore {
  annotations: Annotation[];
}

export function loadAnnotateStore(storePath: string): AnnotateStore {
  if (!fs.existsSync(storePath)) {
    return { annotations: [] };
  }
  const raw = fs.readFileSync(storePath, "utf-8");
  return JSON.parse(raw) as AnnotateStore;
}

export function saveAnnotateStore(storePath: string, store: AnnotateStore): void {
  fs.writeFileSync(storePath, JSON.stringify(store, null, 2), "utf-8");
}

export function setAnnotation(
  store: AnnotateStore,
  service: string,
  key: string,
  value: string
): Annotation {
  const now = new Date().toISOString();
  const existing = store.annotations.find(
    (a) => a.service === service && a.key === key
  );
  if (existing) {
    existing.value = value;
    existing.updatedAt = now;
    return existing;
  }
  const entry: Annotation = { service, key, value, createdAt: now, updatedAt: now };
  store.annotations.push(entry);
  return entry;
}

export function removeAnnotation(
  store: AnnotateStore,
  service: string,
  key: string
): boolean {
  const before = store.annotations.length;
  store.annotations = store.annotations.filter(
    (a) => !(a.service === service && a.key === key)
  );
  return store.annotations.length < before;
}

export function getAnnotationsForService(
  store: AnnotateStore,
  service: string
): Annotation[] {
  return store.annotations.filter((a) => a.service === service);
}

export function formatAnnotations(annotations: Annotation[]): string {
  if (annotations.length === 0) return "No annotations found.";
  return annotations
    .map((a) => `  [${a.key}] = "${a.value}"  (updated: ${a.updatedAt})`)
    .join("\n");
}
