export interface WatchOptions {
  intervalMs: number;
  configPath: string;
  serviceName: string;
  onDrift?: (report: string) => void;
  onError?: (error: Error) => void;
}

export interface WatchState {
  serviceName: string;
  configPath: string;
  intervalMs: number;
  isRunning: boolean;
  lastCheckedAt: string | null;
  driftCount: number;
  errorCount: number;
}

export interface WatchHandle {
  stop: () => void;
  getState: () => WatchState;
}
