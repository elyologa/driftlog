export interface ServiceGroup {
  name: string;
  description?: string;
  services: string[];
  createdAt: string;
  updatedAt: string;
}

export interface GroupStore {
  groups: Record<string, ServiceGroup>;
}

export interface GroupResult {
  success: boolean;
  message: string;
  group?: ServiceGroup;
}
