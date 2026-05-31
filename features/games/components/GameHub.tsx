"use client";

import { DiscoverParallaxContent } from "@/components/ui/text-parallax-content-scroll";
import { gameGenres, getGenreBySlug, type GenreSlug } from "@/features/games/genre-registry";
import { games, getGameBySlug } from "@/features/games/game-registry";
import { SnakeGame } from "@/features/games/snake/SnakeGame";
import type { GameDefinition } from "@/features/games/types";
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
  Heart,
  Lock,
  Map,
  Menu,
  Play,
  Puzzle,
  Rocket,
  Search,
  Sparkles,
  Star,
  Trophy,
  Type,
  Users,
  VolumeX,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";
import {
  AnimatePresence,
  LazyMotion,
  domAnimation,
  m,
  useReducedMotion,
  type Variants,
} from "motion/react";
import { useMemo, useState } from "react";

type GameHubView = "games" | "discover" | "favorites" | "genre";

type GameHubProps = {
  initialSlug?: string;
  initialGenre?: GenreSlug;
  focusGame?: boolean;
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

const allGames: GameDefinition[] = games;
const fallbackGame = allGames[0] as GameDefinition;
const sidebarGenres = ["action", "adventure", "puzzle", "racing", "simulation", "strategy"];
const favoriteGameSlugs = ["snake", "minesweeper", "orbit"] as const;
const topArcadeSlugs = [
  "snake",
  "minesweeper",
  "pong",
  "tiles",
  "orbit",
  "2048",
  "dashline",
  "sky-courier",
  "word-forge",
] as const;
const recentlyUpdatedSlugs = [
  "minesweeper",
  "snake",
  "tiles",
  "orbit",
  "dashline",
  "family-stack",
  "sim-garden",
  "strategy-path",
] as const;
const newGameSlugs = [
  "sky-courier",
  "orbit",
  "dashline",
  "2048",
  "sim-garden",
  "word-forge",
  "family-stack",
  "strategy-path",
] as const;
const categorySlugs = ["strategy", "puzzle", "action", "casual", "family"] as const;

const genrePreviewArt: Partial<
  Record<GenreSlug, { accent: GameDefinition["accent"]; preview: GameDefinition["preview"] }>
> = {
  action: { accent: "green", preview: "snake" },
  adventure: { accent: "teal", preview: "orbit" },
  puzzle: { accent: "blue", preview: "minesweeper" },
  racing: { accent: "slate", preview: "pong" },
  simulation: { accent: "teal", preview: "orbit" },
  strategy: { accent: "amber", preview: "path" },
};

const genrePageCopy: Partial<
  Record<GenreSlug, { description: string; focus: string; rhythm: string }>
> = {
  action: {
    description: "Fast rounds, clean restarts, and games that make sense the moment they open.",
    focus: "Immediate loops",
    rhythm: "Short sessions with room for tighter arcade builds.",
  },
  adventure: {
    description:
      "Small exploration ideas reserved for readable maps, simple movement, and playful goals.",
    focus: "Readable worlds",
    rhythm: "Calm routes, compact scenes, and clear next steps.",
  },
  puzzle: {
    description:
      "Quiet boards and logic-first layouts for games that reward focus over visual noise.",
    focus: "Finished puzzle shells",
    rhythm: "Stable routes for Minesweeper, Tiles, and 2048.",
  },
  racing: {
    description:
      "A prepared shelf for quick races, time trials, and motion-led browser experiments.",
    focus: "Fast starts",
    rhythm: "Lean game slots that can become playable without reshaping the hub.",
  },
  simulation: {
    description: "A slower shelf for small systems, toy economies, and readable state changes.",
    focus: "Tiny systems",
    rhythm: "Simple loops that make cause and effect visible.",
  },
  strategy: {
    description: "A planning shelf for turn-based ideas, clean boards, and tactical constraints.",
    focus: "Clear decisions",
    rhythm: "Compact rulesets with visible outcomes.",
  },
};

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

export function GameHub({
  initialSlug = "snake",
  initialGenre,
  focusGame = false,
  view = "games",
}: GameHubProps) {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();
  const [selectedSlug, setSelectedSlug] = useState(
    () => getGameBySlug(initialSlug)?.slug ?? "snake",
  );
  const [featureIndex, setFeatureIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const selectedGame = useMemo(() => getGameBySlug(selectedSlug) ?? fallbackGame, [selectedSlug]);
  const selectedGenre = initialGenre ? getGenreBySlug(initialGenre) : undefined;
  const isGames = view === "games";

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
        <button
          className="sidebar-toggle"
          type="button"
          aria-controls="arcade-sidebar"
          aria-expanded={sidebarOpen}
          disabled={sidebarOpen}
          onClick={() => setSidebarOpen(true)}
        >
          <Menu aria-hidden="true" />
          <span className="sr-only">Open navigation</span>
        </button>
        <AnimatePresence>
          {sidebarOpen ? (
            <>
              <m.button
                className="sidebar-scrim"
                type="button"
                aria-label="Dismiss navigation"
                onClick={() => setSidebarOpen(false)}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.16, ease: "easeOut" }}
              />
              <Sidebar
                activeView={view}
                activeGenre={initialGenre}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onClose={() => setSidebarOpen(false)}
              />
            </>
          ) : null}
        </AnimatePresence>
        <main id="main-content" className="arcade-main">
          {isGames ? (
            <GamesView
              activeGenre={selectedGenre}
              featureIndex={featureIndex}
              focusGame={focusGame}
              searchQuery={searchQuery}
              selectedGame={selectedGame}
              shouldReduceMotion={Boolean(shouldReduceMotion)}
              onFeatureDirection={selectFeature}
              onFeatureSelect={setFeatureIndex}
              onGameSelect={selectGame}
            />
          ) : (
            <CollectionView activeGenre={selectedGenre} searchQuery={searchQuery} view={view} />
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
  onClose,
}: {
  activeView: GameHubView;
  activeGenre?: GenreSlug;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onClose: () => void;
}) {
  return (
    <m.aside
      id="arcade-sidebar"
      className="arcade-sidebar"
      aria-label="Dylan Games navigation"
      initial={{ x: "-102%" }}
      animate={{ x: 0 }}
      exit={{ x: "-102%" }}
      transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="sidebar-topbar">
        <span>Dylan Games</span>
        <button
          className="sidebar-close"
          type="button"
          onClick={onClose}
          aria-label="Close navigation"
        >
          <X aria-hidden="true" />
        </button>
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
          active={activeView === "games" && !activeGenre}
        />
        <SidebarLink
          href={"/games/favorites" as Route}
          icon={Heart}
          label="Favorites"
          active={activeView === "favorites"}
        />
        <SidebarLink
          href={"/discover" as Route}
          icon={Star}
          label="Discover"
          active={activeView === "discover"}
        />
        {gameGenres
          .filter((genre) => sidebarGenres.includes(genre.slug))
          .map((genre) => (
            <SidebarLink
              key={genre.slug}
              href={`/genres/${genre.slug}`}
              icon={iconMap[genre.icon]}
              label={genre.label}
              active={activeGenre === genre.slug}
            />
          ))}
      </nav>

      <a className="sidebar-profile" href="https://dylanwlim.com" rel="noreferrer">
        <span className="profile-mark" aria-hidden="true">
          <Image src="/icons/dylan-games-mark.svg" alt="" width={28} height={28} />
        </span>
        <span>dylanwlim.com</span>
      </a>
    </m.aside>
  );
}

function SidebarLink({
  href,
  icon: Icon,
  label,
  active,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      className={`sidebar-link ${active ? "active" : ""}`}
      href={href as Route}
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
  focusGame,
  searchQuery,
  selectedGame,
  shouldReduceMotion,
  onFeatureDirection,
  onFeatureSelect,
  onGameSelect,
}: {
  activeGenre?: ReturnType<typeof getGenreBySlug>;
  featureIndex: number;
  focusGame: boolean;
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
            loading="eager"
            sizes="(max-width: 900px) 100vw, calc(100vw - 380px)"
            className="feature-image"
          />
          <div className="feature-scrim" aria-hidden="true" />
          <div className="feature-copy">
            <p>{feature.eyebrow}</p>
            <h2>{feature.title}</h2>
            <div className="feature-app-card">
              <span className="feature-icon" aria-hidden="true">
                <Image src={feature.image} alt="" fill loading="eager" sizes="42px" />
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

      {focusGame ? (
        <>
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
        </>
      ) : (
        <ArcadeStorefront searchQuery={searchQuery} shouldReduceMotion={shouldReduceMotion} />
      )}
    </div>
  );
}

const storefrontEase = [0.22, 1, 0.36, 1] as const;

const storefrontContainerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.055,
    },
  },
};

