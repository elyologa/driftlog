export interface TagEntry {
  service: string;
  tags: string[];
  updatedAt: string;
}

export interface TagStore {
  [service: string]: TagEntry;
}
