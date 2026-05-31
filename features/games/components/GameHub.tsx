"use client";

import { DiscoverParallaxContent } from "@/components/ui/text-parallax-content-scroll";
import { gameGenres, getGenreBySlug, type GenreSlug } from "@/features/games/genre-registry";
import { games, getGameBySlug } from "@/features/games/game-registry";
import { SnakeGame } from "@/features/games/snake/SnakeGame";
import type { GameDefinition } from "@/features/games/types";
import { siteConfig } from "@/lib/site";
import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Boxes,
  Crosshair,
  Flag,
  Gamepad2,
  Grid2X2,
  Lock,
  Map,
  Puzzle,
  Rocket,
  Search,
  Sparkles,
  Star,
  Trophy,
  Type,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { AnimatePresence, LazyMotion, domAnimation, m, useReducedMotion } from "motion/react";
import { useMemo, useState } from "react";

type GameHubView = "games" | "discover" | "genre";

type GameHubProps = {
  initialSlug?: string;
  initialGenre?: GenreSlug;
  view?: GameHubView;
};

type FeatureSlide = {
  slug: string;
  eyebrow: string;
  title: string;
  gameTitle: string;
  summary: string;
  image: string;
  gameSlug: GameDefinition["slug"];
};

const gameComponents = {
  snake: SnakeGame,
} as const;

const sidebarGenres = ["action", "adventure", "puzzle", "racing", "simulation", "strategy"];

const iconMap = {
  boxes: Boxes,
  crosshair: Crosshair,
  flag: Flag,
  gamepad: Gamepad2,
  grid: Grid2X2,
  map: Map,
  puzzle: Puzzle,
  rocket: Rocket,
  search: Search,
  spark: Sparkles,
  star: Star,
  trophy: Trophy,
  type: Type,
  users: Users,
  zap: Zap,
} satisfies Record<string, LucideIcon>;

const featuredSlides: FeatureSlide[] = [
  {
    slug: "starter",
    eyebrow: "Major update",
    title: "A cleaner home for small browser games.",
    gameTitle: "Snake",
    summary: "Classic movement, tight controls.",
    image: "/art/feature-dylan-games.png",
    gameSlug: "snake",
  },
  {
    slug: "puzzle",
    eyebrow: "Coming soon",
    title: "Puzzle shelves are ready for playable builds.",
    gameTitle: "Minesweeper",
    summary: "Logic games with quiet boards.",
    image: "/art/discover-puzzle.png",
    gameSlug: "minesweeper",
  },
  {
    slug: "racing",
    eyebrow: "Genre shelf",
    title: "Fast game slots without noisy chrome.",
    gameTitle: "Racing",
    summary: "Quick sessions, clear starts.",
    image: "/art/discover-racing.png",
    gameSlug: "pong",
  },
];

