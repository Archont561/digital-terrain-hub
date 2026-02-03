import { afterAll, beforeAll } from "bun:test";
import path from "node:path";
import { createLogger } from "@stoplight/prism-core";
import { getHttpOperationsFromSpec } from "@stoplight/prism-http/dist";
import { createServer } from "@stoplight/prism-http-server";
import dotenv from "dotenv";
import PATH_TO_NINJAODM_OPENAPI_SPEC from "@/assets/ninjaodm.openapi.json";
import { createServiceApiClient, HMACAuthorization } from "@/lib";

/* ------------------------------------------------------------------ */
/* Environment setup                                                    */
/* ------------------------------------------------------------------ */

function loadEnv() {
  const envFile = path.resolve(import.meta.dirname, "../../.env.local");
  dotenv.config({ path: envFile });
}

function getRequiredEnv() {
  const baseUrl = process.env.NINJAODM_BASE_URL;
  const apiKey = process.env.NINJAODM_API_KEY;
  const apiSecret = process.env.NINJAODM_SECRET_KEY;

  if (!baseUrl || !apiKey || !apiSecret) {
    throw new Error(
      "Missing required environment variables: NINJAODM_BASE_URL, NINJAODM_API_KEY, or NINJAODM_SECRET_KEY",
    );
  }

  return { baseUrl, apiKey, apiSecret };
}

/* ------------------------------------------------------------------ */
/* Mock server                                                          */
/* ------------------------------------------------------------------ */

async function createMockServer() {
  const operations = await getHttpOperationsFromSpec(
    PATH_TO_NINJAODM_OPENAPI_SPEC,
  );

  return createServer(operations, {
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
  });
}

async function startMockServer(
  server: Awaited<ReturnType<typeof createMockServer>>,
  baseUrl: string,
) {
  const { port, hostname } = new URL(baseUrl);
  await server.listen(Number(port), hostname);
}

/* ------------------------------------------------------------------ */
/* API client                                                           */
/* ------------------------------------------------------------------ */

function createClient(baseUrl: string, apiKey: string, apiSecret: string) {
  return createServiceApiClient({
    baseUrl,
    hmacAuth: HMACAuthorization.create({ apiKey, apiSecret }),
  });
}

/* ------------------------------------------------------------------ */
/* Global test context                                                   */
/* ------------------------------------------------------------------ */

declare global {
  var testContext: {
    mockServer: Awaited<ReturnType<typeof createServer>>;
    serviceApiClient: ReturnType<typeof createServiceApiClient>;
  };
}

/* ------------------------------------------------------------------ */
/* Test lifecycle                                                       */
/* ------------------------------------------------------------------ */

beforeAll(async () => {
  console.log("🚀 Global test setup starting...");

  loadEnv();

  const { baseUrl, apiKey, apiSecret } = getRequiredEnv();
  console.log(`📡 Setting up mock server at ${baseUrl}...`);

  const mockServer = await createMockServer();
  await startMockServer(mockServer, baseUrl);

  const serviceApiClient = createClient(baseUrl, apiKey, apiSecret);

  global.testContext = {
    mockServer,
    serviceApiClient,
  };

  console.log("✅ Global test setup complete");
});

afterAll(async () => {
  console.log("🧹 Global test teardown starting...");

  if (global.testContext?.mockServer) {
    await global.testContext.mockServer.close();
    console.log("✅ Mock server closed");
  }

  console.log("✅ Global test teardown complete");
});
