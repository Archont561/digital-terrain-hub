import { test as base, expect } from "@playwright/test";
import { type NetworkFixture, createNetworkFixture } from "@msw/playwright";
import { ToastHelper } from "./toast";
import { ActionContextManager } from "./action";
import { ConsoleHelper } from "./console";
import { ClipboardHelper } from "./clipboard";
export { ComponentPageNavigator, type ComponentConfig } from "./components";


export type BaseFixtures = {
  network: NetworkFixture;
  toast: ToastHelper;
  ctx: {
    action: (actionName: string) => ActionContextManager;
  },
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
      action: (actionName: string) => ActionContextManager.with({ page, network, actionName }),
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
