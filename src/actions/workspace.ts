import { defineAction } from "astro:actions";
import { z } from "astro/zod";
import { schemas } from "@/lib";
import { serviceApiClient } from "./utils";

export default {
  updateWorkspace: defineAction({
    input: schemas.WorkspacePatchSchema.omit({ user_id: true }),
    handler: async (payload, context) => {
      return await serviceApiClient.updateWorkspace(
        {
          user_id: context.locals.currentUserId!,
          ...payload,
        },
        {
          params: { uuid: "test" },
        },
      );
    },
  }),
  deleteWorkspace: defineAction({
    input: z.string().uuid(),
    handler: async (uuid) => {
      return await serviceApiClient.deleteWorkspaceInternal(undefined, {
        params: { uuid },
      });
    },
  }),
};
