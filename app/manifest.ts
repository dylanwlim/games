import type { MetadataRoute } from "next";

import { siteConfig } from "@/lib/site";

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
        src: "/icons/dylan-games-mark.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
