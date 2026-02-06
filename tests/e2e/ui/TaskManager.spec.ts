import { randomUUID } from "node:crypto";
import type { Page } from "@playwright/test";
import { test as baseTest, ComponentPageNavigator, expect } from "./fixtures";

/* -------------------------------------------------------------------------- */
/*                               Row Navigator                                */
/* -------------------------------------------------------------------------- */

class TaskManagerRowNavigator {
  rootSelector = `[data-ninjaodm-component="TaskTableRow"]`;

  selectors = {
    nameLabel: `[x-text*="task.name"]`,
    statusBadge: `[x-text*="task.humanStatus"]`,
    stepBadge: `[x-text*="task.humanStep"]`,
    dateSpan: `[x-text*="task.humanDate"]`,
    pauseBtn: `[x-show*="task.canPause"]`,
    resumeBtn: `[x-show*="task.canResume"]`,
    cancelBtn: `[x-show*="task.canCancel"]`,
    deleteBtn: `[x-show*="task.canDelete"]`,
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

  get nameLabel() {
    return this.$(this.selectors.nameLabel);
  }

  get statusBadge() {
    return this.$(this.selectors.statusBadge);
  }

  get stepBadge() {
    return this.$(this.selectors.stepBadge);
  }

  get pauseBtn() {
    return this.$(this.selectors.pauseBtn);
  }

  get resumeBtn() {
    return this.$(this.selectors.resumeBtn);
  }

  get cancelBtn() {
    return this.$(this.selectors.cancelBtn);
  }

  get deleteBtn() {
    return this.$(this.selectors.deleteBtn);
  }

  async pause() {
    await this.pauseBtn.click();
  }

  async resume() {
    await this.resumeBtn.click();
  }

  async cancel() {
    await this.cancelBtn.click();
  }

  async delete() {
    await this.deleteBtn.click();
  }
}

/* -------------------------------------------------------------------------- */
/*                              Table Navigator                               */
/* -------------------------------------------------------------------------- */

class TaskManagerNavigator extends ComponentPageNavigator<{
  workspaceUuid?: string;
  tasks: {
    uuid: string;
    workspace_uuid: string;
    name: string;
    status: string;
    step: string | null;
    created_at?: string;
  }[];
}> {
  protected rootSelector = `[data-ninjaodm-component="TaskManager"]`;
  protected readonly componentUrl = "/components/TaskManager";

  protected readonly defaultProps = {
    workspaceUuid: randomUUID(),
    tasks: [
      {
        uuid: randomUUID(),
        workspace_uuid: randomUUID(),
        name: "Test Task Running",
        status: "running",
        step: "opensfm",
        created_at: new Date().toISOString(),
      },
      {
        uuid: randomUUID(),
        workspace_uuid: randomUUID(),
        name: "Test Task Paused",
        status: "paused",
        step: "odm_meshing",
        created_at: new Date().toISOString(),
      },
      {
        uuid: randomUUID(),
        workspace_uuid: randomUUID(),
        name: "Test Task Completed",
        status: "completed",
        step: "odm_postprocess",
        created_at: new Date().toISOString(),
      },
    ],
  };

  protected readonly selectors = {
    title: "h2:has-text('Tasks')",
    emptyStateRow: `[x-show="isEmpty"]`,
    rows: `[data-ninjaodm-component="TaskTableRow"]`,
  } as const;

  get title() {
    return this.$(this.selectors.title);
  }

  row(index = 0) {
    return new TaskManagerRowNavigator(this.page, index);
  }

  async waitForRows(count?: number) {
    const expectedCount = count ?? this.getProps().tasks.length;
    await expect(this.page.locator(this.selectors.rows)).toHaveCount(
      expectedCount,
      { timeout: 10000 },
    );
  }

  async rowsCount() {
    return this.page.locator(this.selectors.rows).count();
  }

  get emptyRow() {
    return this.$(this.selectors.emptyStateRow);
  }
}

/* -------------------------------------------------------------------------- */
/*                             Action Helpers                                 */
/* -------------------------------------------------------------------------- */

const waitForAction = (page: Page, actionName: string) => {
  return page.waitForResponse(
    (res) =>
      res.url().includes(`/_actions/${actionName}`) &&
      res.request().method() === "POST",
  );
};

/* -------------------------------------------------------------------------- */
/*                                   Tests                                    */
/* -------------------------------------------------------------------------- */

const test = baseTest.extend<{
  taskManager: TaskManagerNavigator;
}>({
  taskManager: async ({ page }, use) => {
    const nav = new TaskManagerNavigator(page);

    await test.step("load TaskManager component", async () => {
      await nav.goto();
      await nav.waitForRows();
    });

    await use(nav);
  },
});

test.describe
  .serial("TaskManager", () => {
    test("shows empty state when no tasks", async ({ taskManager }) => {
      await test.step("load task manager with no tasks", async () => {
        await taskManager.goto({ tasks: [] });
      });

      await test.step("verify empty state is visible", async () => {
        await expect(taskManager.emptyRow).toBeVisible();
      });
    });

    test("renders task table with data", async ({ taskManager }) => {
      await test.step("verify task manager is visible", async () => {
        await expect(taskManager.root).toBeVisible();
      });

      await test.step("verify title", async () => {
        await expect(taskManager.title).toHaveText("Tasks");
      });

      await test.step("verify number of rows", async () => {
        const { tasks } = taskManager.getProps();
        expect(await taskManager.rowsCount()).toBe(tasks.length);
      });

      await test.step("shows correct badges for different statuses", async () => {
        // Wait for UI bufferStatus to render
        await expect(taskManager.row(0).statusBadge).toHaveText(/Running/i);
        await expect(taskManager.row(1).statusBadge).toHaveText(/Paused/i);
        await expect(taskManager.row(2).statusBadge).toHaveText(/Completed/i);

        await test.step("shows pause button only for running tasks", async () => {
          await expect(taskManager.row(0).pauseBtn).toBeVisible();
          await expect(taskManager.row(1).pauseBtn).not.toBeVisible();
        });

        await test.step("shows resume button only for paused tasks", async () => {
          await expect(taskManager.row(0).resumeBtn).not.toBeVisible();
          await expect(taskManager.row(1).resumeBtn).toBeVisible();
        });

        await test.step("shows delete button only for completed tasks", async () => {
          await expect(taskManager.row(0).deleteBtn).not.toBeVisible();
          await expect(taskManager.row(2).deleteBtn).toBeVisible();
        });
      });
    });

    test("handles actions correctly with bufferStatus", async ({
      page,
      taskManager,
    }) => {
      let row = taskManager.row(0);

      await test.step("pause running task", async () => {
        const actionPromise = waitForAction(page, "callTaskAction");
        await row.pause();
        await actionPromise;

        // Wait until bufferStatus updates to "Paused"
        await expect(row.statusBadge).toHaveText(/Paused/i);
      });

      row = taskManager.row(1);

      await test.step("resume paused task", async () => {
        const actionPromise = waitForAction(page, "callTaskAction");
        await row.resume();
        await actionPromise;

        // Wait until bufferStatus updates to "Running"
        await expect(row.statusBadge).toHaveText(/Running/i);
      });

      row = taskManager.row(0);

      await test.step("cancel paused task", async () => {
        const actionPromise = waitForAction(page, "callTaskAction");
        await row.cancel();
        await actionPromise;

        // Wait until bufferStatus updates to "Cancelled"
        await expect(row.statusBadge).toHaveText(/Cancelled/i);
      });

      let initialCount = 0;
      await test.step("capture initial row count", async () => {
        initialCount = await taskManager.rowsCount();
      });

      await test.step("delete completed task", async () => {
        const row = taskManager.row(2);
        const actionPromise = waitForAction(page, "deleteTask");
        await row.delete();
        await actionPromise;
      });

      await test.step("verify task removed from table", async () => {
        await taskManager.waitForRows(initialCount - 1);
      });
    });
  });
