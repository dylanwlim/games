import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { GameHub } from "@/features/games/components/GameHub";
import { games, getGameBySlug, isGameSlug } from "@/features/games/game-registry";
import { siteConfig } from "@/lib/site";

type GameRouteProps = {
  params: Promise<{
    slug: string;
  }>;
};

export function generateStaticParams() {
  return games.map((game) => ({ slug: game.slug }));
}

export async function generateMetadata({ params }: GameRouteProps): Promise<Metadata> {
  const { slug } = await params;
  const game = getGameBySlug(slug);

  if (!game) {
    return {};
  }

  return {
    title: game.title,
    description: `${game.title} on ${siteConfig.name}. ${game.summary}`,
    alternates: {
      canonical: `/games/${game.slug}`,
    },
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function GamePage({ params }: GameRouteProps) {
  const { slug } = await params;

  if (!isGameSlug(slug)) {
    notFound();
  }

  return <GameHub key={slug} initialSlug={slug} view="games" />;
}
