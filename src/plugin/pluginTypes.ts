export interface DriftPlugin {
  name: string;
  version: string;
  description?: string;
  hooks: PluginHooks;
}

export interface PluginHooks {
  beforeDrift?: (serviceName: string, config: Record<string, unknown>) => Promise<void> | void;
  afterDrift?: (serviceName: string, driftKeys: string[]) => Promise<void> | void;
  onAlert?: (serviceName: string, message: string) => Promise<void> | void;
}

export interface PluginStore {
  plugins: RegisteredPlugin[];
}

export interface RegisteredPlugin {
  name: string;
  version: string;
  description?: string;
  enabled: boolean;
  registeredAt: string;
}
