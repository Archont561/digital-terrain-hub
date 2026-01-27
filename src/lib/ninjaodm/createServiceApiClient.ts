import type { ZodiosPlugin } from "@zodios/core";
import { createApiClient } from "./generated-api";
import type HMACAuthorization from "./HMACAuthorization";

interface ClientConfig {
  baseUrl: string;
}

interface ServiceClientConfig extends ClientConfig {
  hmacAuth: HMACAuthorization;
}

function createHMACPlugin(hmacAuth: HMACAuthorization): ZodiosPlugin {
  return {
    name: "hmac-auth",
    request: async (_, config) => {
      return {
        ...config,
        headers: {
          ...config.headers,
          Authorization:
            "Bearer " +
            hmacAuth.createToken({
              method: config.method,
              path: config.url,
            }),
        },
      };
    },
  };
}

export default function createServiceApiClient(config: ServiceClientConfig) {
  const { baseUrl, hmacAuth } = config;

  const client = createApiClient(baseUrl);
  client.use(createHMACPlugin(hmacAuth));
  return client;
}
