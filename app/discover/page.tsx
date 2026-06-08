import type { Metadata } from "next";

import { GameHub } from "@/features/games/components/game-hub";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Discover",
  description: `Discover what is new across ${siteConfig.name}.`,
  alternates: {
    canonical: "/discover",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function DiscoverPage() {
  return <GameHub key="discover" view="discover" />;
}
