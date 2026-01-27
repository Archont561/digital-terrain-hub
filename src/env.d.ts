/// <reference types="astro/client" />
/// <reference path="../.astro/types.d.ts" />

export {};

declare global {
  interface Window {
    Alpine: import("alpinejs").Alpine;
  }

  namespace App {
    interface Locals {
      currentUserId: string | null;
    }
  }
  
  declare namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'dev' | 'prod' | 'test';
      ASTRO_BASE_URL: string;
      TEST_CLERK_AUTH_PLAYWRIGHT_STORAGE_FILE: string;
      TEST_AUTHENTICATED_CLERK_USER_ID: string;
      NINJAODM_SECRET_KEY: string;
      NINJAODM_API_KEY: string;
      NINJAODM_BASE_URL: string;
    }
  }


  // https://docs.astro.build/en/guides/environment-variables/#intellisense-for-typescript
  interface ImportMetaEnv {
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }

}