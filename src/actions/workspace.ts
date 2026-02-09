import { defineAction } from "astro:actions";
import { z } from "astro/zod";
import { schemas } from "@/lib/server";
import { serviceApiClient } from "./utils";

export const actions = {
  createWorkspace: defineAction({
    input: z.object({
      name: z.string().max(50).optional(),
    }).optional(),
    handler: async (input, { locals }) => {
      const result = await serviceApiClient.createWorkspaceInternal({
        user_id: locals.currentUserId || "dummy-user-id",
        name: input?.name,
      });
      const { user_id, ...rest } = result;
      return rest;
    },
  }),
  getWorkspace: defineAction({
    input: z.object({
      uuid: z.string().uuid(),
    }),
    handler: async ({ uuid }) => {
      return await serviceApiClient.getWorkspace({
        params: { uuid },
      });
    },
  }),
  updateWorkspace: defineAction({
    input: z.object({
      uuid: z.string().uuid(),
      payload: schemas.UpdateWorkspace,
    }),
    handler: async ({ uuid, payload }) => {
      return await serviceApiClient.updateWorkspace(payload, {
        params: { uuid },
      });
    },
  }),
  deleteWorkspace: defineAction({
    input: z.object({
      uuid: z.string().uuid(),
    }),
    handler: async ({ uuid }) => {
  console.log("deleteWorkspace called with", uuid);
      return await serviceApiClient.deleteWorkspace(undefined, {
        params: { uuid },
      });
    },
  }),
  listWorkspaces: defineAction({
    input: z
      .object({
        name: z.string().nullable().optional(),
        created_after: z.string().nullable().optional(),
        created_before: z.string().nullable().optional(),
      })
      .optional(),
    handler: async (queries) => {
      return await serviceApiClient.listWorkspaces({ queries });
    },
  }),
};
