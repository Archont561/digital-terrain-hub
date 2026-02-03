import { z } from "zod";
import { expect, test } from "./fixtures";

const WorkspaceResponse = z.object({
  uuid: z.string().uuid(),
  name: z.string().max(50),
  created_at: z.string().datetime({ offset: true }),
});

const WorkspaceListResponse = z.array(WorkspaceResponse);

test.describe
  .serial("Workspace Actions", () => {
    const validUuid = "550e8400-e29b-41d4-a716-446655440000";
    const validWorkspaceName = "Test Workspace";

    /* -------------------------------------------------------------------------- */
    /* CREATE WORKSPACE                                                           */
    /* -------------------------------------------------------------------------- */

    test("createWorkspace – success", async ({ astroActions }) => {
      const result = await astroActions.expectSuccess<
        z.infer<typeof WorkspaceResponse>
      >("createWorkspace", {
        name: validWorkspaceName,
      });

      // Validate response structure
      const validated = WorkspaceResponse.parse(result);
      expect(validated).toBeDefined();
    });

    test("createWorkspace – validation error (name too long)", async ({
      astroActions,
    }) => {
      const error = await astroActions.expectValidationError(
        "createWorkspace",
        {
          name: "a".repeat(51), // exceeds max 50 characters
        },
      );

      expect(error.type).toBe("AstroActionInputError");
      expect(error.issues).toBeDefined();
      expect(error.fields?.name).toBeDefined();
    });

    /* -------------------------------------------------------------------------- */
    /* GET WORKSPACE                                                              */
    /* -------------------------------------------------------------------------- */

    test("getWorkspace – success", async ({ astroActions }) => {
      const result = await astroActions.expectSuccess<
        z.infer<typeof WorkspaceResponse>
      >("getWorkspace", {
        uuid: validUuid,
      });

      // Validate response structure
      const validated = WorkspaceResponse.parse(result);
      expect(validated).toBeDefined();
    });

    test("getWorkspace – validation error (invalid uuid)", async ({
      astroActions,
    }) => {
      const error = await astroActions.expectValidationError("getWorkspace", {
        uuid: "not-a-valid-uuid",
      });

      expect(error.type).toBe("AstroActionInputError");
      expect(error.issues).toBeDefined();
      expect(error.fields?.uuid).toContain("Invalid uuid");
    });

    test("getWorkspace – validation error (missing uuid)", async ({
      astroActions,
    }) => {
      const error = await astroActions.expectValidationError(
        "getWorkspace",
        {},
      );

      expect(error.type).toBe("AstroActionInputError");
      expect(error.issues).toBeDefined();
      expect(error.fields?.uuid).toBeDefined();
    });

    /* -------------------------------------------------------------------------- */
    /* UPDATE WORKSPACE                                                           */
    /* -------------------------------------------------------------------------- */

    test("updateWorkspace – success", async ({ astroActions }) => {
      const result = await astroActions.expectSuccess<
        z.infer<typeof WorkspaceResponse>
      >("updateWorkspace", {
        uuid: validUuid,
        payload: {
          name: "Updated workspace name",
        },
      });

      // Validate response structure
      const validated = WorkspaceResponse.parse(result);
      expect(validated).toBeDefined();
    });

    test("updateWorkspace – validation error (invalid uuid)", async ({
      astroActions,
    }) => {
      const error = await astroActions.expectValidationError(
        "updateWorkspace",
        {
          uuid: "invalid-uuid",
          payload: {
            name: "Updated name",
          },
        },
      );

      expect(error.type).toBe("AstroActionInputError");
      expect(error.issues).toBeDefined();
      expect(error.fields?.uuid).toContain("Invalid uuid");
    });

    /* -------------------------------------------------------------------------- */
    /* DELETE WORKSPACE                                                           */
    /* -------------------------------------------------------------------------- */

    test("deleteWorkspace – success", async ({ astroActions }) => {
      const result = await astroActions.expectSuccess<undefined>(
        "deleteWorkspace",
        {
          uuid: validUuid,
        },
      );

      expect(result).toBe("");
    });

    test("deleteWorkspace – validation error (invalid uuid)", async ({
      astroActions,
    }) => {
      const error = await astroActions.expectValidationError(
        "deleteWorkspace",
        {
          uuid: "not-valid",
        },
      );

      expect(error.type).toBe("AstroActionInputError");
      expect(error.issues).toBeDefined();
      expect(error.fields?.uuid).toContain("Invalid uuid");
    });

    /* -------------------------------------------------------------------------- */
    /* LIST WORKSPACES                                                            */
    /* -------------------------------------------------------------------------- */

    test("listWorkspaces – success (no filters)", async ({ astroActions }) => {
      const result = await astroActions.expectSuccess<
        z.infer<typeof WorkspaceListResponse>
      >("listWorkspaces", undefined);

      // Validate each workspace in the list
      const validated = WorkspaceListResponse.parse(result);
      expect(validated).toBeDefined();
      expect(validated.length).toBeGreaterThan(0);
    });
  });
