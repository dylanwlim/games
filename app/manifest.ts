import type { MetadataRoute } from "next";

import { siteConfig } from "@/lib/site";

const iconVersion = "20260602";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: siteConfig.name,
    short_name: "Games",
    description: siteConfig.description,
    start_url: "/",
    display: "standalone",
    background_color: "#f7f8fb",
    theme_color: "#f7f8fb",
    icons: [
      {
        src: `/icons/icon-192x192.png?v=${iconVersion}`,
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: `/icons/icon-512x512.png?v=${iconVersion}`,
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
