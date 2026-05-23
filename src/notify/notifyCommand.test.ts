import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { runNotifyCommand } from "./notifyCommand";

function makeTempFile(content: string, ext = ".json"): string {
  const tmp = path.join(os.tmpdir(), `driftlog-test-${Date.now()}${ext}`);
  fs.writeFileSync(tmp, content, "utf-8");
  return tmp;
}

describe("runNotifyCommand", () => {
  let storeFile: string;

  beforeEach(() => {
    storeFile = makeTempFile(JSON.stringify({}));
    process.env.NOTIFY_STORE = storeFile;
  });

  afterEach(() => {
    if (fs.existsSync(storeFile)) fs.unlinkSync(storeFile);
    delete process.env.NOTIFY_STORE;
  });

  it("sets a notify config for a service", async () => {
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    await runNotifyCommand(["set", "my-service", "https://hooks.example.com/abc"]);
    const store = JSON.parse(fs.readFileSync(storeFile, "utf-8"));
    expect(store["my-service"]).toBeDefined();
    expect(store["my-service"].webhookUrl).toBe("https://hooks.example.com/abc");
    expect(store["my-service"].onDriftOnly).toBe(false);
    logSpy.mockRestore();
  });

  it("sets onDriftOnly flag when --on-drift-only is passed", async () => {
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    await runNotifyCommand(["set", "svc", "https://hooks.example.com/xyz", "--on-drift-only"]);
    const store = JSON.parse(fs.readFileSync(storeFile, "utf-8"));
    expect(store["svc"].onDriftOnly).toBe(true);
    logSpy.mockRestore();
  });

  it("exits with error if set args are missing", async () => {
    const exitSpy = jest.spyOn(process, "exit").mockImplementation(() => { throw new Error("exit"); });
    const errSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expect(runNotifyCommand(["set", "only-name"])).rejects.toThrow("exit");
    exitSpy.mockRestore();
    errSpy.mockRestore();
  });

  it("exits with error for unknown subcommand", async () => {
    const exitSpy = jest.spyOn(process, "exit").mockImplementation(() => { throw new Error("exit"); });
    const errSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expect(runNotifyCommand(["unknown"])).rejects.toThrow("exit");
    exitSpy.mockRestore();
    errSpy.mockRestore();
  });

  it("exits with error if send config is missing", async () => {
    const yamlFile = makeTempFile("env: production\nreplicas: 2", ".yaml");
    const liveFile = makeTempFile(JSON.stringify({ env: "staging", replicas: 2 }));
    const exitSpy = jest.spyOn(process, "exit").mockImplementation(() => { throw new Error("exit"); });
    const errSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expect(runNotifyCommand(["send", "unknown-svc", yamlFile, liveFile])).rejects.toThrow("exit");
    fs.unlinkSync(yamlFile);
    fs.unlinkSync(liveFile);
    exitSpy.mockRestore();
    errSpy.mockRestore();
  });
});
