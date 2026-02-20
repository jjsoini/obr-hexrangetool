import { resolve } from "path";
import { defineConfig } from "vite";
import glsl from "vite-plugin-glsl";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [glsl(), react()],
  build: {
    assetsInlineLimit: 0,
    rollupOptions: {
      input: {
        background: resolve(__dirname, "background.html"),
        theme: resolve(__dirname, "theme.html"),
        settings: resolve(__dirname, "settings.html"),
      },
    },
  },
  server: {
    cors: {
      origin: "https://www.owlbear.rodeo",
    },
  },
});
