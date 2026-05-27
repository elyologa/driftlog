export interface ServiceDependency {
  service: string;
  dependsOn: string[];
  updatedAt: string;
}

export interface DependencyStore {
  dependencies: Record<string, ServiceDependency>;
}

export interface DependencyGraph {
  nodes: string[];
  edges: Array<{ from: string; to: string }>;
}

export interface DependencyCheckResult {
  service: string;
  missing: string[];
  circular: string[];
  valid: boolean;
}
