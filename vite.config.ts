import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";
import tsconfigPaths from "vite-tsconfig-paths";

const nitroPreset =
  process.env.NITRO_PRESET ||
  (process.env.VERCEL ? "vercel" : process.env.CF_PAGES ? "cloudflare-module" : undefined);

export default defineConfig({
  plugins: [
    tanstackStart({
      server: { entry: "server" },
    }),
    react(),
    tailwindcss(),
    tsconfigPaths(),
    nitro(nitroPreset ? { preset: nitroPreset } : {}),
  ],
  resolve: {
    alias: {
      "@": "/src",
    },
  },
  server: {
    port: 3000,
  },
});
