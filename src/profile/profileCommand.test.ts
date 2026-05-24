import fs from "fs";
import os from "os";
import path from "path";
import { runProfileCommand } from "./profileCommand";
import { loadProfileStore, upsertProfile, saveProfileStore } from "./profileManager";

function makeTempFile(): string {
  return path.join(os.tmpdir(), `profile-cmd-test-${Date.now()}.json`);
}

describe("runProfileCommand", () => {
  let tmp: string;
  let logSpy: jest.SpyInstance;
  let errSpy: jest.SpyInstance;

  beforeEach(() => {
    tmp = makeTempFile();
    logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    errSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    process.exitCode = 0;
  });

  afterEach(() => {
    logSpy.mockRestore();
    errSpy.mockRestore();
    if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
  });

  it("adds a new profile", () => {
    runProfileCommand(["my-service"], { yaml: "./my-service.yaml" }, tmp);
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("my-service"));
    const store = loadProfileStore(tmp);
    expect(store.profiles["my-service"]).toBeDefined();
  });

  it("lists profiles", () => {
    const store = loadProfileStore(tmp);
    upsertProfile(store, "svc-x", "./x.yaml");
    saveProfileStore(tmp, store);
    runProfileCommand([], { list: true }, tmp);
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("svc-x"));
  });

  it("shows empty list message", () => {
    runProfileCommand([], { list: true }, tmp);
    expect(logSpy).toHaveBeenCalledWith("No service profiles found.");
  });

  it("shows a specific profile as JSON", () => {
    const store = loadProfileStore(tmp);
    upsertProfile(store, "svc-y", "./y.yaml");
    saveProfileStore(tmp, store);
    runProfileCommand([], { show: "svc-y" }, tmp);
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("svc-y"));
  });

  it("errors when showing unknown profile", () => {
    runProfileCommand([], { show: "ghost" }, tmp);
    expect(errSpy).toHaveBeenCalledWith(expect.stringContaining("ghost"));
    expect(process.exitCode).toBe(1);
  });

  it("removes an existing profile", () => {
    const store = loadProfileStore(tmp);
    upsertProfile(store, "svc-z", "./z.yaml");
    saveProfileStore(tmp, store);
    runProfileCommand(["svc-z"], { remove: true }, tmp);
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("svc-z"));
    const updated = loadProfileStore(tmp);
    expect(updated.profiles["svc-z"]).toBeUndefined();
  });

  it("errors when removing unknown profile", () => {
    runProfileCommand(["nobody"], { remove: true }, tmp);
    expect(errSpy).toHaveBeenCalled();
    expect(process.exitCode).toBe(1);
  });

  it("errors when no yaml provided for add", () => {
    runProfileCommand(["svc-missing-yaml"], {}, tmp);
    expect(errSpy).toHaveBeenCalledWith(expect.stringContaining("--yaml"));
    expect(process.exitCode).toBe(1);
  });
});
