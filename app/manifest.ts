import type { MetadataRoute } from "next";

import { siteConfig } from "@/lib/site";

const iconVersion = "20260609";

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
        src: `/icon.svg?v=${iconVersion}`,
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: `/logo-light.svg?v=${iconVersion}`,
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: `/logo-dark.svg?v=${iconVersion}`,
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
