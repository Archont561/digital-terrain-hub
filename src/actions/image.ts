import { defineAction } from "astro:actions";
import { z } from "astro/zod";
import { serviceApiClient } from "./utils";

export const actions = {
  getImage: defineAction({
    input: z.object({
      uuid: z.string().uuid(),
    }),
    handler: async ({ uuid }) => {
      return await serviceApiClient.getImage({
        params: { uuid },
      });
    },
  }),
  deleteImage: defineAction({
    input: z.object({
      uuid: z.string().uuid(),
    }),
    handler: async ({ uuid }) => {
      return await serviceApiClient.deleteImage(undefined, {
        params: { uuid },
      });
    },
  }),

  listImages: defineAction({
    input: z
      .object({
        name: z.string().optional(),
        is_thumbnail: z.boolean().optional(),
        workspace_uuid: z.string().uuid().optional(),
        created_after: z.string().nullable().optional(),
        created_before: z.string().nullable().optional(),
      })
      .optional(),
    handler: async (queries, { locals }) => {
      return await serviceApiClient.listImagesInternal({
        queries: {
          user_id: locals.currentUserId!,
          ...queries
        }
      });
    },
  }),
};
