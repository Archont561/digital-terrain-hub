import { defineAction } from "astro:actions";
import { z } from "astro/zod";
import { schemas } from "@/lib/server";
import { serviceApiClient } from "./utils";

export const actions = {
  getTaskResult: defineAction({
    input: z.object({
      uuid: z.string().uuid(),
    }),
    handler: async ({ uuid }) => {
      return await serviceApiClient.getTaskResult({
        params: { uuid },
      });
    },
  }),
  shareTaskResult: defineAction({
    input: z.object({
      uuid: z.string().uuid(),
    }),
    handler: async ({ uuid }) => {
      return await serviceApiClient.shareTaskResult({
        params: { uuid },
      });
    },
  }),
  deleteTaskResult: defineAction({
    input: z.object({
      uuid: z.string().uuid(),
    }),
    handler: async ({ uuid }) => {
      return await serviceApiClient.deleteTaskResult(undefined, {
        params: { uuid },
      });
    },
  }),
  listTaskResults: defineAction({
    input: z
      .object({
        workspace_uuid: z.string().uuid().optional(),
        result_type: schemas.ODMTaskResultType.optional(),
        created_after: z.string().nullable().optional(),
        created_before: z.string().nullable().optional(),
      })
      .optional(),
    handler: async (queries, { locals }) => {
      return await serviceApiClient.listTaskResultsInternal({
        queries: {
          user_id: locals.currentUserId!,
          ...queries
        }
      });
    },
  }),
} as const;
