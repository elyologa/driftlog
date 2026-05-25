export interface PromotionRecord {
  service: string;
  fromEnv: string;
  toEnv: string;
  promotedAt: string;
  promotedBy?: string;
  snapshotRef?: string;
  note?: string;
}

export interface PromoteStore {
  promotions: PromotionRecord[];
}

export interface PromoteOptions {
  service: string;
  fromEnv: string;
  toEnv: string;
  promotedBy?: string;
  snapshotRef?: string;
  note?: string;
}

export interface PromoteResult {
  success: boolean;
  record?: PromotionRecord;
  message: string;
}
