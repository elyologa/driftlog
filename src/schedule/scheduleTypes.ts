export interface ScheduleEntry {
  serviceName: string;
  intervalSeconds: number;
  yamlPath?: string;
  lastRunAt?: string;
}

export interface ScheduleStore {
  schedules: Record<string, ScheduleEntry>;
}
