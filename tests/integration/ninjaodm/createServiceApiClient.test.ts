import { describe, expect, test } from "bun:test";

describe("Service API Client - Basic Verification", () => {
  test("global test context is initialized", () => {
    expect(global.testContext).toBeDefined();
    expect(global.testContext.mockServer).toBeDefined();
    expect(global.testContext.serviceApiClient).toBeDefined();
  });

  test("health check endpoint works", async () => {
    const response = await global.testContext.serviceApiClient.getAPIHealth();

    expect(response).toBeDefined();
    expect(response.message).toBeDefined();
    expect(typeof response.message).toBe("string");
    console.log("✅ Health check response:", response.message);
  });
});
