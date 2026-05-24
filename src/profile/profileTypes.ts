export interface ServiceProfile {
  service: string;
  yamlPath: string;
  liveEndpoint?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProfileStore {
  profiles: Record<string, ServiceProfile>;
}

export interface ProfileCommandOptions {
  add?: boolean;
  remove?: boolean;
  list?: boolean;
  show?: string;
  yaml?: string;
  endpoint?: string;
  description?: string;
}
