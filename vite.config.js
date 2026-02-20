import { resolve } from "path";
import { readFileSync } from "fs";
import { defineConfig } from "vite";
import glsl from "vite-plugin-glsl";
import react from "@vitejs/plugin-react";

function devManifest() {
  return {
    name: "dev-manifest",
    configureServer(server) {
      server.middlewares.use("/manifest.json", (_req, res) => {
        const manifest = JSON.parse(
          readFileSync(resolve(__dirname, "public/manifest.json"), "utf-8")
        );
        manifest.name = manifest.name + " (Dev)";
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify(manifest));
      });
    },
  };
}

export default defineConfig({
  plugins: [glsl(), react(), devManifest()],
  build: {
    assetsInlineLimit: 0,
    rollupOptions: {
      input: {
        background: resolve(__dirname, "background.html"),
        settings: resolve(__dirname, "settings.html"),
      },
    },
  },
  server: {
    port: 5199,
    cors: {
      origin: "https://www.owlbear.rodeo",
    },
  },
});