const storefrontSectionVariants: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.28, ease: storefrontEase },
  },
};

const storefrontItemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.22, ease: "easeOut" },
  },
};

function ArcadeStorefront({
  searchQuery,
  shouldReduceMotion,
}: {
  searchQuery: string;
  shouldReduceMotion: boolean;
}) {
  const topGames = filterStorefrontGames(getGamesBySlugs(topArcadeSlugs), searchQuery);
  const updatedGames = filterStorefrontGames(getGamesBySlugs(recentlyUpdatedSlugs), searchQuery);
  const newGames = filterStorefrontGames(getGamesBySlugs(newGameSlugs), searchQuery);
  const visibleCount = topGames.length + updatedGames.length + newGames.length;
  const motionProps = shouldReduceMotion
    ? { initial: false as const }
    : {
        initial: "hidden" as const,
        animate: "visible" as const,
        variants: storefrontContainerVariants,
      };

  if (searchQuery.trim() && visibleCount === 0) {
    return (
      <m.div className="arcade-storefront" {...motionProps}>
        <EmptyGenreState genre="Search" />
      </m.div>
    );
  }

  return (
    <m.div className="arcade-storefront" {...motionProps}>
      <ArcadeListSection title="Top Arcade Games" games={topGames} ranked />
      <ArcadeListSection title="Recently Updated" games={updatedGames} seeAllHref="/discover" />
      <ArcadeListSection title="New Games" games={newGames} seeAllHref="/discover" />
      <ContinuePlayingSection />
      <CategoryStoreSection />
      <ComingSoonSection />
    </m.div>
  );
}

