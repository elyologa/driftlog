import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import {
  loadNotifyStore,
  saveNotifyStore,
  setNotifyConfig,
  buildWebhookPayload,
  notifyIfDrift,
} from "./notifyManager";
import { DriftResult } from "../drift/types";

function makeTempFile(): string {
  return path.join(os.tmpdir(), `notify-test-${Date.now()}.json`);
}

const driftedResult: DriftResult = {
  service: "api",
  drifted: true,
  differences: [{ key: "image", expected: "v1", actual: "v2" }],
};

const cleanResult: DriftResult = {
  service: "worker",
  drifted: false,
  differences: [],
};

describe("loadNotifyStore", () => {
  it("returns default store when file does not exist", () => {
    const store = loadNotifyStore("/nonexistent/path.json");
    expect(store.config.onDriftOnly).toBe(true);
    expect(store.config.webhook).toBeUndefined();
  });

  it("loads existing store from file", () => {
    const tmp = makeTempFile();
    fs.writeFileSync(tmp, JSON.stringify({ config: { webhook: "http://example.com", onDriftOnly: false } }));
    const store = loadNotifyStore(tmp);
    expect(store.config.webhook).toBe("http://example.com");
    expect(store.config.onDriftOnly).toBe(false);
    fs.unlinkSync(tmp);
  });
});

describe("setNotifyConfig", () => {
  it("merges new config into existing store", () => {
    const tmp = makeTempFile();
    setNotifyConfig(tmp, { webhook: "http://hooks.example.com" });
    const store = loadNotifyStore(tmp);
    expect(store.config.webhook).toBe("http://hooks.example.com");
    expect(store.config.onDriftOnly).toBe(true);
    fs.unlinkSync(tmp);
  });
});

describe("buildWebhookPayload", () => {
  it("includes only drifted services", () => {
    const payload = buildWebhookPayload([driftedResult, cleanResult]);
    expect(payload.totalServices).toBe(2);
    expect(payload.driftedServices).toBe(1);
    expect((payload.services as unknown[]).length).toBe(1);
  });

  it("returns empty services array when no drift", () => {
    const payload = buildWebhookPayload([cleanResult]);
    expect(payload.driftedServices).toBe(0);
    expect((payload.services as unknown[]).length).toBe(0);
  });
});

describe("notifyIfDrift", () => {
  it("returns false when no webhook is configured", async () => {
    const tmp = makeTempFile();
    const result = await notifyIfDrift(tmp, [driftedResult]);
    expect(result).toBe(false);
    fs.unlinkSync(tmp);
  });

  it("returns false when onDriftOnly is true and no drift detected", async () => {
    const tmp = makeTempFile();
    setNotifyConfig(tmp, { webhook: "http://example.com", onDriftOnly: true });
    const result = await notifyIfDrift(tmp, [cleanResult]);
    expect(result).toBe(false);
    fs.unlinkSync(tmp);
  });
});
