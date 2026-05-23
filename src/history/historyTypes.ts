export interface HistoryEntry {
  service: string;
  timestamp: number;
  drifts: HistoryDriftRecord[];
}

export interface HistoryDriftRecord {
  key: string;
  expected: unknown;
  actual: unknown;
}

export interface HistoryStore {
  [service: string]: HistoryEntry[];
}

export interface HistoryCommandResult {
  service: string;
  entriesFound: number;
  entries: HistoryEntry[];
}
