import { expect, type Locator, test as base } from "@playwright/test";

type Settings = {
  componentUrl: string;
  selectors: {
    tableRow: string;
  };
  componentProps: {
    workspace: {
      uuid: string;
      name: string;
    };
    workspaceEditUrl: string;
  };
};

type Fixtures = {
  settings: Settings;
  gotoComponent: () => Promise<void>;
  alpineRef: (root: Locator, ref: string) => Locator;
  waitForAlpineInit: () => Promise<void>;
};

const test = base.extend<Fixtures>({
  settings: async ({}, use) => {
    await use({
      componentUrl: "/components/WorkspaceTableRow",
      selectors: {
        tableRow: ".ninjaodm-workspace-table-row",
      },
      componentProps: {
        workspace: {
          uuid: "test-workspace-uuid",
          name: "test-workspace-name",
        },
       workspaceEditUrl: "/edit-workspace",
      },
    });
  },

  waitForAlpineInit: async ({ page }, use) => {
    // Install listener BEFORE navigation
    await page.addInitScript(() => {
      (window as any).__alpineInitialized = false;

      document.addEventListener("alpine:initialized", () => {
        (window as any).__alpineInitialized = true;
      });
    });

    await use(async () => {
      await page.waitForFunction(
        () => (window as any).Alpine && (window as any).__alpineInitialized === true,
      );
    });
  },

  gotoComponent: async ({ page, settings, waitForAlpineInit }, use) => {
    await use(async () => {
      const params = new URLSearchParams({
        props: encodeURIComponent(
          JSON.stringify(settings.componentProps),
        ),
      });
      await page.goto(
        `${settings.componentUrl}?${params}`,
      );
      await waitForAlpineInit();
    });
  },

  alpineRef: async ({}, use) => {
    await use((root: Locator, ref: string) =>
      root.locator(`[x-ref="${ref}"]`),
    );
  },
});

test.describe.serial("WorkspaceTableRow", () => {
  test("should render WorkspaceRow", async ({
    page,
    settings,
    gotoComponent,
    alpineRef,
  }) => {
    await gotoComponent();

    const row = page
      .locator(settings.selectors.tableRow)
      .first();

    await expect(row).toBeVisible();
    await expect(row).toHaveAttribute(
      "data-workspace-uuid",
      settings.componentProps.workspace.uuid,
    );

    await expect(
      alpineRef(row, "workspaceNameInput"),
    ).toHaveValue(settings.componentProps.workspace.name);

    await expect(
      alpineRef(row, "editWorkspaceBtn"),
    ).toBeVisible();

    await expect(
      alpineRef(row, "deleteWorkspaceBtn"),
    ).toBeVisible();
  });
});
