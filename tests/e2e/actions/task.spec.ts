import { z } from "zod";
import { schemas } from "@/lib";
import { expect, test } from "./fixtures";

const TaskResponse = z.object({
  uuid: z.string().uuid(),
  workspace_uuid: z.string().uuid(),
  step: schemas.ODMProcessingStage,
  status: schemas.ODMTaskStatus,
  options: z.object({}),
  created_at: z.string().datetime({ offset: true }),
});

const TaskListResponse = z.array(TaskResponse);

test.describe
  .serial("Task Actions", () => {
    const validTaskUuid = "750e8400-e29b-41d4-a716-446655440000";
    const validWorkspaceUuid = "550e8400-e29b-41d4-a716-446655440000";

    /* -------------------------------------------------------------------------- */
    /* CREATE TASK                                                                */
    /* -------------------------------------------------------------------------- */

    test("createTask – success", async ({ astroActions }) => {
      const result = await astroActions.expectSuccess<
        z.infer<typeof TaskResponse>
      >("createTask", {
        workspace_uuid: validWorkspaceUuid,
        name: "Test Task",
        quality: "high",
      });

      const validated = TaskResponse.parse(result);
      expect(validated).toBeDefined();
    });

    test("createTask – validation error (invalid workspace uuid)", async ({
      astroActions,
    }) => {
      const error = await astroActions.expectValidationError("createTask", {
        workspace_uuid: "not-a-uuid",
        name: "Test Task",
      });

      expect(error.type).toBe("AstroActionInputError");
      expect(error.fields?.workspace_uuid).toContain("Invalid uuid");
    });

    test("createTask – validation error (missing name)", async ({
      astroActions,
    }) => {
      const error = await astroActions.expectValidationError("createTask", {
        workspace_uuid: validWorkspaceUuid,
      });

      expect(error.type).toBe("AstroActionInputError");
      expect(error.fields?.name).toBeDefined();
    });

    /* -------------------------------------------------------------------------- */
    /* GET TASK                                                                   */
    /* -------------------------------------------------------------------------- */

    test("getTask – success", async ({ astroActions }) => {
      const result = await astroActions.expectSuccess<
        z.infer<typeof TaskResponse>
      >("getTask", {
        uuid: validTaskUuid,
      });

      const validated = TaskResponse.parse(result);
      expect(validated).toBeDefined();
    });

    test("getTask – validation error (invalid uuid)", async ({
      astroActions,
    }) => {
      const error = await astroActions.expectValidationError("getTask", {
        uuid: "not-a-valid-uuid",
      });

      expect(error.type).toBe("AstroActionInputError");
      expect(error.fields?.uuid).toContain("Invalid uuid");
    });

    /* -------------------------------------------------------------------------- */
    /* CALL TASK ACTION                                                           */
    /* -------------------------------------------------------------------------- */

    test("callTaskAction – success (pause)", async ({ astroActions }) => {
      const result = await astroActions.expectSuccess<
        z.infer<typeof TaskResponse>
      >("callTaskAction", {
        uuid: validTaskUuid,
        action: "pause",
      });

      const validated = TaskResponse.parse(result);
      expect(validated).toBeDefined();
    });

    test("callTaskAction – success (resume)", async ({ astroActions }) => {
      const result = await astroActions.expectSuccess<
        z.infer<typeof TaskResponse>
      >("callTaskAction", {
        uuid: validTaskUuid,
        action: "resume",
      });

      const validated = TaskResponse.parse(result);
      expect(validated).toBeDefined();
    });

    test("callTaskAction – success (cancel)", async ({ astroActions }) => {
      const result = await astroActions.expectSuccess<
        z.infer<typeof TaskResponse>
      >("callTaskAction", {
        uuid: validTaskUuid,
        action: "cancel",
      });

      const validated = TaskResponse.parse(result);
      expect(validated).toBeDefined();
    });

    test("callTaskAction – validation error (invalid uuid)", async ({
      astroActions,
    }) => {
      const error = await astroActions.expectValidationError("callTaskAction", {
        uuid: "invalid-uuid",
        action: "pause",
      });

      expect(error.type).toBe("AstroActionInputError");
      expect(error.fields?.uuid).toContain("Invalid uuid");
    });

    test("callTaskAction – validation error (invalid action)", async ({
      astroActions,
    }) => {
      const error = await astroActions.expectValidationError("callTaskAction", {
        uuid: validTaskUuid,
        action: "invalid-action",
      });

      expect(error.type).toBe("AstroActionInputError");
      expect(error.fields?.action).toBeDefined();
    });

    /* -------------------------------------------------------------------------- */
    /* DELETE TASK                                                                */
    /* -------------------------------------------------------------------------- */

    test("deleteTask – success", async ({ astroActions }) => {
      const result = await astroActions.expectSuccess<undefined>("deleteTask", {
        uuid: validTaskUuid,
      });

      expect(result === undefined || result === "").toBeTruthy();
    });

    test("deleteTask – validation error (invalid uuid)", async ({
      astroActions,
    }) => {
      const error = await astroActions.expectValidationError("deleteTask", {
        uuid: "not-valid-uuid",
      });

      expect(error.type).toBe("AstroActionInputError");
      expect(error.fields?.uuid).toContain("Invalid uuid");
    });

    /* -------------------------------------------------------------------------- */
    /* LIST TASKS                                                                 */
    /* -------------------------------------------------------------------------- */

    test("listTask – success", async ({ astroActions }) => {
      const result = await astroActions.expectSuccess<
        z.infer<typeof TaskListResponse>
      >("listTask", undefined);

      const validated = TaskListResponse.parse(result);
      expect(validated).toBeDefined();
      expect(validated.length).toBeGreaterThan(0);
    });

    test("listTask – validation error (invalid workspace uuid)", async ({
      astroActions,
    }) => {
      const error = await astroActions.expectValidationError("listTask", {
        workspace_uuid: "not-a-uuid",
      });

      expect(error.type).toBe("AstroActionInputError");
      expect(error.fields?.workspace_uuid).toContain("Invalid uuid");
    });
  });
