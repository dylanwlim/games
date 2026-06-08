import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { GameHub } from "@/features/games/components/game-hub";
import { gameGenres, getGenreBySlug, isGenreSlug } from "@/features/games/genre-registry";
import { siteConfig } from "@/lib/site";

type GenreRouteProps = {
  params: Promise<{
    genre: string;
  }>;
};

export function generateStaticParams() {
  return gameGenres.map((genre) => ({ genre: genre.slug }));
}

export async function generateMetadata({ params }: GenreRouteProps): Promise<Metadata> {
  const { genre: slug } = await params;
  const genre = getGenreBySlug(slug);

  if (!genre) {
    return {};
  }

  return {
    title: `${genre.label} Games`,
    description: `${genre.label} games on ${siteConfig.name}.`,
    alternates: {
      canonical: `/genres/${genre.slug}`,
    },
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function GenrePage({ params }: GenreRouteProps) {
  const { genre } = await params;

  if (!isGenreSlug(genre)) {
    notFound();
  }

  return (
    <GameHub
      key={genre}
      initialSlug={genre === "word" ? "cipher" : "snake"}
      initialGenre={genre}
      view="genre"
    />
  );
}
