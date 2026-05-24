export interface SearchOptions {
  service?: string;
  key?: string;
  severity?: "low" | "medium" | "high";
  since?: Date;
  until?: Date;
  limit?: number;
}

export interface SearchResult {
  service: string;
  timestamp: string;
  key: string;
  expected: unknown;
  actual: unknown;
  severity: string;
}