function ArcadeListSection({
  title,
  games: sectionGames,
  ranked = false,
  seeAllHref,
}: {
  title: string;
  games: GameDefinition[];
  ranked?: boolean;
  seeAllHref?: string;
}) {
  if (!sectionGames.length) {
    return null;
  }

  const titleId = title.toLowerCase().replaceAll(" ", "-");

  return (
    <m.section
      className="store-section arcade-list-section"
      aria-labelledby={titleId}
      variants={storefrontSectionVariants}
    >
      <div className="store-section-header">
        <h2 id={titleId}>{title}</h2>
        {seeAllHref ? (
          <Link href={seeAllHref as Route} className="see-all-link">
            See All
          </Link>
        ) : null}
      </div>
      <div className={`store-list-grid ${ranked ? "ranked" : ""}`} role="list">
        {sectionGames.map((game, index) => (
          <m.div key={`${title}-${game.slug}`} role="listitem" variants={storefrontItemVariants}>
            <ArcadeListRow game={game} rank={ranked ? index + 1 : undefined} source={title} />
          </m.div>
        ))}
      </div>
    </m.section>
  );
}

function ArcadeListRow({
  game,
  rank,
  source,
}: {
  game: GameDefinition;
  rank?: number;
  source: string;
}) {
  return (
    <Link
      className={`store-row ${rank ? "ranked" : ""}`}
      href={`/games/${game.slug}` as Route}
      aria-label={`Get ${game.title} from ${source}`}
    >
      <ArcadeAppIcon game={game} />
      {rank ? <span className="store-rank">{rank}</span> : null}
      <span className="store-row-copy">
        <small>Dylan Games</small>
        <strong>{game.title}</strong>
        <span>{game.summary}</span>
      </span>
      <span className="store-get-button">Get</span>
    </Link>
  );
}

