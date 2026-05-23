import { runBaselineCommand } from "./baselineCommand";
import * as baselineManager from "./baselineManager";
import * as yamlParser from "../parser/yamlParser";
import * as detector from "../drift/detector";
import * as reporter from "../drift/reporter";

jest.mock("./baselineManager");
jest.mock("../parser/yamlParser");
jest.mock("../drift/detector");
jest.mock("../drift/reporter");

const mockStore = { baselines: {} };
const mockConfig = { image: "nginx:1.21", replicas: 2 };

beforeEach(() => {
  jest.clearAllMocks();
  (baselineManager.loadBaselineStore as jest.Mock).mockReturnValue(mockStore);
  (baselineManager.saveBaselineStore as jest.Mock).mockReturnValue(undefined);
  (baselineManager.captureBaseline as jest.Mock).mockReturnValue(mockStore);
  (baselineManager.removeBaseline as jest.Mock).mockReturnValue(mockStore);
  (yamlParser.parseYamlFile as jest.Mock).mockReturnValue(mockConfig);
  (detector.detectDrift as jest.Mock).mockReturnValue([]);
  (reporter.formatReport as jest.Mock).mockReturnValue("No drift detected.");
});

describe("runBaselineCommand", () => {
  it("capture: saves baseline and logs confirmation", async () => {
    const spy = jest.spyOn(console, "log").mockImplementation();
    await runBaselineCommand("capture", "svc-a", {
      yamlPath: "svc-a.yaml",
      baselinePath: "baselines.json",
    });
    expect(baselineManager.captureBaseline).toHaveBeenCalledWith(
      mockStore,
      "svc-a",
      mockConfig
    );
    expect(spy).toHaveBeenCalledWith("Baseline captured for service: svc-a");
    spy.mockRestore();
  });

  it("compare: detects drift against baseline", async () => {
    const baseline = { config: mockConfig, capturedAt: "2024-01-01T00:00:00Z" };
    (baselineManager.getBaseline as jest.Mock).mockReturnValue(baseline);
    const spy = jest.spyOn(console, "log").mockImplementation();
    await runBaselineCommand("compare", "svc-a", {
      yamlPath: "svc-a.yaml",
      baselinePath: "baselines.json",
    });
    expect(detector.detectDrift).toHaveBeenCalledWith(
      "svc-a",
      baseline.config,
      mockConfig
    );
    expect(reporter.formatReport).toHaveBeenCalled();
    spy.mockRestore();
  });

  it("compare: exits if no baseline found", async () => {
    (baselineManager.getBaseline as jest.Mock).mockReturnValue(null);
    const exitSpy = jest.spyOn(process, "exit").mockImplementation(() => { throw new Error("exit"); });
    const errSpy = jest.spyOn(console, "error").mockImplementation();
    await expect(
      runBaselineCommand("compare", "svc-missing", {
        yamlPath: "svc.yaml",
        baselinePath: "baselines.json",
      })
    ).rejects.toThrow("exit");
    exitSpy.mockRestore();
    errSpy.mockRestore();
  });

  it("remove: removes baseline and logs confirmation", async () => {
    const spy = jest.spyOn(console, "log").mockImplementation();
    await runBaselineCommand("remove", "svc-a", { baselinePath: "baselines.json" });
    expect(baselineManager.removeBaseline).toHaveBeenCalledWith(mockStore, "svc-a");
    expect(spy).toHaveBeenCalledWith("Baseline removed for service: svc-a");
    spy.mockRestore();
  });

  it("list: prints stored baseline names", async () => {
    const storeWithBaselines = {
      baselines: {
        "svc-a": { config: mockConfig, capturedAt: "2024-01-01T00:00:00Z" },
      },
    };
    (baselineManager.loadBaselineStore as jest.Mock).mockReturnValue(storeWithBaselines);
    const spy = jest.spyOn(console, "log").mockImplementation();
    await runBaselineCommand("list", "", { baselinePath: "baselines.json" });
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("svc-a"));
    spy.mockRestore();
  });

  it("unknown action: exits with error", async () => {
    const exitSpy = jest.spyOn(process, "exit").mockImplementation(() => { throw new Error("exit"); });
    const errSpy = jest.spyOn(console, "error").mockImplementation();
    await expect(
      runBaselineCommand("bogus", "svc-a", {})
    ).rejects.toThrow("exit");
    exitSpy.mockRestore();
    errSpy.mockRestore();
  });
});
