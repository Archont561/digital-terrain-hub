import path from "node:path";
import node from "@astrojs/node";
import clerk from "@clerk/astro";
import runtimeLogger from "@inox-tools/runtime-logger";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import dotenv from "dotenv";

const envFile = path.resolve(import.meta.dirname, ".env.local");
dotenv.config({ path: envFile });

// https://astro.build/config
export default defineConfig({
  integrations: [clerk(), runtimeLogger()],
  vite: {
    plugins: [tailwindcss()],
  },
  adapter: node({ mode: "standalone" }),
  output: "server",
});
