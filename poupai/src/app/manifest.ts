import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Poupai — Controle Financeiro",
    short_name: "Poupai",
    description: "Controle financeiro pessoal",
    start_url: "/",
    display: "standalone",
    background_color: "#09090b",
    theme_color: "#6366f1",
    orientation: "portrait",
    categories: ["finance", "productivity"],
    icons: [
      {
        src: "/api/pwa-icon?s=192",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/api/pwa-icon?s=512",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/api/pwa-icon?s=512",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
