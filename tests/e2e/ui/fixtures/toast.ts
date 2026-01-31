import type { Page, Locator } from "@playwright/test";
import { expect } from "@playwright/test";

export type ToastVariant = "default" | "success" | "error" | "warning" | "info" | "loading";
export type ToastOptions = { title?: string | RegExp; description?: string | RegExp };
export type ToastInput = string | RegExp | ToastOptions;

export class ToastHelper {
  constructor(private readonly page: Page) {}

  private get viewport(): Locator {
    return this.page.locator('[data-slot="toast-viewport"]');
  }
  
  find(variant?: ToastVariant, text?: string | RegExp): Locator {
    // 1. Base Selector: Must be a DIV (not template) and have an ID (rendered instance)
    let selector = 'div[data-slot="toast"][data-toast-id]';

    // 2. Variant Filter: The template logic ensures data-variant is present
    if (variant && variant !== 'loading') {
      selector += `[data-variant="${variant}"]`;
    }

    let toast = this.viewport.locator(selector);

    // 3. Loading Filter: visual check for spinner
    if (variant === 'loading') {
      toast = toast.filter({ has: this.page.locator('.animate-spin') });
    }

    // 4. Text Filter: specific content check
    if (text) {
      toast = toast.filter({ hasText: text });
    }

    return toast.first();
  }

  title(toast: Locator): Locator {
    return toast.locator('[data-toast-title-text]');
  }

  description(toast: Locator): Locator {
    return toast.locator('[data-slot="toast-description"]');
  }

  async expect(variant: ToastVariant, input?: ToastInput): Promise<Locator> {
    const filterText = this._resolveFilterText(input);
    const toast = this.find(variant, filterText);

    // Ensure it exists and is visible (handles animation timing)
    await this._waitForVisibility(toast, variant, filterText);

    // Verify specific fields if provided
    await this._verifyContentDetails(toast, input);

    return toast;
  }

  private _resolveFilterText(input?: ToastInput): string | RegExp | undefined {
    if (!input) return undefined;
    if (typeof input === 'string' || input instanceof RegExp) return input;
    return input.title;
  }

  private async _waitForVisibility(toast: Locator, variant: string, filterText?: string | RegExp): Promise<void> {
    try {
      // Playwright will poll this until the 'requestAnimationFrame' in your app completes
      await expect(toast, `Expected ${variant} toast to be visible`).toBeVisible({ timeout: 10000 });
    } catch (error) {
      await this._reportMissingToast(variant, filterText);
      throw error;
    }
  }
  
  private async _reportMissingToast(expectedVariant: string, expectedText?: string | RegExp): Promise<void> {
    console.log(`\n❌ Toast assertion failed for variant: "${expectedVariant}" with text: "${expectedText}"`);
    
    // Look for ANY rendered toast (has ID)
    const anyToast = this.viewport.locator('div[data-slot="toast"][data-toast-id]');
    const count = await anyToast.count();

    if (count > 0) {
      const texts = await anyToast.allInnerTexts();
      console.log(`⚠️  Found ${count} active toast(s) in DOM:`);
      texts.forEach((t, i) => console.log(`   [${i + 1}] Content: "${t.replace(/\n/g, ' ')}"`));
      console.log(`   (If content matches, check for extra whitespace or regex issues)`);
    } else {
      console.log(`⚠️  NO active toasts found. The application logic likely failed to reach renderToast().`);
    }
  }

  private async _verifyContentDetails(toast: Locator, input?: ToastInput): Promise<void> {
    if (typeof input !== 'object' || input instanceof RegExp) return;

    if (input.title) {
      await expect(this.title(toast)).toHaveText(input.title);
    }
    
    if (input.description) {
      await expect(this.description(toast)).toHaveText(input.description);
    }
  }

  // Shortcuts
  success(input?: ToastInput) { return this.expect("success", input); }
  error(input?: ToastInput) { return this.expect("error", input); }
  warning(input?: ToastInput) { return this.expect("warning", input); }
  info(input?: ToastInput) { return this.expect("info", input); }
  loading(input?: ToastInput) { return this.expect("loading", input); }
}