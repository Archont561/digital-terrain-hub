import { test as base, expect } from "@playwright/test";
import { createMockServer } from "./prism-mock-server";
import { ClipboardHelper } from "./clipboard";
import { ConsoleHelper } from "./console";
import { ToastHelper } from "./toast";
export { ComponentPageNavigator } from "./components";
import path from "node:path";

const PATH_TO_NINJAODM_OPENAPI_SPEC = path.resolve(
  import.meta.dirname,
  "../../../../src/assets/ninjaodm.openapi.json",
);

export type BaseFixtures = {
  toast: ToastHelper;
  console: ConsoleHelper;
  clipboard: ClipboardHelper;
};

type WorkerFixtures = {
  ninjaodmMockServer: Awaited<ReturnType<typeof createMockServer>>;
};

const test = base.extend<BaseFixtures, WorkerFixtures>({
  console: async ({}, use) => {
    await use(new ConsoleHelper());
  },

  clipboard: async ({ page }, use) => {
    await use(new ClipboardHelper(page));
  },

  toast: async ({ page }, use) => {
    await use(new ToastHelper(page));
  },

  ninjaodmMockServer: [
    async ({}, use) => {
      const mockServer = await createMockServer(PATH_TO_NINJAODM_OPENAPI_SPEC);
      const { port, hostname } = new URL(
        process.env.NINJAODM_BASE_URL || "http://localhost:4010",
      );
      mockServer.listen(Number(port), hostname);
      await use(mockServer);
      await mockServer.close();
    },
    { scope: "worker" },
  ],
});

test.beforeAll(async ({ ninjaodmMockServer }) => {
  ninjaodmMockServer;
});

test.beforeEach(async ({ console, page }) => {
  console.attach(page);
});

test.afterEach(async ({ console }) => {
    console.print();
});

export { test, expect };
