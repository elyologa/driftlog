export interface ServiceTemplate {
  name: string;
  description?: string;
  defaults: Record<string, unknown>;
  requiredKeys: string[];
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface TemplateStore {
  templates: Record<string, ServiceTemplate>;
}

export interface ApplyTemplateResult {
  templateName: string;
  serviceName: string;
  merged: Record<string, unknown>;
  appliedKeys: string[];
  skippedKeys: string[];
}
