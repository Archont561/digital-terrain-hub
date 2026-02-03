import { randomUUID } from "crypto";
import { test as baseTest, ComponentPageNavigator, expect } from "./fixtures";

class WorkspaceTableRowNavigator extends ComponentPageNavigator<{
  workspace: { uuid: string; name: string };
  workspaceEditUrl: string;
}> {
  protected readonly componentUrl = "/components/WorkspaceTableRow";

  protected readonly defaultProps = {
    workspace: {
      uuid: randomUUID(),
      name: "Test Workspace",
    },
    workspaceEditUrl: "/edit-workspace",
  };

  protected readonly rootSelector = ".ninjaodm-workspace-table-row";

  protected readonly selectors = {
    nameLabel: '[x-bind="workspaceNameLabel"]',
    nameInput: '[x-bind="workspaceNameInput"]',
    editBtn: 'a:has-text("Edit")',
    deleteBtn: '[x-bind="deleteWorkspaceBtn"]',
  } as const;

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

  async enterEdit() {
    await this.label.click();
    await this.input.waitFor({ state: "visible" });
  }

  async cancelEdit() {
    await this.page.locator("body").click({ position: { x: 0, y: 0 } });
    await this.label.waitFor({ state: "visible" });
  }

  async rename(newName: string) {
    await this.enterEdit();
    await this.input.fill(newName);
    await this.input.press("Enter");
  }
}

const test = baseTest.extend<{
  workspaceTableRow: WorkspaceTableRowNavigator;
}>({
  workspaceTableRow: async ({ page }, use) => {
    const nav = new WorkspaceTableRowNavigator(page);
    await nav.goto();
    await use(nav);
  },
});

test.describe
  .serial("WorkspaceTableRow", () => {
    test.describe("Rendering", () => {
      test("renders in normal mode with correct initial data", async ({
        workspaceTableRow,
      }) => {
        const { workspace } = workspaceTableRow.getProps();

        await test.step("Verify workspace row is visible", async () => {
          await expect(workspaceTableRow.root).toBeVisible();
        });

        await test.step("Verify workspace name is rendered", async () => {
          await expect(workspaceTableRow.label).toHaveText(workspace.name);
        });

        await test.step("Verify edit mode is inactive", async () => {
          await expect(workspaceTableRow.input).toBeHidden();
          await expect(workspaceTableRow.editBtn).toBeVisible();
        });
      });

      test("edit button has correct href", async ({
        workspaceTableRow,
        page,
      }) => {
        const { workspace, workspaceEditUrl } = workspaceTableRow.getProps();
        const expectedUrl = `${workspaceEditUrl}/${workspace.uuid}`;

        await test.step("Verify edit button href", async () => {
          await expect(workspaceTableRow.editBtn).toHaveAttribute(
            "href",
            expectedUrl,
          );
        });

        await test.step("Navigate via edit button", async () => {
          await workspaceTableRow.editBtn.click();
          await expect(page).toHaveURL(expectedUrl);
        });
      });
    });

    test.describe("Edit Mode", () => {
      test("switches to edit mode and focuses input", async ({
        workspaceTableRow,
      }) => {
        await test.step("Enter edit mode", async () => {
          await workspaceTableRow.enterEdit();
        });

        await test.step("Verify edit UI state", async () => {
          await expect(workspaceTableRow.label).toBeHidden();
          await expect(workspaceTableRow.input).toBeVisible();
          await expect(workspaceTableRow.input).toBeFocused();
        });
      });

      test("cancel: reverts to normal mode on click away", async ({
        workspaceTableRow,
      }) => {
        await test.step("Enter edit mode", async () => {
          await workspaceTableRow.enterEdit();
        });

        await test.step("Cancel edit by clicking outside", async () => {
          await workspaceTableRow.cancelEdit();
        });

        await test.step("Verify normal mode is restored", async () => {
          await expect(workspaceTableRow.input).toBeHidden();
          await expect(workspaceTableRow.label).toBeVisible();
        });
      });

      test("success: updates name via API and UI", async ({
        workspaceTableRow,
        ctx,
      }) => {
        const newName = "Updated Name";

        await test.step("Rename workspace", async () => {
          await ctx.action("updateWorkspace").execute(async () => {
            await workspaceTableRow.rename(newName);
          });
        });

        await test.step("Verify updated name is shown", async () => {
          await expect(workspaceTableRow.label).toHaveText(newName);
          await expect(workspaceTableRow.input).toBeHidden();
        });
      });

      test("validation: shows error on empty name", async ({
        workspaceTableRow,
        toast,
      }) => {
        await test.step("Attempt rename with empty name", async () => {
          await workspaceTableRow.rename("   ");
        });

        await test.step("Verify validation error toast", async () => {
          await toast.error({
            title: "Validation Error",
            description: "Workspace name cannot be empty",
          });
        });

        await test.step("Verify UI reset to normal mode", async () => {
          await expect(workspaceTableRow.input).toBeHidden();
          await expect(workspaceTableRow.label).toBeVisible();
        });
      });

      test("error: handles API failure gracefully", async ({
        workspaceTableRow,
        ctx,
        toast,
      }) => {
        const originalName = await workspaceTableRow.label.innerText();

        await test.step("Attempt rename with API failure", async () => {
          await ctx
            .action("updateWorkspace")
            .mockError({ code: "INTERNAL_SERVER_ERROR" })
            .execute(async () => {
              await workspaceTableRow.rename("Should Fail");
            });
        });

        await test.step("Verify error toast and unchanged name", async () => {
          await toast.error("Internal Server Error");
          await expect(workspaceTableRow.label).toHaveText(originalName);
        });
      });
    });

    test.describe("Delete", () => {
      test("success: removes row from DOM", async ({
        workspaceTableRow,
        ctx,
      }) => {
        await test.step("Delete workspace successfully", async () => {
          await ctx.action("deleteWorkspace").execute(async () => {
            await workspaceTableRow.deleteBtn.click();
          });
        });

        await test.step("Verify row is removed", async () => {
          await expect(workspaceTableRow.root).not.toBeAttached();
        });
      });

      test("error: shows toast and keeps row", async ({
        workspaceTableRow,
        ctx,
        toast,
      }) => {
        await test.step("Attempt delete with API failure", async () => {
          await ctx
            .action("deleteWorkspace")
            .mockError({ code: "NOT_FOUND" })
            .execute(async () => {
              await workspaceTableRow.deleteBtn.click();
            });
        });

        await test.step("Verify error toast and row remains", async () => {
          await toast.error("Not Found");
          await expect(workspaceTableRow.root).toBeVisible();
        });
      });
    });
  });
