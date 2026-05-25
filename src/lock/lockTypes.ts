export interface ServiceLock {
  service: string;
  lockedBy: string;
  lockedAt: string;
  reason?: string;
  expiresAt?: string;
}

export interface LockStore {
  locks: Record<string, ServiceLock>;
}

export interface LockResult {
  success: boolean;
  service: string;
  message: string;
  lock?: ServiceLock;
}
