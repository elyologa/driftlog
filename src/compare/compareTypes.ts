export interface CompareOptions {
  serviceA: string;
  serviceB: string;
  snapshotFile: string;
  severity?: string;
}

export interface FieldDiff {
  key: string;
  valueA: unknown;
  valueB: unknown;
}

export interface CompareResult {
  serviceA: string;
  serviceB: string;
  onlyInA: string[];
  onlyInB: string[];
  different: FieldDiff[];
  identical: string[];
}
