import * as fs from "fs";
import { searchHistory, formatSearchResults } from "./searchManager";
import { SearchOptions } from "./searchTypes";

export async function runSearchCommand(
  args: string[],
  historyFile: string,
  outputFormat: "text" | "json" = "text"
): Promise<void> {
  const options: SearchOptions = {};

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--service" && args[i + 1]) {
      options.service = args[++i];
    } else if (args[i] === "--key" && args[i + 1]) {
      options.key = args[++i];
    } else if (args[i] === "--severity" && args[i + 1]) {
      options.severity = args[++i] as SearchOptions["severity"];
    } else if (args[i] === "--since" && args[i + 1]) {
      options.since = new Date(args[++i]);
    } else if (args[i] === "--until" && args[i + 1]) {
      options.until = new Date(args[++i]);
    } else if (args[i] === "--limit" && args[i + 1]) {
      options.limit = parseInt(args[++i], 10);
    }
  }

  if (!fs.existsSync(historyFile)) {
    console.log("No history file found.");
    return;
  }

  const results = searchHistory(historyFile, options);

  if (outputFormat === "json") {
    console.log(JSON.stringify(results, null, 2));
  } else {
    const formatted = formatSearchResults(results);
    console.log(formatted);
  }
}
