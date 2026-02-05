import { defineAction } from "astro:actions";
import { z } from "astro/zod";
import { schemas } from "@/lib/server";
import { serviceApiClient } from "./utils";

export const actions = {
  createTask: defineAction({
    input: z.object({
      workspace_uuid: z.string().uuid(),
      name: z.string(),
      quality: schemas.ODMQualityOption.optional(),
    }),
    handler: async ({ workspace_uuid, name, quality }) => {
      return await serviceApiClient.createTask({
        workspace_uuid,
        name,
        quality,
      });
    },
  }),
  getTask: defineAction({
    input: z.object({
      uuid: z.string().uuid(),
    }),
    handler: async ({ uuid }) => {
      return await serviceApiClient.getTask({
        params: { uuid },
      });
    },
  }),
  callTaskAction: defineAction({
    input: z.object({
      uuid: z.string().uuid(),
      action: z.enum(["pause", "resume", "cancel"]),
    }),
    handler: async ({ uuid, action }) => {
      return await serviceApiClient.callTaskAction(undefined, {
        params: { uuid, action },
      });
    },
  }),
  deleteTask: defineAction({
    input: z.object({
      uuid: z.string().uuid(),
    }),
    handler: async ({ uuid }) => {
      return await serviceApiClient.deleteTask(undefined, {
        params: { uuid },
      });
    },
  }),
  listTask: defineAction({
    input: z
      .object({
        step: schemas.ODMProcessingStage.optional(),
        status: schemas.ODMTaskStatus.optional(),
        workspace_uuid: z.string().uuid().optional(),
        created_after: z.string().nullable().optional(),
        created_before: z.string().nullable().optional(),
      })
      .optional(),
    handler: async (queries) => {
      return await serviceApiClient.listTasksInternal({ queries });
    },
  }),
} as const;
