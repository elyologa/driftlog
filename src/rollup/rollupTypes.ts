export interface ServiceRollupEntry {
  service: string;
  totalDrifts: number;
  criticalCount: number;
  warningCount: number;
  infoCount: number;
  lastChecked: string;
  tags: string[];
}

export interface RollupSummary {
  generatedAt: string;
  totalServices: number;
  servicesWithDrift: number;
  servicesClean: number;
  totalDrifts: number;
  bySeverity: {
    critical: number;
    warning: number;
    info: number;
  };
  entries: ServiceRollupEntry[];
}
