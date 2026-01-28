import { defineAction } from "astro:actions";
import { z } from "astro/zod";
import { schemas } from "@/lib";
import { serviceApiClient } from "./utils";

export default {
  updateWorkspace: defineAction({
    input: z.object({
      uuid: z.string().uuid(),
      payload: schemas.UpdateWorkspacePublic,
    }),
    handler: async ({ uuid, payload }) => {
      return await serviceApiClient.updateWorkspaceInternal(payload, {
          params: { uuid },
        },
      );
    },
  }),
  deleteWorkspace: defineAction({
    input: z.object({
      uuid: z.string().uuid(),
    }),
    handler: async ({ uuid }) => {
      return await serviceApiClient.deleteWorkspaceInternal(undefined, {
        params: { uuid },
      });
    },
  }),
};
