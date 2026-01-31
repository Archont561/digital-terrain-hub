import { expect, type Locator, test as base, type Page } from "@playwright/test";
import { randomUUID } from "crypto";
import { type NetworkFixture, createNetworkFixture } from "@msw/playwright";
import { http, HttpResponse } from "msw";

// =======================
// TYPES
// =======================

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

type AlpineAttrLocator = {
  ref: (root: Locator, ref: string) => Locator;
  bind: (root: Locator, bind: string) => Locator;
};

type ToastLocator = {
  success: () => Locator;
  error: () => Locator;
  title: (toast: Locator) => Locator;
  description: (toast: Locator) => Locator;
  closeBtn: (toast: Locator) => Locator;
};

type Fixtures = {
  settings: Settings;
  gotoComponent: (propsOverride?: Partial<Settings["componentProps"]>) => Promise<Page>;
  getByAlpineAttr: AlpineAttrLocator;
  getToast: ToastLocator;
  network: NetworkFixture;
};

const test = base.extend<Fixtures>({
  network: createNetworkFixture(),

  settings: async ({}, use) => {
    await use({
      componentUrl: "/components/WorkspaceTableRow",
      selectors: {
        tableRow: ".ninjaodm-workspace-table-row",
      },
      componentProps: {
        workspace: {
          uuid: randomUUID(),
          name: "Test Workspace",
        },
        workspaceEditUrl: "/edit-workspace",
      },
    });
  },

  gotoComponent: async ({ page, settings }, use) => {
    await use(async (propsOverride?: Partial<Settings["componentProps"]>) => {
      const props = {
        ...settings.componentProps,
        ...propsOverride,
        workspace: {
          ...settings.componentProps.workspace,
          ...propsOverride?.workspace,
        },
      };
      const params = new URLSearchParams({
        props: encodeURIComponent(JSON.stringify(props)),
      });

      await page.goto(`${settings.componentUrl}?${params}`, {
        waitUntil: "domcontentloaded",
      });
      return page;
    });
  },

  getByAlpineAttr: async ({}, use) => {
    await use({
      ref: (root: Locator, ref: string) => root.locator(`[x-ref="${ref}"]`),
      bind: (root: Locator, bind: string) => root.locator(`[x-bind="${bind}"]`),
    });
  },

  getToast: async ({ page }, use) => {
    await use({
      success: () =>
        page.locator('[data-slot="toast"][data-variant="success"]').first(),
      error: () =>
        page.locator('[data-slot="toast"][data-variant="error"]').first(),
      title: (toast: Locator) =>
        toast.locator('[data-toast-title-text]'),
      description: (toast: Locator) =>
        toast.locator('[data-slot="toast-description"]'),
      closeBtn: (toast: Locator) =>
        toast.locator('button[data-slot="toast-close"]'),
    });
  },
});

// =======================
// HAPPY PATH TESTS
// =======================

test.describe.serial("WorkspaceTableRow - Happy Paths", () => {
  test("should render WorkspaceRow in normal mode", async ({
    settings,
    gotoComponent,
    getByAlpineAttr,
  }) => {
    const page = await gotoComponent();

    const row = page.locator(settings.selectors.tableRow).first();

    await expect(row).toBeVisible();
    expect(await row.getAttribute("x-data")).toContain(JSON.stringify(settings.componentProps.workspace));

    const label = getByAlpineAttr.bind(row, "workspaceNameLabel");
    await expect(label).toBeVisible();
    await expect(label).toHaveText(settings.componentProps.workspace.name);

    const input = getByAlpineAttr.bind(row, "workspaceNameInput");
    await expect(input).toBeHidden();

    const editBtn = row.locator(
      `a[href="${settings.componentProps.workspaceEditUrl}/${settings.componentProps.workspace.uuid}"]`
    );
    await expect(editBtn).toBeVisible();
    await expect(editBtn).toHaveText("Edit");

    const deleteBtn = getByAlpineAttr.bind(row, "deleteWorkspaceBtn");
    await expect(deleteBtn).toBeVisible();
    await expect(deleteBtn).toHaveText("Delete");
  });

  test("should switch to editing mode when clicking label", async ({
    settings,
    gotoComponent,
    getByAlpineAttr,
  }) => {
    const page = await gotoComponent();

    const row = page.locator(settings.selectors.tableRow).first();
    const label = getByAlpineAttr.bind(row, "workspaceNameLabel");
    const input = getByAlpineAttr.bind(row, "workspaceNameInput");

    await expect(label).toBeVisible();
    await expect(input).toBeHidden();

    await label.click();

    await expect(label).toBeHidden();
    await expect(input).toBeVisible();
  });

  test.skip("should cancel editing when clicking away", async ({
    settings,
    gotoComponent,
    getByAlpineAttr,
  }) => {
    const page = await gotoComponent();

    const row = page.locator(settings.selectors.tableRow).first();
    const label = getByAlpineAttr.bind(row, "workspaceNameLabel");
    const input = getByAlpineAttr.bind(row, "workspaceNameInput");

    await label.click();
    await expect(input).toBeVisible();

    await page.locator("body").click({ position: { x: 0, y: 0 } });

    await expect(label).toBeVisible();
    await expect(input).toBeHidden();
  });

  test("edit button should redirect to /edit-workspace/{workspaceUuid}", async ({
    settings,
    gotoComponent,
  }) => {
    const page = await gotoComponent();

    const expectedURL = `${settings.componentProps.workspaceEditUrl}/${settings.componentProps.workspace.uuid}`;
    const row = page.locator(settings.selectors.tableRow).first();

    const editBtn = row.locator('a:has-text("Edit")');
    await editBtn.click();

    await expect(page).toHaveURL(expectedURL);
  });

  test("should update workspace name on Enter", async ({
    network,
    settings,
    gotoComponent,
    getByAlpineAttr,
  }) => {
    network.use(
      http.post("**/_actions/updateWorkspace", () => {
        return new HttpResponse(null, { status: 204 });
      })
    );

    const page = await gotoComponent();

    const row = page.locator(settings.selectors.tableRow).first();
    const label = getByAlpineAttr.bind(row, "workspaceNameLabel");
    const input = getByAlpineAttr.bind(row, "workspaceNameInput");
    const newName = "Updated Workspace Name";

    await label.click();
    await expect(input).toBeVisible();

    await input.fill(newName);
    await input.press("Enter");

    // Wait for the action to complete
    await page.waitForResponse((response) => response.url().includes('/_actions/updateWorkspace') && response.ok());
    
    await expect(input).not.toBeFocused();

    // Should exit editing mode and show updated name
    await expect(label).toBeVisible();
    await expect(label).toHaveText(newName);
  });

  test("should remove row from DOM when delete button is clicked", async ({
    network,
    settings,
    gotoComponent,
    getByAlpineAttr,
  }) => {
    network.use(
      http.post("**/_actions/deleteWorkspace", () => {
        return new HttpResponse(null, { status: 204 });
      })
    );

    const page = await gotoComponent();

    const row = page.locator(settings.selectors.tableRow).first();
    const deleteBtn = getByAlpineAttr.bind(row, "deleteWorkspaceBtn");

    await expect(row).toBeVisible();
    const initialCount = await page.locator(settings.selectors.tableRow).count();
    expect(initialCount).toBe(1);

    await deleteBtn.click();
    await page.waitForResponse((response) => response.url().includes('/_actions/deleteWorkspace'));

    // Wait for removal
    await expect(row).not.toBeAttached();
    const finalCount = await page.locator(settings.selectors.tableRow).count();
    expect(finalCount).toBe(0);
  });
});