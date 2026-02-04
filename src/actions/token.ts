import { defineAction } from "astro:actions";
import { z } from "astro/zod";
import { serviceApiClient } from "./utils";

const USER_NINJAODM_API_TOKEN_PAIR_SESSION = "userNinjaODMAPITokenPair";

export const actions = {
  getUserTokenPair: defineAction({
    handler: async (_, { session, locals }) => {
      let userNinjaODMAPITokenPair = await session?.get(
        USER_NINJAODM_API_TOKEN_PAIR_SESSION,
      );

      if (!userNinjaODMAPITokenPair) {
        userNinjaODMAPITokenPair = await serviceApiClient.getUserTokenPair({
          user_id: locals.currentUserId! || "test-dummy-user-id",
        });
        session?.set(
          USER_NINJAODM_API_TOKEN_PAIR_SESSION,
          userNinjaODMAPITokenPair,
        );
      }

      return userNinjaODMAPITokenPair;
    },
  }),
  refreshUserAccesToken: defineAction({
    input: z.object({
      refreshToken: z.string(),
    }),
    handler: async ({ refreshToken }, { session }) => {
      const { access: accessToken } =
        await serviceApiClient.refreshUserAccessToken({
          refresh: refreshToken,
        });

      session?.set(USER_NINJAODM_API_TOKEN_PAIR_SESSION, {
        access: accessToken,
        refresh: refreshToken,
      });

      return accessToken;
    },
  }),
};
