import { defineAction } from "astro:actions";
import { z } from "astro/zod";
import { serviceApiClient } from "./utils";

const GCPoint = z.tuple([z.number(), z.number(), z.number().min(0)]);
const ImagePoint = z.tuple([z.number().min(0), z.number().min(0)]);

const GCP = z.object({
  image_uuid: z.string().uuid(),
  gcp_point: GCPoint,
  image_point: ImagePoint,
  label: z.string(),
});

export const actions = {
  createGCP: defineAction({
    input: GCP,
    handler: async (input) => {
      return await serviceApiClient.createGCP(input);
    },
  }),
  getGCP: defineAction({
    input: z.object({
      uuid: z.string().uuid(),
    }),
    handler: async ({ uuid }) => {
      return await serviceApiClient.getGCP({
        params: { uuid },
      });
    },
  }),
  updateGCP: defineAction({
    input: z.object({
      uuid: z.string().uuid(),
      payload: GCP.partial(),
    }),
    handler: async ({ uuid, payload }) => {
      return await serviceApiClient.updateGCP(payload, {
        params: { uuid },
      });
    },
  }),
  deleteGCP: defineAction({
    input: z.object({
      uuid: z.string().uuid(),
    }),
    handler: async ({ uuid }) => {
      return await serviceApiClient.deleteGCP(undefined, {
        params: { uuid },
      });
    },
  }),
  listGCPs: defineAction({
    input: z
      .object({
        label: z.string().optional(),
        workspace_uuid: z.string().uuid().optional(),
        image_uuid: z.string().uuid().optional(),
        created_after: z.string().nullable().optional(),
        created_before: z.string().nullable().optional(),
      })
      .optional(),
    handler: async (queries) => {
      return await serviceApiClient.listGCPsInternal({ queries });
    },
  }),
};
