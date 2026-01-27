import { expect, type Locator, test } from "@playwright/test";

test.describe
  .serial("WorkspaceTableRow", () => {
    const TABLE_ROW_SELECTOR = ".ninjaodm-workspace-table-row";
    const COMPONENT_URL = "/components/WorkspaceTableRow";

    const TEST_WORKSPACE = {
      uuid: "test-workspace-uuid",
      name: "test-workspace-name",
    };

    const WORKSPACE_EDIT_URL = `/edit-workspace`;

    const alpineRef = (root: Locator, ref: string) => {
      return root.locator(`[x-ref="${ref}"]`);
    };

    test("should render WorkspaceRow", async ({ page }) => {
      const params = new URLSearchParams({
        props: encodeURIComponent(
          JSON.stringify({
            workspace: TEST_WORKSPACE,
            workspaceEditUrl: WORKSPACE_EDIT_URL,
          }),
        ),
      });

      await page.goto(`${COMPONENT_URL}?${params}`);

      const workspaceTableRow = page.locator(TABLE_ROW_SELECTOR).first();
      await expect(workspaceTableRow).toBeVisible();
      await expect(workspaceTableRow).toHaveAttribute(
        "data-workspace-uuid",
        TEST_WORKSPACE.uuid,
      );
      await expect(
        alpineRef(workspaceTableRow, "workspaceNameInput"),
      ).toHaveValue("test-workspace-name");

      await expect(
        alpineRef(workspaceTableRow, "editWorkspaceBtn"),
      ).toBeVisible();

      await expect(
        alpineRef(workspaceTableRow, "deleteWorkspaceBtn"),
      ).toBeVisible();
    });
  });
