import { defineAction } from "astro:actions";
import { z } from "astro/zod";
import { schemas } from "@/lib";
import { serviceApiClient } from "./utils";

export default {
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
      return await serviceApiClient.deleteWorkspace(undefined, {
        params: { uuid },
      });
    },
  }),
};
