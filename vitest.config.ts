/// <reference types="vitest/config" />

import path from "node:path";
import { getViteConfig } from "astro/config";
import dotenv from "dotenv";

const envFile = path.resolve(import.meta.dirname, ".env.local");
dotenv.config({ path: envFile });

export default getViteConfig({
  test: {
    globals: true,
    environment: "node",
    bail: 1,
    passWithNoTests: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/**/*.d.ts", "src/env.d.ts"],
    },
  },
});
