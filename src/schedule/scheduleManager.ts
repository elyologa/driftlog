import fs from 'fs';
import { ScheduleConfig, ScheduleStore } from './scheduleTypes';

const EMPTY_STORE: ScheduleStore = { schedules: {} };

export function loadScheduleStore(storePath: string): ScheduleStore {
  if (!fs.existsSync(storePath)) return { ...EMPTY_STORE, schedules: {} };
  try {
    const raw = fs.readFileSync(storePath, 'utf-8');
    return JSON.parse(raw) as ScheduleStore;
  } catch {
    return { ...EMPTY_STORE, schedules: {} };
  }
}

export function saveScheduleStore(storePath: string, store: ScheduleStore): void {
  fs.writeFileSync(storePath, JSON.stringify(store, null, 2), 'utf-8');
}

export function upsertSchedule(
  store: ScheduleStore,
  config: ScheduleConfig
): ScheduleStore {
  const nextRunAt = computeNextRun(config.intervalMinutes);
  return {
    ...store,
    schedules: {
      ...store.schedules,
      [config.serviceId]: { ...config, nextRunAt },
    },
  };
}

export function removeSchedule(
  store: ScheduleStore,
  serviceId: string
): ScheduleStore {
  const updated = { ...store.schedules };
  delete updated[serviceId];
  return { ...store, schedules: updated };
}

export function getSchedule(
  store: ScheduleStore,
  serviceId: string
): ScheduleConfig | undefined {
  return store.schedules[serviceId];
}

export function getDueSchedules(store: ScheduleStore): ScheduleConfig[] {
  const now = new Date();
  return Object.values(store.schedules).filter((s) => {
    if (!s.enabled || !s.nextRunAt) return false;
    return new Date(s.nextRunAt) <= now;
  });
}

export function markScheduleRan(
  store: ScheduleStore,
  serviceId: string
): ScheduleStore {
  const existing = store.schedules[serviceId];
  if (!existing) return store;
  const now = new Date().toISOString();
  const nextRunAt = computeNextRun(existing.intervalMinutes);
  return {
    ...store,
    schedules: {
      ...store.schedules,
      [serviceId]: { ...existing, lastRunAt: now, nextRunAt },
    },
  };
}

function computeNextRun(intervalMinutes: number): string {
  const next = new Date(Date.now() + intervalMinutes * 60 * 1000);
  return next.toISOString();
}
