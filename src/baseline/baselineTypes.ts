/**
 * Types for the baseline feature.
 * A baseline is a known-good snapshot of a service config
 * captured at a specific point in time for drift comparison.
 */

export interface BaselineEntry {
  /** The flattened or raw config object captured as the baseline */
  config: Record<string, unknown>;
  /** ISO timestamp of when the baseline was captured */
  capturedAt: string;
  /** Optional human-readable note about this baseline */
  note?: string;
}

export interface BaselineStore {
  /** Map of service name -> baseline entry */
  baselines: Record<string, BaselineEntry>;
}

export type BaselineAction = "capture" | "compare" | "remove" | "list";

export interface BaselineCommandOptions {
  /** Path to the YAML config file to capture or compare against */
  yamlPath?: string;
  /** Path to the JSON file used to persist baseline entries */
  baselinePath?: string;
  /** Output results as JSON instead of human-readable text */
  json?: boolean;
  /** Human-readable note to attach when capturing a baseline */
  note?: string;
  /** Service name to target; if omitted, all services may be affected */
  service?: string;
}
