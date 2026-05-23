/**
 * Represents a single service's ignore configuration.
 */
export interface IgnoreEntry {
  /** The service name this entry applies to. */
  serviceName: string;
  /** List of key patterns (dot-notation or glob) to ignore during drift detection. */
  ignoredKeys: string[];
  /** ISO timestamp of when the entry was last updated. */
  updatedAt: string;
}

/**
 * The full ignore store keyed by service name.
 */
export type IgnoreStore = Record<string, IgnoreEntry>;

/**
 * Options for evaluating whether a key should be ignored.
 */
export interface IgnoreEvalOptions {
  /** Service name to look up rules for. */
  serviceName: string;
  /** The flattened dot-notation key to test. */
  key: string;
}
