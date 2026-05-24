import * as fs from "fs";
import * as path from "path";
import { DriftResult } from "../drift/types";
import { loadHistoryStore } from "../history/historyManager";
import { loadTagStore } from "../tag/tagManager";

export interface SearchQuery {
  service?: string;
  tag?: string;
  key?: string;
  severity?: "low" | "medium" | "high";
  since?: string; // ISO date string
}

export interface SearchResult {
  service: string;
  timestamp: string;
  drifts: DriftResult[];
}

export function searchHistory(
  query: SearchQuery,
  historyFile: string,
  tagFile: string
): SearchResult[] {
  const historyStore = loadHistoryStore(historyFile);
  const tagStore = loadTagStore(tagFile);

  const sinceDate = query.since ? new Date(query.since) : null;

  const results: SearchResult[] = [];

  for (const [service, entries] of Object.entries(historyStore)) {
    if (query.service && !service.includes(query.service)) continue;

    if (query.tag) {
      const tags = tagStore[service] ?? [];
      if (!tags.includes(query.tag)) continue;
    }

    for (const entry of entries) {
      if (sinceDate && new Date(entry.timestamp) < sinceDate) continue;

      let drifts = entry.drifts ?? [];

      if (query.severity) {
        drifts = drifts.filter((d) => d.severity === query.severity);
      }

      if (query.key) {
        drifts = drifts.filter((d) => d.key.includes(query.key!));
      }

      if (drifts.length > 0) {
        results.push({ service, timestamp: entry.timestamp, drifts });
      }
    }
  }

  return results.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

export function formatSearchResults(results: SearchResult[]): string {
  if (results.length === 0) return "No matching drift history found.";
  const lines: string[] = [];
  for (const r of results) {
    lines.push(`[${r.timestamp}] ${r.service} — ${r.drifts.length} drift(s)`);
    for (const d of r.drifts) {
      lines.push(`  [${d.severity}] ${d.key}: expected=${d.expected} actual=${d.actual}`);
    }
  }
  return lines.join("\n");
}
