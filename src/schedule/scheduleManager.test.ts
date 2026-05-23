import fs from 'fs';
import os from 'os';
import path from 'path';
import {
  loadScheduleStore,
  saveScheduleStore,
  upsertSchedule,
  removeSchedule,
  getSchedule,
  getDueSchedules,
  markScheduleRan,
} from './scheduleManager';
import { ScheduleStore } from './scheduleTypes';

function makeTempFile(): string {
  return path.join(os.tmpdir(), `schedule-test-${Date.now()}.json`);
}

describe('loadScheduleStore', () => {
  it('returns empty store when file does not exist', () => {
    const store = loadScheduleStore('/nonexistent/path.json');
    expect(store.schedules).toEqual({});
  });

  it('loads existing store from file', () => {
    const tmp = makeTempFile();
    const data: ScheduleStore = {
      schedules: {
        svc1: { serviceId: 'svc1', intervalMinutes: 30, yamlPath: 'a.yaml', enabled: true },
      },
    };
    fs.writeFileSync(tmp, JSON.stringify(data), 'utf-8');
    const store = loadScheduleStore(tmp);
    expect(store.schedules['svc1'].serviceId).toBe('svc1');
    fs.unlinkSync(tmp);
  });
});

describe('saveScheduleStore / loadScheduleStore round-trip', () => {
  it('persists and reloads correctly', () => {
    const tmp = makeTempFile();
    const store: ScheduleStore = { schedules: {} };
    const updated = upsertSchedule(store, {
      serviceId: 'api',
      intervalMinutes: 60,
      yamlPath: 'api.yaml',
      enabled: true,
    });
    saveScheduleStore(tmp, updated);
    const loaded = loadScheduleStore(tmp);
    expect(loaded.schedules['api'].intervalMinutes).toBe(60);
    fs.unlinkSync(tmp);
  });
});

describe('upsertSchedule', () => {
  it('adds a new schedule with nextRunAt set', () => {
    const store: ScheduleStore = { schedules: {} };
    const updated = upsertSchedule(store, {
      serviceId: 'svc',
      intervalMinutes: 15,
      yamlPath: 'svc.yaml',
      enabled: true,
    });
    expect(updated.schedules['svc']).toBeDefined();
    expect(updated.schedules['svc'].nextRunAt).toBeDefined();
  });
});

describe('removeSchedule', () => {
  it('removes an existing schedule', () => {
    let store: ScheduleStore = { schedules: {} };
    store = upsertSchedule(store, { serviceId: 'x', intervalMinutes: 5, yamlPath: 'x.yaml', enabled: true });
    store = removeSchedule(store, 'x');
    expect(store.schedules['x']).toBeUndefined();
  });
});

describe('getDueSchedules', () => {
  it('returns schedules whose nextRunAt is in the past', () => {
    const past = new Date(Date.now() - 1000).toISOString();
    const store: ScheduleStore = {
      schedules: {
        due: { serviceId: 'due', intervalMinutes: 1, yamlPath: 'd.yaml', enabled: true, nextRunAt: past },
        future: { serviceId: 'future', intervalMinutes: 60, yamlPath: 'f.yaml', enabled: true, nextRunAt: new Date(Date.now() + 99999).toISOString() },
      },
    };
    const due = getDueSchedules(store);
    expect(due.map((s) => s.serviceId)).toContain('due');
    expect(due.map((s) => s.serviceId)).not.toContain('future');
  });
});

describe('markScheduleRan', () => {
  it('updates lastRunAt and advances nextRunAt', () => {
    let store: ScheduleStore = { schedules: {} };
    store = upsertSchedule(store, { serviceId: 'svc', intervalMinutes: 10, yamlPath: 's.yaml', enabled: true });
    const before = store.schedules['svc'].nextRunAt;
    store = markScheduleRan(store, 'svc');
    expect(store.schedules['svc'].lastRunAt).toBeDefined();
    expect(store.schedules['svc'].nextRunAt).not.toBe(before);
  });
});
