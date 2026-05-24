export interface ServiceSummary {
  service: string;
  tags: string[];
  lastChecked: string | null;
  driftCount: number;
  highSeverity: number;
  mediumSeverity: number;
  lowSeverity: number;
  hasBaseline: boolean;
  snapshotCount: number;
}

export interface SummaryReport {
  generatedAt: string;
  totalServices: number;
  servicesWithDrift: number;
  services: ServiceSummary[];
}
