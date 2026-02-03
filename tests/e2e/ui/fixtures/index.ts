import { createNetworkFixture, type NetworkFixture } from "@msw/playwright";
import { test as base, expect } from "@playwright/test";
import { ActionContextManager } from "./action";
import { ClipboardHelper } from "./clipboard";
import { ConsoleHelper } from "./console";
import { ToastHelper } from "./toast";

export { ComponentPageNavigator } from "./components";

export type BaseFixtures = {
  network: NetworkFixture;
  toast: ToastHelper;
  ctx: {
    action: (actionName: string) => ActionContextManager;
  };
  console: ConsoleHelper;
  clipboard: ClipboardHelper;
};

const test = base.extend<BaseFixtures>({
  network: createNetworkFixture(),

  console: async ({}, use) => {
    await use(new ConsoleHelper());
  },

  clipboard: async ({ page }, use) => {
    await use(new ClipboardHelper(page));
  },

  toast: async ({ page }, use) => {
    await use(new ToastHelper(page));
  },

  ctx: async ({ page, network }, use) => {
    await use({
      action: (actionName: string) =>
        ActionContextManager.with({ page, network, actionName }),
    });
  },
});

test.beforeEach(async ({ console, page }) => {
  console.attach(page);
});

test.afterEach(async ({ console }) => {
  console.print();
});

export { test, expect };
