/// <reference types="astro/client" />
/// <reference path="../.astro/types.d.ts" />

declare global {
  interface Window {
  }
}

namespace App {
  interface Locals {
    currentUserId: string | null;
  }
}

declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'dev' | 'prod' | 'test';
    TEST_ASTRO_BASE_URL: string;
    TEST_CLERK_AUTH_PLAYWRIGHT_STORAGE_FILE: string;
    TEST_AUTHENTICATED_CLERK_USER_ID: string;
    TEST_NINJAODM_SECRET_KEY: string;
    TEST_NINJAODM_BASE_MOCK_SERVER_URL: string;
    NINJAODM_SECRET_KEY: string;
    NINJAODM_API_KEY: string;
    NINJAODM_BASE_URL: string;
    PATH_TO_NINJAODM_OPENAPI_SPEC: string;
  }
}


// https://docs.astro.build/en/guides/environment-variables/#intellisense-for-typescript
interface ImportMetaEnv {
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
