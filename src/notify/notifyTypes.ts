export interface NotifyConfig {
  webhookUrl: string;
  onDriftOnly: boolean;
}

export interface NotifyStore {
  [serviceName: string]: NotifyConfig;
}

export interface WebhookPayload {
  service: string;
  timestamp: string;
  driftCount: number;
  drifts: WebhookDriftEntry[];
}

export interface WebhookDriftEntry {
  key: string;
  expected: unknown;
  actual: unknown;
  status: "missing" | "extra" | "changed";
}
