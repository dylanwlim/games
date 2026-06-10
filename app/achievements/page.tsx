import type { Metadata } from "next";

import { GameHub } from "@/features/games/components/game-hub";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Achievements",
  description: `XP and achievements across ${siteConfig.name}.`,
  alternates: {
    canonical: "/achievements",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function AchievementsPage() {
  return <GameHub key="achievements" view="achievements" />;
}
