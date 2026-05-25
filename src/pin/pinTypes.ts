export interface PinEntry {
  service: string;
  field: string;
  expectedValue: unknown;
  pinnedAt: string;
  note?: string;
}

export interface PinStore {
  pins: PinEntry[];
}

export interface PinResult {
  service: string;
  field: string;
  expectedValue: unknown;
  actualValue: unknown;
  pinned: boolean;
  violated: boolean;
}
