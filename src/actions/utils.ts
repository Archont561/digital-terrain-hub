import { createServiceApiClient, HMACAuthorization } from "@/lib/server";

export const hmacAuth = HMACAuthorization.create({
  apiKey: process.env.NINJAODM_API_KEY!,
  apiSecret: process.env.NINJAODM_SECRET_KEY!,
});

export const serviceApiClient = createServiceApiClient({
  baseUrl: process.env.NINJAODM_BASE_URL!,
  hmacAuth,
});