function ContinuePlayingSection() {
  const snake = getGameBySlug("snake") ?? fallbackGame;
  const minesweeper = getGameBySlug("minesweeper") ?? fallbackGame;

  return (
    <m.section
      className="store-section continue-section"
      aria-labelledby="continue-playing-title"
      variants={storefrontSectionVariants}
    >
      <div className="game-center-label">Game Center</div>
      <h2 id="continue-playing-title">Continue Playing</h2>
      <div className="continue-grid">
        <ContinueCard
          game={snake}
          image="/art/feature-dylan-games.png"
          actionIcon={VolumeX}
          summary="Classic movement, tight controls."
        />
        <ContinueCard
          game={minesweeper}
          image="/art/discover-puzzle.png"
          actionIcon={Play}
          summary="Quiet logic, readable boards."
        />
      </div>
    </m.section>
  );
}

function ContinueCard({
  game,
  image,
  actionIcon: ActionIcon,
  summary,
}: {
  game: GameDefinition;
  image: string;
  actionIcon: LucideIcon;
  summary: string;
}) {
  return (
    <m.div variants={storefrontItemVariants}>
      <Link
        className="continue-card"
        href={`/games/${game.slug}` as Route}
        aria-label={`Get ${game.title} from Continue Playing`}
      >
        <Image
          src={image}
          alt={`${game.title} continue playing artwork`}
          fill
          sizes="(max-width: 900px) 100vw, 48vw"
          className="continue-image"
        />
        <span className="continue-overlay" aria-hidden="true" />
        <span className="continue-control" aria-hidden="true">
          <ActionIcon />
        </span>
        <span className="continue-footer">
          <ArcadeAppIcon game={game} small />
          <span>
            <small>Dylan Games</small>
            <strong>{game.title}</strong>
            <em>{summary}</em>
          </span>
          <span className="store-get-button">Get</span>
        </span>
      </Link>
    </m.div>
  );
}

function CategoryStoreSection() {
  return (
    <m.section
      className="store-section categories-section"
      aria-labelledby="categories-title"
      variants={storefrontSectionVariants}
    >
      <h2 id="categories-title">Categories</h2>
      <div className="category-card-grid">
        {categorySlugs.map((slug) => {
          const genre = getGenreBySlug(slug);
          const art = genrePreviewArt[slug] ?? { accent: "blue", preview: "tiles" };

          if (!genre) {
            return null;
          }

          return (
            <m.div key={slug} variants={storefrontItemVariants}>
              <Link className={`category-card category-${slug}`} href={`/genres/${slug}` as Route}>
                <span className={`category-art accent-${art.accent}`} aria-hidden="true">
                  <PreviewArt kind={art.preview} />
                </span>
                <span>{genre.label}</span>
              </Link>
            </m.div>
          );
        })}
      </div>
    </m.section>
  );
}

function ComingSoonSection() {
  const featuredGame = getGameBySlug("dashline") ?? fallbackGame;

  return (
    <m.section
      className="store-section coming-soon-section"
      aria-labelledby="coming-soon-title"
      variants={storefrontSectionVariants}
    >
      <h2 id="coming-soon-title">Coming Soon</h2>
      <Link
        className="coming-soon-card"
        href={`/games/${featuredGame.slug}` as Route}
        aria-label={`Get ${featuredGame.title} from Coming Soon`}
      >
        <Image
          src="/art/discover-racing.png"
          alt={`${featuredGame.title} coming soon artwork`}
          fill
          sizes="100vw"
          className="coming-soon-image"
        />
        <span className="coming-soon-fade" aria-hidden="true" />
        <span className="coming-soon-brand">Dylan Games</span>
        <span className="coming-soon-action">
          <span className="store-get-button">Get</span>
          <small>Expected Summer 2026</small>
        </span>
      </Link>
    </m.section>
  );
}

