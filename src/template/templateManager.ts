import * as fs from "fs";
import { ServiceTemplate, TemplateStore, ApplyTemplateResult } from "./templateTypes";

const EMPTY_STORE: TemplateStore = { templates: {} };

export function loadTemplateStore(storePath: string): TemplateStore {
  if (!fs.existsSync(storePath)) return { ...EMPTY_STORE, templates: {} };
  const raw = fs.readFileSync(storePath, "utf-8");
  return JSON.parse(raw) as TemplateStore;
}

export function saveTemplateStore(storePath: string, store: TemplateStore): void {
  fs.writeFileSync(storePath, JSON.stringify(store, null, 2), "utf-8");
}

export function upsertTemplate(
  store: TemplateStore,
  name: string,
  defaults: Record<string, unknown>,
  requiredKeys: string[],
  description?: string,
  tags?: string[]
): ServiceTemplate {
  const now = new Date().toISOString();
  const existing = store.templates[name];
  const template: ServiceTemplate = {
    name,
    description: description ?? existing?.description,
    defaults,
    requiredKeys,
    tags: tags ?? existing?.tags ?? [],
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
  store.templates[name] = template;
  return template;
}

export function removeTemplate(store: TemplateStore, name: string): boolean {
  if (!store.templates[name]) return false;
  delete store.templates[name];
  return true;
}

export function getTemplate(store: TemplateStore, name: string): ServiceTemplate | undefined {
  return store.templates[name];
}

export function listTemplates(store: TemplateStore): ServiceTemplate[] {
  return Object.values(store.templates);
}

export function applyTemplate(
  template: ServiceTemplate,
  serviceConfig: Record<string, unknown>,
  serviceName: string
): ApplyTemplateResult {
  const merged: Record<string, unknown> = { ...template.defaults };
  const appliedKeys: string[] = [];
  const skippedKeys: string[] = [];

  for (const [key, value] of Object.entries(serviceConfig)) {
    if (key in merged) {
      skippedKeys.push(key);
    } else {
      appliedKeys.push(key);
    }
    merged[key] = value;
  }

  return { templateName: template.name, serviceName, merged, appliedKeys, skippedKeys };
}
