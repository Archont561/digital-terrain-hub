import { z } from "zod";
import { expect, test } from "./fixtures";

const TokenPairResponse = z.object({
  access: z.string(),
  refresh: z.string(),
});

test.describe
  .serial("Token Actions", () => {
    test("getUserTokenPair – success", async ({ astroActions }) => {
      const result = await astroActions.expectSuccess<
        z.infer<typeof TokenPairResponse>
      >("getUserTokenPair", undefined);

      const validated = TokenPairResponse.parse(result);
      expect(validated).toBeDefined();
    });

    test("getUserTokenPair – returns cached tokens on second call", async ({
      astroActions,
    }) => {
      const firstCall = await astroActions.expectSuccess<
        z.infer<typeof TokenPairResponse>
      >("getUserTokenPair", undefined);

      const secondCall = await astroActions.expectSuccess<
        z.infer<typeof TokenPairResponse>
      >("getUserTokenPair", undefined);

      // Should return the same tokens (cached)
      expect(secondCall.access).toBe(firstCall.access);
      expect(secondCall.refresh).toBe(firstCall.refresh);
    });

    test("refreshUserAccesToken – success", async ({ astroActions }) => {
      const result = await astroActions.expectSuccess<string>(
        "refreshUserAccesToken",
        {
          refreshToken: "valid-refresh-token",
        },
      );

      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
    });

    test("refreshUserAccesToken – updates cached access token", async ({
      astroActions,
    }) => {
      const initialTokens = await astroActions.expectSuccess<
        z.infer<typeof TokenPairResponse>
      >("getUserTokenPair", undefined);

      const newAccessToken = await astroActions.expectSuccess<string>(
        "refreshUserAccesToken",
        {
          refreshToken: initialTokens.refresh,
        },
      );

      const updatedTokens = await astroActions.expectSuccess<
        z.infer<typeof TokenPairResponse>
      >("getUserTokenPair", undefined);

      // Access token should be updated
      expect(updatedTokens.access).toBe(newAccessToken);
      // Refresh token should stay the same
      expect(updatedTokens.refresh).toBe(initialTokens.refresh);
    });

    test("refreshUserAccesToken – validation error", async ({
      astroActions,
    }) => {
      const error = await astroActions.expectValidationError(
        "refreshUserAccesToken",
        {},
      );

      expect(error.type).toBe("AstroActionInputError");
      expect(error.fields?.refreshToken).toBeDefined();
    });
  });
