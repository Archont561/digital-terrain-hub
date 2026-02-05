import { randomUUID } from "node:crypto";
import type { Page, Request } from "@playwright/test";
import { test as baseTest, ComponentPageNavigator, expect } from "./fixtures";

/* -------------------------------------------------------------------------- */
/*                               Row Navigator                                */
/* -------------------------------------------------------------------------- */

class WorkspaceManagerRowNavigator {
  rootSelector = `[data-ninjaodm-component="WorkspaceTableRow"]`;
  selectors = {
    nameLabel: "label",
    nameInput: "input",
    editBtn: "a[href]",
    deleteBtn: "button:has(svg)",
    dateSpan: '[data-slot="table-cell"] span',
  } as const;
  page: Page;

  private rowIndex: number;

  constructor(page: Page, row = 0) {
    this.page = page;
    this.rowIndex = row;
  }

  get root() {
    return this.page.locator(this.rootSelector).nth(this.rowIndex);
  }

  $(selector: string) {
    return this.root.locator(selector);
  }

  get label() {
    return this.$(this.selectors.nameLabel);
  }

  get input() {
    return this.$(this.selectors.nameInput);
  }

  get editBtn() {
    return this.$(this.selectors.editBtn);
  }

  get deleteBtn() {
    return this.$(this.selectors.deleteBtn);
  }

  get dateSpan() {
    return this.$(this.selectors.dateSpan);
  }

  async enterEdit() {
    await this.label.click();
    await this.input.waitFor({ state: "visible" });
  }

  async rename(newName: string) {
    await this.enterEdit();
    await this.input.fill(newName);
    await this.input.press("Enter");
  }

  async delete() {
    await this.deleteBtn.click();
  }
}

/* -------------------------------------------------------------------------- */
/*                              Table Navigator                               */
/* -------------------------------------------------------------------------- */

class WorkspaceManagerNavigator extends ComponentPageNavigator<{
  baseEditUrl: string;
  workspaces: { uuid: string; name: string; created_at?: string }[];
}> {
  protected rootSelector = `[data-ninjaodm-component="WorkspaceManager"]`;
  protected readonly componentUrl = "/components/WorkspaceManager";

  protected readonly defaultProps = {
    baseEditUrl: "/edit-workspace",
    workspaces: [
      {
        uuid: randomUUID(),
        name: "Test Workspace 1",
        created_at: new Date().toISOString(),
      },
      {
        uuid: randomUUID(),
        name: "Test Workspace 2",
        created_at: new Date().toISOString(),
      },
    ],
  };

  protected readonly selectors = {
    title: "h2:has-text('Workspaces')",
    tableHeaders: "thead th",
    createBtn: 'button[x-show="!isEmpty"]',
    emptyStateRow: `[x-show="isEmpty"]`,
    rows: `[data-ninjaodm-component="WorkspaceTableRow"]`,
  } as const;

  get title() {
    return this.$(this.selectors.title);
  }

  get createBtn() {
    return this.$(this.selectors.createBtn);
  }

  row(index = 0) {
    return new WorkspaceManagerRowNavigator(this.page, index);
  }

  async waitForRows(count?: number) {
    const expectedCount = count ?? this.getProps().workspaces.length;
    await expect(this.page.locator(this.selectors.rows)).toHaveCount(expectedCount, {
      timeout: 10000,
    });
  }

  async rowsCount() {
    return this.page.locator(this.selectors.rows).count();
  }

  async getTableHeaders() {
    const headers = await this.page.locator(this.selectors.tableHeaders).allTextContents();
    return headers.map(h => h.trim());
  }
}

/* -------------------------------------------------------------------------- */
/*                             Action Helpers                                 */
/* -------------------------------------------------------------------------- */

const waitForAction = (page: Page, actionName: string) => {
  return page.waitForResponse((res) =>
    res.url().includes(`/_actions/${actionName}`) &&
    res.request().method() === 'POST'
  );
};

/* -------------------------------------------------------------------------- */
/*                                   Tests                                    */
/* -------------------------------------------------------------------------- */

const test = baseTest.extend<{
  workspaceManager: WorkspaceManagerNavigator;
}>({
  workspaceManager: async ({ page }, use) => {
    const nav = new WorkspaceManagerNavigator(page);
    await nav.goto();
    await nav.waitForRows();
    await use(nav);
  },
});

test.describe("WorkspaceManager", () => {
  test("renders workspace table with data", async ({ workspaceManager }) => {
    await test.step("verify table structure", async () => {
      const { workspaces } = workspaceManager.getProps();

      await expect(workspaceManager.root).toBeVisible();
      await expect(workspaceManager.title).toHaveText("Workspaces");
      await expect(workspaceManager.createBtn).toBeVisible();

      const headers = await workspaceManager.getTableHeaders();
      expect(headers).toEqual(["Name", "Created", "Actions"]);

      expect(await workspaceManager.rowsCount()).toBe(workspaces.length);
    });

    await test.step("verify row content", async () => {
      const { workspaces } = workspaceManager.getProps();
      const row = workspaceManager.row(0);

      await expect(row.label).toHaveText(workspaces[0].name);
      await expect(row.editBtn).toBeVisible();
      await expect(row.deleteBtn).toBeVisible();
      await expect(row.dateSpan).toBeVisible();
    });
  });

  test("creates a new workspace", async ({ page, workspaceManager }) => {
    let initialCount: number;

    await test.step("get initial state", async () => {
      initialCount = await workspaceManager.rowsCount();
    });

    await test.step("create workspace", async () => {
      const actionPromise = waitForAction(page, "createWorkspace");
      await workspaceManager.createBtn.click();
      await actionPromise;
    });

    await test.step("verify workspace added", async () => {
      await workspaceManager.waitForRows(initialCount + 1);
    });
  });

  test("updates workspace name", async ({ page, workspaceManager }) => {
    const newName = "Updated Workspace";

    await test.step("rename workspace", async () => {
      const row = workspaceManager.row(0);
      const actionPromise = waitForAction(page, "updateWorkspace");
      await row.rename(newName);
      await actionPromise;
    });

    await test.step("verify name updated", async () => {
      const row = workspaceManager.row(0);
      await expect(row.label).toHaveText(newName);
    });
  });

  test("deletes a workspace", async ({ page, workspaceManager }) => {
    let initialCount: number;

    await test.step("get initial state", async () => {
      initialCount = await workspaceManager.rowsCount();
    });

    await test.step("delete workspace", async () => {
      const row = workspaceManager.row(0);

      const actionPromise = waitForAction(page, "deleteWorkspace");
      row.delete();
      await actionPromise;
    });

    await test.step("verify workspace removed", async () => {
      await workspaceManager.waitForRows(initialCount - 1);
    });
  });
});