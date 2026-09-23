import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),

    VitePWA({
      registerType: "autoUpdate",

      includeAssets: [
        "favicon.ico",
        "vilgar-favicon-192.png",
        "vilgar-favicon-512.png",
        "logo-vilgar.png",
      ],

      manifest: {
        name: "VILGAR - Productos de Limpieza",
        short_name: "VILGAR",
        description:
          "Productos de limpieza para hogar, comercios, empresas e industria.",

        theme_color: "#111827",
        background_color: "#ffffff",

        display: "standalone",

        start_url: "/",
        scope: "/",

        icons: [
          {
            src: "/vilgar-favicon-192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/vilgar-favicon-512.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
    }),
  ],
});