function ArcadeAppIcon({ game, small = false }: { game: GameDefinition; small?: boolean }) {
  return (
    <span
      className={`store-app-icon ${small ? "small" : ""} ${game.preview} accent-${game.accent}`}
      aria-hidden="true"
    >
      <PreviewArt kind={game.preview} />
    </span>
  );
}

function CollectionView({
  activeGenre,
  searchQuery,
  view,
}: {
  activeGenre?: ReturnType<typeof getGenreBySlug>;
  searchQuery: string;
  view: Exclude<GameHubView, "games">;
}) {
  const meta = getCollectionMeta(view, activeGenre);
  const shelfGames = getCollectionGames(view, activeGenre);
  const search = searchQuery.trim().toLowerCase();
  const visibleGames = shelfGames.filter((game) =>
    search ? `${game.title} ${game.genre} ${game.summary}`.toLowerCase().includes(search) : true,
  );
  const previewArt = getCollectionArt(view, activeGenre, visibleGames[0] ?? shelfGames[0]);

  return (
    <div className="collection-page">
      <header className="collection-hero">
        <div className="collection-copy">
          <h1>{meta.title}</h1>
          <p>{meta.description}</p>
          <div className="collection-actions">
            <Link className="collection-primary-action" href={meta.href as Route}>
              {meta.action}
              <ArrowUpRight aria-hidden="true" />
            </Link>
            <span>{visibleGames.length} games shown</span>
          </div>
        </div>
        <div className={`collection-art accent-${previewArt.accent}`} aria-hidden="true">
          <PreviewArt kind={previewArt.preview} />
          <span>{meta.artLabel}</span>
        </div>
      </header>

      <section className="template-panel-grid" aria-label={`${meta.title} highlights`}>
        {meta.panels.map((panel) => (
          <article key={panel.title} className="template-panel">
            <p>{panel.label}</p>
            <h2>{panel.title}</h2>
            <span>{panel.body}</span>
          </article>
        ))}
      </section>

      <section className="game-shelf template-shelf" aria-labelledby="template-shelf-title">
        <div className="shelf-heading">
          <div>
            <p>{meta.shelfLabel}</p>
            <h2 id="template-shelf-title">{searchQuery ? "Search results" : meta.shelfTitle}</h2>
          </div>
          <span>{visibleGames.length} shown</span>
        </div>

        {visibleGames.length ? (
          <div className="template-game-grid" role="list">
            {visibleGames.map((game) => (
              <CollectionGameCard key={game.slug} game={game} />
            ))}
          </div>
        ) : (
          <EmptyGenreState genre={meta.title} />
        )}
      </section>

      {view === "discover" ? <DiscoverParallaxContent /> : null}
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

function CollectionGameCard({ game }: { game: GameDefinition }) {
  return (
    <Link className="template-game-card" href={`/games/${game.slug}` as Route} role="listitem">
      <span className={`game-preview ${game.preview} accent-${game.accent}`} aria-hidden="true">
        <PreviewArt kind={game.preview} />
      </span>
      <span className="template-game-copy">
        <strong>{game.title}</strong>
        <small>{game.summary}</small>
        <span className={`mini-status ${game.status}`}>
          {game.status === "playable" ? (
            <Gamepad2 aria-hidden="true" />
          ) : (
            <Lock aria-hidden="true" />
          )}
          {game.status === "playable" ? "Playable" : "Soon"}
        </span>
      </span>
    </Link>
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

function getCollectionMeta(
  view: Exclude<GameHubView, "games">,
  activeGenre?: ReturnType<typeof getGenreBySlug>,
) {
  if (view === "favorites") {
    return {
      title: "Favorites",
      description:
        "A saved-games shelf for quick returns, starter picks, and the games most ready to revisit.",
      href: "/games/snake",
      action: "Play Snake",
      artLabel: "Favorite picks",
      shelfLabel: "Saved shelf",
      shelfTitle: "Favorite-ready games",
      panels: [
        {
          label: "Start",
          title: "Snake is first in line.",
          body: "The playable starter stays one click away while the rest of the shelf fills in.",
        },
        {
          label: "Next",
          title: "Polished placeholders stay visible.",
          body: "Upcoming games keep their finished preview states so the page feels intentional now.",
        },
        {
          label: "Return",
          title: "Built for fast revisits.",
          body: "The route lives under Games and matches the same hub rhythm as the launcher.",
        },
      ],
    };
  }

  if (view === "genre" && activeGenre) {
    const copy = genrePageCopy[activeGenre.slug];

    return {
      title: activeGenre.label,
      description:
        copy?.description ??
        `${activeGenre.label} games on Dylan Games, with routes ready for future playable builds.`,
      href: `/genres/${activeGenre.slug}`,
      action: `Browse ${activeGenre.label}`,
      artLabel: `${activeGenre.label} shelf`,
      shelfLabel: "Genre shelf",
      shelfTitle: `${activeGenre.label} games`,
      panels: [
        {
          label: "Focus",
          title: copy?.focus ?? `${activeGenre.label} route`,
          body:
            copy?.rhythm ??
            "This page uses the shared discovery template so the genre route is complete.",
        },
        {
          label: "Library",
          title: "Registry-backed layout.",
          body: "Game cards come from the central registry, keeping metadata and routes aligned.",
        },
        {
          label: "Ready",
          title: "Playable states can drop in later.",
          body: "Empty shelves still communicate structure without inventing unavailable games.",
        },
      ],
    };
  }

  return {
    title: "Discover",
    description:
      "A focused look at the games, genres, and release-ready structure behind Dylan Games.",
    href: "/games/favorites",
    action: "View Favorites",
    artLabel: "Discover shelf",
    shelfLabel: "Library",
    shelfTitle: "Games to explore",
    panels: [
      {
        label: "Hub",
        title: "Small games, clean routes.",
        body: "The site keeps game metadata, genre pages, and launch states connected.",
      },
      {
        label: "Genres",
        title: "Every sidebar page has a surface.",
        body: "Discovery pages share one template so empty shelves still feel built.",
      },
      {
        label: "Soft launch",
        title: "No noisy public push.",
        body: "The hub stays quiet while playable games and finished previews grow over time.",
      },
    ],
  };
}

function getCollectionGames(
  view: Exclude<GameHubView, "games">,
  activeGenre?: ReturnType<typeof getGenreBySlug>,
): GameDefinition[] {
  if (view === "favorites") {
    return favoriteGameSlugs.reduce<GameDefinition[]>((collection, slug) => {
      const game = getGameBySlug(slug);

      if (game) {
        collection.push(game);
      }

      return collection;
    }, []);
  }

  if (view === "genre" && activeGenre) {
    return allGames.filter((game) => game.genre === activeGenre.label);
  }

  return allGames;
}

function getCollectionArt(
  view: Exclude<GameHubView, "games">,
  activeGenre: ReturnType<typeof getGenreBySlug> | undefined,
  preferredGame: GameDefinition | undefined,
) {
  if (preferredGame) {
    return {
      accent: preferredGame.accent,
      preview: preferredGame.preview,
    };
  }

  if (view === "genre" && activeGenre) {
    return genrePreviewArt[activeGenre.slug] ?? { accent: "violet", preview: "tiles" };
  }

  return {
    accent: fallbackGame.accent,
    preview: fallbackGame.preview,
  };
}

function getGamesBySlugs(slugs: readonly string[]) {
  return slugs.reduce<GameDefinition[]>((collection, slug) => {
    const game = getGameBySlug(slug);

    if (game) {
      collection.push(game);
    }

    return collection;
  }, []);
}

function filterStorefrontGames(storefrontGames: GameDefinition[], searchQuery: string) {
  const search = searchQuery.trim().toLowerCase();

  if (!search) {
    return storefrontGames;
  }

  return storefrontGames.filter((game) =>
    `${game.title} ${game.genre} ${game.summary}`.toLowerCase().includes(search),
  );
}
