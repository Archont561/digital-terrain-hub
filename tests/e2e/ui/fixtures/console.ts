import type { Page } from "@playwright/test";

export type CapturedConsoleLog = {
  type: string;
  text: string;
  location?: {
    url: string;
    lineNumber: number;
    columnNumber: number;
  };
};

export class ConsoleHelper {
  private logs: CapturedConsoleLog[] = [];
  private ignorePatterns = [/clerk/i, /vite/i, /astro/i];

  attach(page: Page) {
    page.on("console", (msg) => {
      const text = msg.text();
      if (!text) return;

      // Skip noisy framework logs
      if (this.ignorePatterns.some((p) => p.test(text))) {
        return;
      }

      this.logs.push({
        type: msg.type(),
        text,
      });
    });
  }

  getLogs() {
    return this.logs;
  }

  clear() {
    this.logs = [];
  }

  print(prefix = "Browser console") {
    if (!this.logs.length) return;

    console.log(`\n📣 ${prefix}:`);
    for (const log of this.logs) {
      console.log(
        `[${log.type}] ${log.text}` +
          (log.location?.url
            ? ` (${log.location.url}:${log.location.lineNumber})`
            : ""),
      );
    }
  }
}
