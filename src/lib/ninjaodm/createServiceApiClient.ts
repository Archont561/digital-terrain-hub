import type { ZodiosPlugin } from "@zodios/core";
import { createApiClient } from "./generated-api";
import type HMACAuthorization from "./HMACAuthorization";

interface ClientConfig {
  baseUrl: string;
}

interface ServiceClientConfig extends ClientConfig {
  hmacAuth: HMACAuthorization;
}

function resolveUrl(url: string, params?: Record<string, unknown>) {
  if (!params) return url;
  return Object.keys(params).reduce((acc, key) => {
    return acc.replace(`:${key}`, String(params[key]));
  }, url);
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
              path: resolveUrl(config.url, config.params),
            }),
        },
      };
    },
  };
}

export default function createServiceApiClient(config: ServiceClientConfig) {
  const { baseUrl, hmacAuth } = config;

  const client = createApiClient(baseUrl, { validate: "request" });
  client.use(createHMACPlugin(hmacAuth));
  return client;
}
