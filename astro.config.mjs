import alpinejs from "@astrojs/alpinejs";
import node from "@astrojs/node";
import clerk from "@clerk/astro";
import runtimeLogger from "@inox-tools/runtime-logger";
import tailwindcss from "@tailwindcss/vite";
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
});
