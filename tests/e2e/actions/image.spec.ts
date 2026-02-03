import { z } from "zod";
import { expect, test } from "./fixtures";

const ImageResponse = z.object({
  uuid: z.string().uuid(),
  workspace_uuid: z.string().uuid(),
  name: z.string(),
  is_thumbnail: z.boolean(),
  created_at: z.string().datetime({ offset: true }),
});

const ImageListResponse = z.array(ImageResponse);

test.describe
  .serial("Image Actions", () => {
    const validImageUuid = "850e8400-e29b-41d4-a716-446655440000";

    /* -------------------------------------------------------------------------- */
    /* GET IMAGE                                                                  */
    /* -------------------------------------------------------------------------- */

    test("getImage – success", async ({ astroActions }) => {
      const result = await astroActions.expectSuccess<
        z.infer<typeof ImageResponse>
      >("getImage", {
        uuid: validImageUuid,
      });

      const validated = ImageResponse.parse(result);
      expect(validated).toBeDefined();
    });

    test("getImage – validation error (invalid uuid)", async ({
      astroActions,
    }) => {
      const error = await astroActions.expectValidationError("getImage", {
        uuid: "not-a-valid-uuid",
      });

      expect(error.type).toBe("AstroActionInputError");
      expect(error.fields?.uuid).toContain("Invalid uuid");
    });

    /* -------------------------------------------------------------------------- */
    /* DELETE IMAGE                                                               */
    /* -------------------------------------------------------------------------- */

    test("deleteImage – success", async ({ astroActions }) => {
      const result = await astroActions.expectSuccess<undefined>(
        "deleteImage",
        {
          uuid: validImageUuid,
        },
      );

      expect(result === undefined || result === "").toBeTruthy();
    });

    test("deleteImage – validation error (invalid uuid)", async ({
      astroActions,
    }) => {
      const error = await astroActions.expectValidationError("deleteImage", {
        uuid: "not-valid-uuid",
      });

      expect(error.type).toBe("AstroActionInputError");
      expect(error.fields?.uuid).toContain("Invalid uuid");
    });

    /* -------------------------------------------------------------------------- */
    /* LIST IMAGES                                                                */
    /* -------------------------------------------------------------------------- */

    test("listImages – success", async ({ astroActions }) => {
      const result = await astroActions.expectSuccess<
        z.infer<typeof ImageListResponse>
      >("listImages", undefined);

      const validated = ImageListResponse.parse(result);
      expect(validated).toBeDefined();
      expect(validated.length).toBeGreaterThan(0);
    });

    test("listImages – validation error (invalid workspace uuid)", async ({
      astroActions,
    }) => {
      const error = await astroActions.expectValidationError("listImages", {
        workspace_uuid: "not-a-uuid",
      });

      expect(error.type).toBe("AstroActionInputError");
      expect(error.fields?.workspace_uuid).toContain("Invalid uuid");
    });
  });
