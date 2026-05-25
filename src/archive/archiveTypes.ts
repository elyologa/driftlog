export interface ArchivedService {
  name: string;
  archivedAt: string;
  config: Record<string, unknown>;
  reason?: string;
  tags?: string[];
}

export interface ArchiveStore {
  archived: Record<string, ArchivedService>;
}

export interface ArchiveResult {
  success: boolean;
  serviceName: string;
  message: string;
}

export interface RestoreResult {
  success: boolean;
  serviceName: string;
  message: string;
}
