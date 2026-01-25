import path from "node:path";
import alpinejs from "@astrojs/alpinejs";
import node from "@astrojs/node";
import clerk from "@clerk/astro";
import runtimeLogger from "@inox-tools/runtime-logger";
import tailwindcss from "@tailwindcss/vite";
import dotenv from "dotenv";

const envFile = path.resolve(import.meta.dirname, ".env.local");
dotenv.config({ path: envFile });

// @ts-check
import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
  integrations: [
    clerk(),
    runtimeLogger(),
    alpinejs({ entrypoint: "./src/lib/alpine/entrypoint.ts" }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
  adapter: node({ mode: "standalone" }),
  output: "server",
  server: {
    host: process.env.HOST,
    port: Number(process.env.PORT),
  },
});
