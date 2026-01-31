import type { Page } from '@playwright/test';

export class ClipboardHelper {
  constructor(private page: Page) {}

  async read() {
    return await this.page.evaluate(() => navigator.clipboard.readText());
  }

  async write(text: string) {
    await this.page.evaluate((value) => {
      return navigator.clipboard.writeText(value);
    }, text);
  }

  async expectContains(value: string) {
    const text = await this.read();
    if (!text.includes(value)) {
      throw new Error(
        `Expected clipboard to contain "${value}", but got:\n${text}`
      );
    }
  }
}
