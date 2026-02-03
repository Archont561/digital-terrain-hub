import { z } from "zod";
import { schemas } from "@/lib";
import { expect, test } from "./fixtures";

const TaskResultResponse = z.object({
  uuid: z.string().uuid(),
  workspace_uuid: z.string().uuid(),
  result_type: schemas.ODMTaskResultType,
  created_at: z.string().datetime({ offset: true }),
});

const TaskResultListResponse = z.array(TaskResultResponse);

test.describe
  .serial("Task Result Actions", () => {
    const validUuid = "650e8400-e29b-41d4-a716-446655440000";
    const notValidUuid = "invalid-uuid-format";

    /* -------------------------------------------------------------------------- */
    /* GET TASK RESULT                                                            */
    /* -------------------------------------------------------------------------- */

    test("getTaskResult – success", async ({ astroActions }) => {
      const result = await astroActions.expectSuccess<
        z.infer<typeof TaskResultResponse>
      >("getTaskResult", {
        uuid: validUuid,
      });

      const validated = TaskResultResponse.parse(result);
      expect(validated).toBeDefined();
    });

    test("getTaskResult – validation error (invalid uuid)", async ({
      astroActions,
    }) => {
      const error = await astroActions.expectValidationError("getTaskResult", {
        uuid: notValidUuid,
      });

      expect(error.type).toBe("AstroActionInputError");
      expect(error.fields?.uuid).toContain("Invalid uuid");
    });

    /* -------------------------------------------------------------------------- */
    /* SHARE TASK RESULT                                                          */
    /* -------------------------------------------------------------------------- */

    test("shareTaskResult – success", async ({ astroActions }) => {
      const result = await astroActions.expectSuccess<{
        share_api_key: string;
      }>("shareTaskResult", {
        uuid: validUuid,
      });

      const { share_api_key } = result;
      expect(share_api_key).toBeDefined();
      expect(typeof share_api_key).toBe("string");
    });

    test("shareTaskResult – validation error (invalid uuid)", async ({
      astroActions,
    }) => {
      const error = await astroActions.expectValidationError(
        "shareTaskResult",
        {
          uuid: notValidUuid,
        },
      );

      expect(error.type).toBe("AstroActionInputError");
      expect(error.fields?.uuid).toContain("Invalid uuid");
    });

    /* -------------------------------------------------------------------------- */
    /* DELETE TASK RESULT                                                         */
    /* -------------------------------------------------------------------------- */

    test("deleteTaskResult – success", async ({ astroActions }) => {
      const result = await astroActions.expectSuccess<undefined>(
        "deleteTaskResult",
        {
          uuid: validUuid,
        },
      );

      expect(result === undefined || result === "").toBeTruthy();
    });

    test("deleteTaskResult – validation error (invalid uuid)", async ({
      astroActions,
    }) => {
      const error = await astroActions.expectValidationError(
        "deleteTaskResult",
        {
          uuid: notValidUuid,
        },
      );

      expect(error.type).toBe("AstroActionInputError");
      expect(error.fields?.uuid).toContain("Invalid uuid");
    });

    /* -------------------------------------------------------------------------- */
    /* LIST TASK RESULTS                                                          */
    /* -------------------------------------------------------------------------- */

    test("listTaskResults – success", async ({ astroActions }) => {
      const result = await astroActions.expectSuccess<
        z.infer<typeof TaskResultListResponse>
      >("listTaskResults", undefined);

      const validated = TaskResultListResponse.parse(result);
      expect(validated).toBeDefined();
      expect(validated.length).toBeGreaterThan(0);
    });

    test("listTaskResults – validation error (invalid workspace uuid)", async ({
      astroActions,
    }) => {
      const error = await astroActions.expectValidationError(
        "listTaskResults",
        {
          workspace_uuid: notValidUuid,
        },
      );

      expect(error.type).toBe("AstroActionInputError");
      expect(error.fields?.workspace_uuid).toContain("Invalid uuid");
    });
  });
