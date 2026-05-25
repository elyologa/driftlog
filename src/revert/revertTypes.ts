export interface RevertEntry {
  service: string;
  revertedAt: string;
  fromSnapshot: string;
  toSnapshot: string;
  reason?: string;
}

export interface RevertStore {
  reverts: RevertEntry[];
}

export interface RevertResult {
  success: boolean;
  service: string;
  fromSnapshot: string;
  toSnapshot: string;
  message: string;
}
