import { createLogger } from "@stoplight/prism-core";
import { getHttpOperationsFromSpec } from "@stoplight/prism-http/dist";
import { createServer } from "@stoplight/prism-http-server";
import { test as base, expect, suite } from "vitest";
import PATH_TO_NINJAODM_OPENAPI_SPEC from "@/assets/ninjaodm.openapi.json";
import { createServiceApiClient, HMACAuthorization } from "@/lib";

const test = base.extend<{
  mockServer: Awaited<ReturnType<typeof createServer>>;
  serviceApiClient: ReturnType<typeof createServiceApiClient>;
}>({
  mockServer: [
    async ({}, use) => {
      const mockServer = createServer(
        await getHttpOperationsFromSpec(PATH_TO_NINJAODM_OPENAPI_SPEC),
        {
          components: {
            logger: createLogger("ninjaodm"),
          },
          config: {
            checkSecurity: true,
            validateRequest: true,
            validateResponse: true,
            mock: { dynamic: false },
            errors: true,
            upstreamProxy: undefined,
            isProxy: false,
          },
          cors: true,
        },
      );
      const { port, hostname } = new URL(
        process.env.NINJAODM_BASE_URL,
      );
      await mockServer.listen(Number(port), hostname);
      await use(mockServer);
      await mockServer.close();
    },
    { scope: "file" },
  ],
  serviceApiClient: [
    async ({ mockServer }, use) => {
      mockServer;
      const serviceApiClient = createServiceApiClient({
        baseUrl: process.env.NINJAODM_BASE_URL,
        hmacAuth: HMACAuthorization.create({
          apiKey: process.env.NINJAODM_API_KEY,
          apiSecret: process.env.NINJAODM_SECRET_KEY,
        }),
      });
      await use(serviceApiClient);
    },
    { scope: "file" },
  ],
});

suite.sequential("createServiceApiClient Test Suite", () => {
  test("getAPIHealth should return a health message", async ({
    serviceApiClient,
  }) => {
    const response = await serviceApiClient.getAPIHealth();
    expect(response.message).toBeDefined();
    expect(typeof response.message).toBe("string");
  });

  test("getWorkspaceInternal should return workspace details", async ({
    serviceApiClient,
  }) => {
    const testUuid = "d290f1ee-6c54-4b01-90e6-d701748f0851";

    const response = await serviceApiClient.getWorkspaceInternal({
      params: { uuid: testUuid },
    });

    expect(response).toBeDefined();
    expect(response.user_id).toBeDefined();
    expect(typeof response.user_id).toBe("string");
    expect(response.uuid).toBeDefined();
    expect(typeof response.uuid).toBe("string");
    expect(response.name).toBeDefined();
    expect(typeof response.name).toBe("string");
    expect(response.created_at).toBeDefined();
    expect(typeof response.created_at).toBe("string");
  });
});
