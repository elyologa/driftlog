export interface CloneEntry {
  originalService: string;
  clonedService: string;
  clonedAt: string;
  note?: string;
}

export interface CloneStore {
  clones: CloneEntry[];
}

export interface CloneResult {
  success: boolean;
  originalService: string;
  clonedService: string;
  message: string;
}
