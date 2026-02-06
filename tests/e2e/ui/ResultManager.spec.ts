import { randomUUID } from "node:crypto";
import type { Page } from "@playwright/test";
import { test as baseTest, ComponentPageNavigator, expect } from "./fixtures";

/* -------------------------------------------------------------------------- */
/*                               Row Navigator                                */
/* -------------------------------------------------------------------------- */

class ResultManagerRowNavigator {
  rootSelector = `[data-ninjaodm-component="ResultTableRow"]`;
  selectors = {
    typeLabel: "label",
    dateSpan: '[x-text="result.humanDate"]',
    downloadBtn: `button[x-on\\:click="result.download()"]`,
    shareBtn: `button[x-show="!result.isShared"]`,
    copyBtn: `button[x-show="result.isShared"]`,
    deleteBtn: `button[x-on\\:click="deleteResult(result)"]`,
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

  get typeLabel() {
    return this.$(this.selectors.typeLabel);
  }

  get dateSpan() {
    return this.$(this.selectors.dateSpan);
  }

  get downloadBtn() {
    return this.$(this.selectors.downloadBtn);
  }

  get shareBtn() {
    return this.$(this.selectors.shareBtn);
  }

  get copyBtn() {
    return this.$(this.selectors.copyBtn);
  }

  get deleteBtn() {
    return this.$(this.selectors.deleteBtn);
  }

  async download() {
    await this.downloadBtn.click();
  }

  async share() {
    await this.shareBtn.click();
  }

  async copyShareLink() {
    await this.copyBtn.click();
  }

  async delete() {
    await this.deleteBtn.click();
  }
}

/* -------------------------------------------------------------------------- */
/*                              Table Navigator                               */
/* -------------------------------------------------------------------------- */

class ResultManagerNavigator extends ComponentPageNavigator<{
  downloadResultUrlTemplate: string;
  shareResultUrlTemplate: string;
  results: {
    uuid: string;
    workspace_uuid: string;
    result_type: string;
    created_at?: string;
  }[];
}> {
  protected rootSelector = `[data-ninjaodm-component="ResultManager"]`;
  protected readonly componentUrl = "/components/ResultManager";

  protected readonly defaultProps = {
    downloadResultUrlTemplate: "/api/results/{uuid}/download",
    shareResultUrlTemplate: "/api/results/{uuid}/share?key={api_key}",
    results: [
      {
        uuid: randomUUID(),
        workspace_uuid: randomUUID(),
        result_type: "point_cloud_ply",
        created_at: new Date().toISOString(),
      },
      {
        uuid: randomUUID(),
        workspace_uuid: randomUUID(),
        result_type: "orthophoto_geotiff",
        created_at: new Date().toISOString(),
      },
      {
        uuid: randomUUID(),
        workspace_uuid: randomUUID(),
        result_type: "textured_model",
        created_at: new Date().toISOString(),
      },
    ],
  };

  protected readonly selectors = {
    title: "h2:has-text('Results')",
    tableHeaders: "thead th",
    emptyStateRow: `[x-show="isEmpty"]`,
    rows: `[data-ninjaodm-component="ResultTableRow"]`,
  } as const;

  get title() {
    return this.$(this.selectors.title);
  }

  get emptyState() {
    return this.$(this.selectors.emptyStateRow);
  }

  row(index = 0) {
    return new ResultManagerRowNavigator(this.page, index);
  }

  async waitForRows(count?: number) {
    const expectedCount = count ?? this.getProps().results.length;
    await expect(this.page.locator(this.selectors.rows)).toHaveCount(
      expectedCount,
      {
        timeout: 10000,
      },
    );
  }

  async rowsCount() {
    return this.page.locator(this.selectors.rows).count();
  }

  async getTableHeaders() {
    const headers = await this.page
      .locator(this.selectors.tableHeaders)
      .allTextContents();
    return headers.map((h) => h.trim());
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
  resultManager: ResultManagerNavigator;
}>({
  resultManager: async ({ page }, use) => {
    const nav = new ResultManagerNavigator(page);
    await nav.goto();
    await nav.waitForRows();
    await use(nav);
  },
});

test.describe
  .serial("ResultManager", () => {
    test("renders result table with data", async ({ resultManager }) => {
      await test.step("verify table structure", async () => {
        const { results } = resultManager.getProps();

        await expect(resultManager.root).toBeVisible();
        await expect(resultManager.title).toHaveText("Results");

        const headers = await resultManager.getTableHeaders();
        expect(headers).toEqual(["Type", "Created", "Actions"]);

        expect(await resultManager.rowsCount()).toBe(results.length);
      });

      await test.step("verify row content", async () => {
        const row = resultManager.row(0);

        await expect(row.typeLabel).toBeVisible();
        await expect(row.downloadBtn).toBeVisible();
        await expect(row.shareBtn).toBeVisible();
        await expect(row.copyBtn).not.toBeVisible();
        await expect(row.deleteBtn).toBeVisible();
        await expect(row.dateSpan).toBeVisible();
      });
    });

    test("shows empty state when no results", async ({ page }) => {
      await test.step("navigate to empty state", async () => {
        const nav = new ResultManagerNavigator(page);
        await nav.goto({ results: [] });

        await expect(nav.emptyState).toBeVisible();
        await expect(nav.emptyState).toContainText("No results available");
      });
    });

    test("downloads a result", async ({ page, resultManager }) => {
      const row = resultManager.row(0);
      const { results, downloadResultUrlTemplate } = resultManager.getProps();

      const expectedUrl = downloadResultUrlTemplate.replace(
        "{uuid}",
        results[0].uuid,
      );

      await test.step("setup download mock", async () => {
        await page.route(expectedUrl, (route) => {
          route.fulfill({
            status: 200,
            headers: {
              "Content-Type": "application/octet-stream",
              "Content-Disposition": `attachment; filename="${results[0].result_type}.ply"`,
            },
            body: Buffer.from("mock point cloud data"),
          });
        });
      });

      await test.step("trigger and verify download", async () => {
        const downloadPromise = page.waitForEvent("download");

        await row.download();

        const download = await downloadPromise;

        expect(download.url()).toContain(expectedUrl);
        expect(download.suggestedFilename()).toContain(results[0].result_type);

        await download.cancel(); // Don't actually save the file
      });

      await test.step("verify success feedback", async () => {
        await expect(page.locator("text=Download started")).toBeVisible({
          timeout: 3000,
        });

        await expect(row.downloadBtn).not.toBeDisabled();
      });
    });

    test("shares a result and copies link", async ({
      page,
      resultManager,
      clipboard,
    }) => {
      await test.step("share result", async () => {
        const row = resultManager.row(0);

        const actionPromise = waitForAction(page, "shareTaskResult");
        await row.share();
        await actionPromise;
        await expect(row.shareBtn).not.toBeVisible();
        await expect(row.copyBtn).toBeVisible();
      });

      await test.step("copy share link to clipboard", async () => {
        const row = resultManager.row(0);

        await page
          .context()
          .grantPermissions(["clipboard-read", "clipboard-write"]);
        await row.copyShareLink();

        await clipboard.expectContains("/api/results/");
        await clipboard.expectContains("/share?key=");
      });
    });

    test("deletes a result", async ({ page, resultManager }) => {
      let initialCount: number;

      await test.step("get initial state", async () => {
        initialCount = await resultManager.rowsCount();
      });

      await test.step("delete result", async () => {
        const row = resultManager.row(0);

        const actionPromise = waitForAction(page, "deleteTaskResult");
        await row.delete();
        await actionPromise;
      });

      await test.step("verify result removed", async () => {
        await resultManager.waitForRows(initialCount - 1);
      });
    });
  });
