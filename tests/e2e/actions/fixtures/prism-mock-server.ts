import { createLogger } from "@stoplight/prism-core";
import { getHttpOperationsFromSpec } from "@stoplight/prism-http/dist/index.js";
import { createServer } from "@stoplight/prism-http-server";

export async function createMockServer(specFilePathOrObject: string | object) {
  const operations = await getHttpOperationsFromSpec(
    specFilePathOrObject,
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