export function GameHub({ initialSlug = "snake", initialGenre, view = "games" }: GameHubProps) {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();
  const [selectedSlug, setSelectedSlug] = useState(
    () => getGameBySlug(initialSlug)?.slug ?? "snake",
  );
  const [featureIndex, setFeatureIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const selectedGame = useMemo(() => getGameBySlug(selectedSlug) ?? games[0], [selectedSlug]);
  const selectedGenre = initialGenre ? getGenreBySlug(initialGenre) : undefined;
  const isDiscover = view === "discover";

  const selectGame = (game: GameDefinition) => {
    setSelectedSlug(game.slug);
    router.push(`/games/${game.slug}` as Route, { scroll: false });
  };

  const selectFeature = (direction: -1 | 1) => {
    setFeatureIndex(
      (current) => (current + direction + featuredSlides.length) % featuredSlides.length,
    );
  };

  return (
    <LazyMotion features={domAnimation}>
      <div className="arcade-frame">
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        <Sidebar
          activeView={view}
          activeGenre={initialGenre}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
        <main id="main-content" className="arcade-main">
          {isDiscover ? (
            <DiscoverView />
          ) : (
            <GamesView
              activeGenre={selectedGenre}
              featureIndex={featureIndex}
              searchQuery={searchQuery}
              selectedGame={selectedGame}
              shouldReduceMotion={Boolean(shouldReduceMotion)}
              onFeatureDirection={selectFeature}
              onFeatureSelect={setFeatureIndex}
              onGameSelect={selectGame}
            />
          )}
        </main>
      </div>
    </LazyMotion>
  );
}

function Sidebar({
  activeView,
  activeGenre,
  searchQuery,
  onSearchChange,
}: {
  activeView: GameHubView;
  activeGenre?: GenreSlug;
  searchQuery: string;
  onSearchChange: (value: string) => void;
}) {
  return (
    <aside className="arcade-sidebar" aria-label="Dylan Games navigation">
      <div className="window-dots" aria-hidden="true">
        <span className="dot red" />
        <span className="dot yellow" />
        <span className="dot green" />
      </div>

      <label className="sidebar-search">
        <Search aria-hidden="true" />
        <span className="sr-only">Search games</span>
        <input
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search"
          type="search"
        />
      </label>

      <nav className="sidebar-nav" aria-label="Sections">
        <SidebarLink
          href="/"
          icon={Grid2X2}
          label="Games"
          active={activeView !== "discover" && !activeGenre}
        />
        <SidebarLink
          href="/discover"
          icon={Star}
          label="Discover"
          active={activeView === "discover"}
        />
        {gameGenres
          .filter((genre) => sidebarGenres.includes(genre.slug))
          .map((genre) => (
            <SidebarLink
              key={genre.slug}
              href={`/genres/${genre.slug}` as Route}
              icon={iconMap[genre.icon]}
              label={genre.label}
              active={activeGenre === genre.slug}
            />
          ))}
      </nav>

      <a className="sidebar-profile" href="https://dylanwlim.com" rel="noreferrer">
        <span className="profile-mark" aria-hidden="true">
          <img src="/icons/dylan-games-mark.svg" alt="" />
        </span>
        <span>dylanwlim.com</span>
      </a>
    </aside>
  );
}

function SidebarLink({
  href,
  icon: Icon,
  label,
  active,
}: {
  href: Route;
  icon: LucideIcon;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      className={`sidebar-link ${active ? "active" : ""}`}
      href={href}
      aria-current={active ? "page" : undefined}
    >
      <Icon aria-hidden="true" />
      <span>{label}</span>
    </Link>
  );
}

function GamesView({
  activeGenre,
  featureIndex,
  searchQuery,
  selectedGame,
  shouldReduceMotion,
  onFeatureDirection,
  onFeatureSelect,
  onGameSelect,
}: {
  activeGenre?: ReturnType<typeof getGenreBySlug>;
  featureIndex: number;
  searchQuery: string;
  selectedGame: GameDefinition;
  shouldReduceMotion: boolean;
  onFeatureDirection: (direction: -1 | 1) => void;
  onFeatureSelect: (index: number) => void;
  onGameSelect: (game: GameDefinition) => void;
}) {
  const feature = featuredSlides[featureIndex];
  const visibleGames = games.filter((game) => {
    const matchesGenre = activeGenre ? game.genre === activeGenre.label : true;
    const search = searchQuery.trim().toLowerCase();
    const matchesSearch = search
      ? `${game.title} ${game.genre} ${game.summary}`.toLowerCase().includes(search)
      : true;
    return matchesGenre && matchesSearch;
  });

  return (
    <div className="games-page">
      <header className="arcade-title">
        <h1>Games</h1>
      </header>

      <section className="feature-carousel" aria-label="Featured games">
        <button
          className="carousel-arrow previous"
          type="button"
          onClick={() => onFeatureDirection(-1)}
          aria-label="Previous featured game"
        >
          <ArrowLeft aria-hidden="true" />
        </button>
        <m.div
          className="feature-card"
          key={feature.slug}
          initial={shouldReduceMotion ? false : { opacity: 0.88 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          <Image
            src={feature.image}
            alt={`${feature.gameTitle} feature artwork`}
            fill
            priority={featureIndex === 0}
            sizes="(max-width: 900px) 100vw, calc(100vw - 380px)"
            className="feature-image"
          />
          <div className="feature-scrim" aria-hidden="true" />
          <div className="feature-copy">
            <p>{feature.eyebrow}</p>
            <h2>{feature.title}</h2>
            <div className="feature-app-card">
              <span className="feature-icon" aria-hidden="true">
                <Image src={feature.image} alt="" fill sizes="42px" />
              </span>
              <span className="feature-app-copy">
                <strong>{feature.gameTitle}</strong>
                <small>{feature.summary}</small>
              </span>
              <Link className="get-button" href={`/games/${feature.gameSlug}` as Route}>
                Get
              </Link>
            </div>
          </div>
          <div className="carousel-dots" aria-label="Featured game slides">
            {featuredSlides.map((slide, index) => (
              <button
                key={slide.slug}
                className={index === featureIndex ? "active" : ""}
                type="button"
                onClick={() => onFeatureSelect(index)}
                aria-label={`Show ${slide.gameTitle}`}
                aria-pressed={index === featureIndex}
              />
            ))}
          </div>
        </m.div>
        <button
          className="carousel-arrow next"
          type="button"
          onClick={() => onFeatureDirection(1)}
          aria-label="Next featured game"
        >
          <ArrowRight aria-hidden="true" />
        </button>
      </section>

      <GenrePills activeGenre={activeGenre?.slug} />

      <section className="game-shelf" aria-labelledby="game-shelf-title">
        <div className="shelf-heading">
          <div>
            <p>{activeGenre ? activeGenre.label : "All Games"}</p>
            <h2 id="game-shelf-title">
              {searchQuery
                ? "Search results"
                : activeGenre
                  ? `${activeGenre.label} games`
                  : "Available and upcoming"}
            </h2>
          </div>
          <span>{visibleGames.length} shown</span>
        </div>

        {visibleGames.length ? (
          <div className="shelf-grid" role="list">
            {visibleGames.map((game) => (
              <GameTile
                key={game.slug}
                game={game}
                selected={game.slug === selectedGame.slug}
                onSelect={() => onGameSelect(game)}
              />
            ))}
          </div>
        ) : (
          <EmptyGenreState genre={activeGenre?.label ?? "Games"} />
        )}
      </section>

      <GameLauncher selectedGame={selectedGame} onPlaySnake={() => onGameSelect(games[0])} />
    </div>
  );
}

function DiscoverView() {
  return (
    <div className="discover-page">
      <header className="arcade-title discover-title">
        <h1>Discover</h1>
        <p>
          A focused look at the games, genres, and release-ready structure behind{" "}
          <Link href="/">Dylan Games</Link>.
        </p>
      </header>
      <DiscoverParallaxContent />
    </div>
  );
}

function GenrePills({ activeGenre }: { activeGenre?: GenreSlug }) {
  return (
    <nav className="genre-pills" aria-label="Game genres">
      <Link className={`genre-pill ${!activeGenre ? "active" : ""}`} href="/">
        <Grid2X2 aria-hidden="true" />
        <span>All Games</span>
      </Link>
      {gameGenres.map((genre) => {
        const Icon = iconMap[genre.icon];
        return (
          <Link
            key={genre.slug}
            className={`genre-pill ${activeGenre === genre.slug ? "active" : ""}`}
            href={`/genres/${genre.slug}` as Route}
          >
            <Icon aria-hidden="true" />
            <span>{genre.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function GameTile({
  game,
  selected,
  onSelect,
}: {
  game: GameDefinition;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <div className={`shelf-card ${selected ? "selected" : ""}`} role="listitem">
      <button type="button" onClick={onSelect} aria-pressed={selected}>
        <span className={`game-preview ${game.preview} accent-${game.accent}`} aria-hidden="true">
          <PreviewArt kind={game.preview} />
        </span>
        <span className="shelf-card-copy">
          <span>
            <strong>{game.title}</strong>
            <small>{game.genre}</small>
          </span>
          <span className={`mini-status ${game.status}`}>
            {game.status === "playable" ? (
              <Gamepad2 aria-hidden="true" />
            ) : (
              <Lock aria-hidden="true" />
            )}
            {game.status === "playable" ? "Playable" : "Soon"}
          </span>
        </span>
      </button>
    </div>
  );
}

function GameLauncher({
  selectedGame,
  onPlaySnake,
}: {
  selectedGame: GameDefinition;
  onPlaySnake: () => void;
}) {
  const GameComponent = gameComponents[selectedGame.slug as keyof typeof gameComponents];

  return (
    <section id="launcher" className="launcher-panel" aria-labelledby="launcher-title">
      <div className="launcher-header">
        <div>
          <p>{selectedGame.status === "playable" ? "Playing" : "Preview"}</p>
          <h2 id="launcher-title">{selectedGame.title}</h2>
          <span>{selectedGame.summary}</span>
        </div>
        <span className={`status-badge ${selectedGame.status}`}>
          {selectedGame.status === "playable" ? (
            <Sparkles aria-hidden="true" />
          ) : (
            <Lock aria-hidden="true" />
          )}
          {selectedGame.status === "playable" ? "Playable" : "Coming soon"}
        </span>
      </div>

      <AnimatePresence mode="wait">
        <m.div
          key={selectedGame.slug}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          {GameComponent ? (
            <GameComponent />
          ) : (
            <UnavailableGame game={selectedGame} onPlaySnake={onPlaySnake} />
          )}
        </m.div>
      </AnimatePresence>
    </section>
  );
}

function EmptyGenreState({ genre }: { genre: string }) {
  return (
    <div className="empty-genre-state">
      <Sparkles aria-hidden="true" />
      <h3>{genre} shelf is ready.</h3>
      <p>This genre does not have a playable slot yet, but the page and navigation are built.</p>
    </div>
  );
}

function UnavailableGame({ game, onPlaySnake }: { game: GameDefinition; onPlaySnake: () => void }) {
  return (
    <div className="unavailable-state">
      <div className={`unavailable-art ${game.preview} accent-${game.accent}`} aria-hidden="true">
        <PreviewArt kind={game.preview} />
      </div>
      <div>
        <p>Reserved slot</p>
        <h3>{game.title} is not playable yet.</h3>
        <span>{game.description}</span>
        <button className="secondary-action" type="button" onClick={onPlaySnake}>
          Play Snake
          <ArrowUpRight aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

function PreviewArt({ kind }: { kind: GameDefinition["preview"] }) {
  if (kind === "snake") {
    return (
      <>
        <i className="snake-dot a" />
        <i className="snake-dot b" />
        <i className="snake-dot c" />
        <i className="snake-dot d" />
        <i className="food-dot" />
      </>
    );
  }

  if (kind === "minesweeper") {
    return (
      <span className="mine-grid">
        {Array.from({ length: 9 }, (_, index) => (
          <i key={index}>{index === 1 ? "1" : index === 3 ? "2" : ""}</i>
        ))}
      </span>
    );
  }

  if (kind === "pong") {
    return (
      <>
        <i className="paddle left" />
        <i className="paddle right" />
        <i className="ball" />
      </>
    );
  }

  if (kind === "tiles") {
    return (
      <span className="tile-stack">
        {Array.from({ length: 7 }, (_, index) => (
          <i key={index} />
        ))}
      </span>
    );
  }

  if (kind === "orbit") {
    return (
      <>
        <i className="orbit-ring" />
        <i className="orbit-core" />
        <i className="orbit-moon" />
      </>
    );
  }

  return (
    <>
      <i className="path-ring" />
      <i className="path-number">2048</i>
    </>
  );
}
