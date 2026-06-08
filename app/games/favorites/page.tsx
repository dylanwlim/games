import type { Metadata } from "next";

import { GameHub } from "@/features/games/components/game-hub";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Favorites",
  description: `Favorite games and quick returns on ${siteConfig.name}.`,
  alternates: {
    canonical: "/games/favorites",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function FavoritesPage() {
  return <GameHub key="favorites" view="favorites" />;
}
