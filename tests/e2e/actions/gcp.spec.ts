import { z } from "zod";
import { expect, test } from "./fixtures";

const GCPoint = z.tuple([z.number(), z.number(), z.number().min(0)]);
const ImagePoint = z.tuple([z.number().min(0), z.number().min(0)]);

const GCPResponse = z.object({
  uuid: z.string().uuid(),
  image_uuid: z.string().uuid(),
  gcp_point: GCPoint,
  image_point: ImagePoint,
  label: z.string(),
  created_at: z.string().datetime({ offset: true }),
});

const GCPListResponse = z.array(GCPResponse);

test.describe
  .serial("GCP Actions", () => {
    const validGCPUuid = "950e8400-e29b-41d4-a716-446655440000";
    const validImageUuid = "950e8400-e29b-41d4-a716-446655440000";

    /* -------------------------------------------------------------------------- */
    /* CREATE GCP                                                                 */
    /* -------------------------------------------------------------------------- */

    test("createGCP – success", async ({ astroActions }) => {
      const result = await astroActions.expectSuccess<
        z.infer<typeof GCPResponse>
      >("createGCP", {
        image_uuid: validImageUuid,
        gcp_point: [1.5, 2.5, 3.0],
        image_point: [100, 200],
        label: "Test GCP",
      });

      const validated = GCPResponse.parse(result);
      expect(validated).toBeDefined();
    });

    test("createGCP – validation error", async ({ astroActions }) => {
      const error = await astroActions.expectValidationError("createGCP", {
        image_uuid: "not-a-uuid",
        gcp_point: [1.5, 2.5],
        image_point: [-100, 200],
        label: "Test GCP",
      });

      expect(error.type).toBe("AstroActionInputError");
      expect(error.fields?.gcp_point).toBeDefined();
      expect(error.fields?.image_uuid).toContain("Invalid uuid");
      expect(error.fields?.image_point).toBeDefined();
    });

    /* -------------------------------------------------------------------------- */
    /* GET GCP                                                                    */
    /* -------------------------------------------------------------------------- */

    test("getGCP – success", async ({ astroActions }) => {
      const result = await astroActions.expectSuccess<
        z.infer<typeof GCPResponse>
      >("getGCP", {
        uuid: validGCPUuid,
      });

      const validated = GCPResponse.parse(result);
      expect(validated).toBeDefined();
    });

    test("getGCP – validation error (invalid uuid)", async ({
      astroActions,
    }) => {
      const error = await astroActions.expectValidationError("getGCP", {
        uuid: "not-a-valid-uuid",
      });

      expect(error.type).toBe("AstroActionInputError");
      expect(error.fields?.uuid).toContain("Invalid uuid");
    });

    /* -------------------------------------------------------------------------- */
    /* UPDATE GCP                                                                 */
    /* -------------------------------------------------------------------------- */

    test("updateGCP – success", async ({ astroActions }) => {
      const result = await astroActions.expectSuccess<
        z.infer<typeof GCPResponse>
      >("updateGCP", {
        uuid: validGCPUuid,
        payload: {
          label: "Updated GCP Label",
        },
      });

      const validated = GCPResponse.parse(result);
      expect(validated).toBeDefined();
    });

    test("updateGCP – validation error (invalid uuid)", async ({
      astroActions,
    }) => {
      const error = await astroActions.expectValidationError("updateGCP", {
        uuid: "invalid-uuid",
        payload: {
          label: "Updated Label",
        },
      });

      expect(error.type).toBe("AstroActionInputError");
      expect(error.fields?.uuid).toContain("Invalid uuid");
    });

    /* -------------------------------------------------------------------------- */
    /* DELETE GCP                                                                 */
    /* -------------------------------------------------------------------------- */

    test("deleteGCP – success", async ({ astroActions }) => {
      const result = await astroActions.expectSuccess<undefined>("deleteGCP", {
        uuid: validGCPUuid,
      });

      expect(result === undefined || result === "").toBeTruthy();
    });

    test("deleteGCP – validation error (invalid uuid)", async ({
      astroActions,
    }) => {
      const error = await astroActions.expectValidationError("deleteGCP", {
        uuid: "not-valid-uuid",
      });

      expect(error.type).toBe("AstroActionInputError");
      expect(error.fields?.uuid).toContain("Invalid uuid");
    });

    /* -------------------------------------------------------------------------- */
    /* LIST GCPs                                                                  */
    /* -------------------------------------------------------------------------- */

    test("listGCPs – success", async ({ astroActions }) => {
      const result = await astroActions.expectSuccess<
        z.infer<typeof GCPListResponse>
      >("listGCPs", undefined);

      const validated = GCPListResponse.parse(result);
      expect(validated).toBeDefined();
      expect(validated.length).toBeGreaterThan(0);
    });

    test("listGCPs – validation error (invalid image uuid)", async ({
      astroActions,
    }) => {
      const error = await astroActions.expectValidationError("listGCPs", {
        image_uuid: "not-a-uuid",
      });

      expect(error.type).toBe("AstroActionInputError");
      expect(error.fields?.image_uuid).toContain("Invalid uuid");
    });
  });
