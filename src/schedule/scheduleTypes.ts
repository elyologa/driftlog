export interface ScheduleConfig {
  serviceId: string;
  intervalMinutes: number;
  yamlPath: string;
  enabled: boolean;
  lastRunAt?: string;
  nextRunAt?: string;
}

export interface ScheduleStore {
  schedules: Record<string, ScheduleConfig>;
}

export interface ScheduleRunResult {
  serviceId: string;
  ranAt: string;
  driftDetected: boolean;
  driftCount: number;
  error?: string;
}
