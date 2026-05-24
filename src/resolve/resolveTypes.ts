export interface ResolveResult {
  service: string;
  resolvedPath: string;
  exists: boolean;
  source: "explicit" | "profile" | "default";
}

export interface ResolveOptions {
  configPath?: string;
  profile?: string;
  defaultDir?: string;
}

export interface ResolveStore {
  defaultDir: string;
  profileDirs: Record<string, string>;
}
