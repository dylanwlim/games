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
import { type MouseEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";

type GameHubView = "games" | "discover" | "favorites" | "genre";

type GameHubProps = {
  initialSlug?: string;
  initialGenre?: GenreSlug;
  focusGame?: boolean;
  view?: GameHubView;
};

const gameComponents = {
  snake: SnakeGame,
} as const;

const allGames: GameDefinition[] = games;
const fallbackGame = allGames[0] as GameDefinition;
const sidebarGenres = ["action", "adventure", "puzzle", "racing", "simulation", "strategy"];
const favoriteGameSlugs = ["snake", "minesweeper", "orbit"] as const;

const genrePreviewArt: Partial<
  Record<GenreSlug, { accent: GameDefinition["accent"]; preview: GameDefinition["preview"] }>
> = {
  action: { accent: "green", preview: "snake" },
  adventure: { accent: "teal", preview: "orbit" },
  casual: { accent: "blue", preview: "sky-courier" },
  family: { accent: "green", preview: "stack" },
  puzzle: { accent: "blue", preview: "minesweeper" },
  racing: { accent: "slate", preview: "dashline" },
  simulation: { accent: "teal", preview: "garden" },
  sports: { accent: "slate", preview: "pong" },
  strategy: { accent: "amber", preview: "route" },
  word: { accent: "violet", preview: "word" },
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

const featuredSpotlight = {
  label: "Featured",
  title: "Snake",
  summary: "Eat the next dot, grow the chain, and restart instantly when the route gets tight.",
  image: "/art/feature-snake.svg",
  gameSlug: "snake",
  meta: ["Classic", "1 min rounds", "Playable"],
} as const;

const motionEase = [0.22, 1, 0.36, 1] as const;
const routeExitDelayMs = 150;

const pageMotionVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 16,
    scale: 0.992,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.34,
      ease: motionEase,
      when: "beforeChildren",
      staggerChildren: 0.045,
      delayChildren: 0.03,
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    scale: 0.996,
    transition: {
      duration: 0.16,
      ease: [0.4, 0, 1, 1],
      when: "afterChildren",
      staggerChildren: 0.018,
      staggerDirection: -1,
    },
  },
};

const pageCascadeVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.045,
      delayChildren: 0.02,
    },
  },
  exit: {
    transition: {
      staggerChildren: 0.018,
      staggerDirection: -1,
    },
  },
};

const pageItemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: motionEase },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: { duration: 0.14, ease: "easeIn" },
  },
};

const sidebarPanelVariants: Variants = {
  collapsed: {
    width: 64,
    transition: {
      type: "spring",
      stiffness: 430,
      damping: 42,
      mass: 0.8,
    },
  },
  expanded: {
    width: 276,
    transition: {
      type: "spring",
      stiffness: 390,
      damping: 40,
      mass: 0.86,
      when: "beforeChildren",
      staggerChildren: 0.032,
      delayChildren: 0.04,
    },
  },
};

const sidebarItemVariants: Variants = {
  hidden: { opacity: 0, x: -10 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.24, ease: motionEase },
  },
  exit: {
    opacity: 0,
    x: -8,
    transition: { duration: 0.12, ease: "easeIn" },
  },
};

const gamePanelVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.24,
      ease: motionEase,
      when: "beforeChildren",
      staggerChildren: 0.045,
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: { duration: 0.16, ease: "easeIn" },
  },
};

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
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarPinned, setSidebarPinned] = useState(false);
  const [sidebarHovered, setSidebarHovered] = useState(false);
  const [suppressSidebarHover, setSuppressSidebarHover] = useState(false);
  const [pageExiting, setPageExiting] = useState(false);
  const [mainScrolled, setMainScrolled] = useState(false);
  const mainRef = useRef<HTMLElement | null>(null);
  const navigationTimeoutRef = useRef<number | null>(null);
  const selectedGame = useMemo(() => getGameBySlug(selectedSlug) ?? fallbackGame, [selectedSlug]);
  const selectedGenre = initialGenre ? getGenreBySlug(initialGenre) : undefined;
  const isGames = view === "games";
  const sidebarExpanded = sidebarPinned || sidebarHovered;
  const contentKey = `${view}:${initialGenre ?? "all"}:${focusGame ? "game" : "store"}`;

  useEffect(() => {
    return () => {
      if (navigationTimeoutRef.current) {
        window.clearTimeout(navigationTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const main = mainRef.current;

    if (!main) {
      return;
    }

    let frame = 0;
    const updateScrolled = () => {
      frame = 0;
      const nextScrolled = main.scrollTop > 4;
      setMainScrolled((current) => (current === nextScrolled ? current : nextScrolled));
    };
    const onScroll = () => {
      if (frame) {
        return;
      }

      frame = window.requestAnimationFrame(updateScrolled);
    };

    updateScrolled();
    main.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      if (frame) {
        window.cancelAnimationFrame(frame);
      }

      main.removeEventListener("scroll", onScroll);
    };
  }, [contentKey]);

  const collapseSidebar = useCallback(() => {
    setSidebarPinned(false);
    setSidebarHovered(false);
    setSuppressSidebarHover(false);
  }, []);

  const closeSidebar = useCallback(() => {
    setSidebarPinned(false);
    setSidebarHovered(false);
    setSuppressSidebarHover(true);
  }, []);

  const pinSidebar = useCallback(() => {
    setSidebarPinned(true);
    setSidebarHovered(true);
    setSuppressSidebarHover(false);
  }, []);

  const navigateWithMotion = useCallback(
    (href: string) => {
      if (!href.startsWith("/")) {
        return;
      }

      const currentHref = `${window.location.pathname}${window.location.search}${window.location.hash}`;

      if (href === currentHref) {
        collapseSidebar();
        return;
      }

      if (navigationTimeoutRef.current) {
        window.clearTimeout(navigationTimeoutRef.current);
      }

      collapseSidebar();

      if (shouldReduceMotion) {
        router.push(href as Route);
        return;
      }

      setPageExiting(true);
      navigationTimeoutRef.current = window.setTimeout(() => {
        router.push(href as Route);
      }, routeExitDelayMs);
    },
    [collapseSidebar, router, shouldReduceMotion],
  );

  const handleMainLinkClick = useCallback(
    (event: MouseEvent<HTMLElement>) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.altKey ||
        event.ctrlKey ||
        event.shiftKey ||
        !(event.target instanceof Element)
      ) {
        return;
      }

      const anchor = event.target.closest("a");

      if (!anchor || anchor.target || anchor.hasAttribute("download")) {
        return;
      }

      const href = anchor.getAttribute("href");

      if (!href || href.startsWith("#")) {
        return;
      }

      const url = new URL(anchor.href);

      if (url.origin !== window.location.origin) {
        return;
      }

      event.preventDefault();
      navigateWithMotion(`${url.pathname}${url.search}${url.hash}`);
    },
    [navigateWithMotion],
  );

  const selectGame = (game: GameDefinition) => {
    setSelectedSlug(game.slug);
    router.push(`/games/${game.slug}` as Route, { scroll: false });
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
          expanded={sidebarExpanded}
          pinned={sidebarPinned}
          searchQuery={searchQuery}
          onNavigate={navigateWithMotion}
          onSearchChange={setSearchQuery}
          onOpen={pinSidebar}
          onClose={closeSidebar}
          onHoverStart={() => {
            if (!suppressSidebarHover) {
              setSidebarHovered(true);
            }
          }}
          onHoverEnd={() => {
            setSidebarHovered(false);
            setSuppressSidebarHover(false);
          }}
        />
        <m.div
          className="arcade-scroll-blur"
          aria-hidden="true"
          initial={false}
          animate={{ opacity: mainScrolled ? 1 : 0 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
        />
        <m.main
          id="main-content"
          className="arcade-main"
          ref={mainRef}
          onClickCapture={handleMainLinkClick}
        >
          <AnimatePresence mode="wait" initial={false}>
            <m.div
              key={contentKey}
              className="page-motion-shell"
              variants={pageMotionVariants}
              initial={shouldReduceMotion ? false : "hidden"}
              animate={pageExiting && !shouldReduceMotion ? "exit" : "visible"}
              exit={shouldReduceMotion ? undefined : "exit"}
            >
              {isGames ? (
                <GamesView
                  activeGenre={selectedGenre}
                  focusGame={focusGame}
                  searchQuery={searchQuery}
                  selectedGame={selectedGame}
                  shouldReduceMotion={Boolean(shouldReduceMotion)}
                  onGameSelect={selectGame}
                />
              ) : (
                <CollectionView activeGenre={selectedGenre} searchQuery={searchQuery} view={view} />
              )}
            </m.div>
          </AnimatePresence>
        </m.main>
      </div>
    </LazyMotion>
  );
}

function Sidebar({
  activeView,
  activeGenre,
  expanded,
  pinned,
  searchQuery,
  onNavigate,
  onSearchChange,
  onOpen,
  onClose,
  onHoverStart,
  onHoverEnd,
}: {
  activeView: GameHubView;
  activeGenre?: GenreSlug;
  expanded: boolean;
  pinned: boolean;
  searchQuery: string;
  onNavigate: (href: string) => void;
  onSearchChange: (value: string) => void;
  onOpen: () => void;
  onClose: () => void;
  onHoverStart: () => void;
  onHoverEnd: () => void;
}) {
  const sidebarState = expanded ? "expanded" : "collapsed";

  return (
    <m.aside
      id="arcade-sidebar"
      className={`arcade-sidebar ${sidebarState}`}
      aria-label="Dylan Games navigation"
      variants={sidebarPanelVariants}
      initial={false}
      animate={sidebarState}
      data-pinned={pinned ? "true" : "false"}
      onMouseEnter={onHoverStart}
      onMouseLeave={onHoverEnd}
      onPointerEnter={onHoverStart}
      onPointerLeave={onHoverEnd}
      onFocusCapture={onHoverStart}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          onHoverEnd();
        }
      }}
    >
      <m.div className="sidebar-topbar" variants={sidebarItemVariants}>
        <button
          className="sidebar-toggle"
          type="button"
          onClick={onOpen}
          aria-controls="arcade-sidebar"
          aria-expanded={expanded}
          aria-label="Open navigation"
        >
          <Menu aria-hidden="true" />
        </button>
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
        <button
          className="sidebar-close"
          type="button"
          onClick={onClose}
          aria-label="Close navigation"
        >
          <X aria-hidden="true" />
        </button>
      </m.div>

      <m.nav className="sidebar-nav" aria-label="Sections" variants={pageCascadeVariants}>
        <SidebarLink
          href="/"
          icon={Grid2X2}
          label="Games"
          active={activeView === "games" && !activeGenre}
          onNavigate={onNavigate}
        />
        <SidebarLink
          href={"/games/favorites" as Route}
          icon={Heart}
          label="Favorites"
          active={activeView === "favorites"}
          onNavigate={onNavigate}
        />
        <SidebarLink
          href={"/discover" as Route}
          icon={Star}
          label="Discover"
          active={activeView === "discover"}
          onNavigate={onNavigate}
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
              onNavigate={onNavigate}
            />
          ))}
      </m.nav>

      <m.a
        className="sidebar-profile"
        href="https://dylanwlim.com"
        rel="noreferrer"
        variants={sidebarItemVariants}
      >
        <span>dylanwlim.com</span>
      </m.a>
    </m.aside>
  );
}

function SidebarLink({
  href,
  icon: Icon,
  label,
  active,
  onNavigate,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  active: boolean;
  onNavigate: (href: string) => void;
}) {
  return (
    <m.div variants={sidebarItemVariants}>
      <Link
        className={`sidebar-link ${active ? "active" : ""}`}
        href={href as Route}
        aria-current={active ? "page" : undefined}
        onClick={(event) => {
          if (
            event.defaultPrevented ||
            event.button !== 0 ||
            event.metaKey ||
            event.altKey ||
            event.ctrlKey ||
            event.shiftKey
          ) {
            return;
          }

          event.preventDefault();
          onNavigate(href);
        }}
      >
        <Icon aria-hidden="true" />
        <span>{label}</span>
      </Link>
    </m.div>
  );
}

function GamesView({
  activeGenre,
  focusGame,
  searchQuery,
  selectedGame,
  shouldReduceMotion,
  onGameSelect,
}: {
  activeGenre?: ReturnType<typeof getGenreBySlug>;
  focusGame: boolean;
  searchQuery: string;
  selectedGame: GameDefinition;
  shouldReduceMotion: boolean;
  onGameSelect: (game: GameDefinition) => void;
}) {
  const [activeFilter, setActiveFilter] = useState<GenreSlug | undefined>(activeGenre?.slug);
  const visibleGames = games.filter((game) => {
    const matchesGenre = activeGenre ? game.genre === activeGenre.label : true;
    const search = searchQuery.trim().toLowerCase();
    const matchesSearch = search
      ? `${game.title} ${game.genre} ${game.summary}`.toLowerCase().includes(search)
      : true;
    return matchesGenre && matchesSearch;
  });

  return (
    <m.div className="games-page" variants={pageCascadeVariants}>
      <m.header className="arcade-title" variants={pageItemVariants}>
        <h1>Games</h1>
      </m.header>

      {focusGame ? (
        <>
          <m.section
            className="game-shelf"
            aria-labelledby="game-shelf-title"
            variants={pageItemVariants}
          >
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
          </m.section>

          <GameLauncher
            selectedGame={selectedGame}
            shouldReduceMotion={shouldReduceMotion}
            onPlaySnake={() => onGameSelect(games[0])}
          />
        </>
      ) : (
        <m.div variants={pageItemVariants}>
          <FeatureHero shouldReduceMotion={shouldReduceMotion} />
          <ArcadeStorefront
            activeGenre={activeFilter}
            searchQuery={searchQuery}
            shouldReduceMotion={shouldReduceMotion}
            onGenreChange={setActiveFilter}
          />
        </m.div>
      )}
    </m.div>
  );
}

function FeatureHero({ shouldReduceMotion }: { shouldReduceMotion: boolean }) {
  const game = getGameBySlug(featuredSpotlight.gameSlug) ?? fallbackGame;

  return (
    <m.section className="feature-spotlight" aria-label="Featured game" variants={pageItemVariants}>
      <m.div
        className="feature-card"
        initial={shouldReduceMotion ? false : { opacity: 0.92, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: "easeOut" }}
      >
        <Image
          src={featuredSpotlight.image}
          alt="Snake gameplay artwork"
          fill
          preload
          loading="eager"
          sizes="(max-width: 900px) 100vw, calc(100vw - 96px)"
          className="feature-image"
        />
        <div className="feature-scrim" aria-hidden="true" />
        <div className="feature-copy">
          <p>{featuredSpotlight.label}</p>
          <h2>{featuredSpotlight.title}</h2>
          <span>{featuredSpotlight.summary}</span>
          <div className="feature-actions">
            <Link
              className="primary-play-button"
              href={`/games/${featuredSpotlight.gameSlug}` as Route}
              aria-label="Play Snake from Featured"
            >
              <Play aria-hidden="true" />
              Play
            </Link>
            <div className="feature-meta" aria-label="Snake details">
              {featuredSpotlight.meta.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          </div>
        </div>
        <Link
          className="feature-app-card"
          href={`/games/${game.slug}` as Route}
          aria-label="Open Snake details"
        >
          <ArcadeAppIcon game={game} small />
          <span className="feature-app-copy">
            <strong>{game.title}</strong>
            <small>{game.summary}</small>
          </span>
        </Link>
      </m.div>
    </m.section>
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
  activeGenre,
  searchQuery,
  shouldReduceMotion,
  onGenreChange,
}: {
  activeGenre?: GenreSlug;
  searchQuery: string;
  shouldReduceMotion: boolean;
  onGenreChange: (genre: GenreSlug | undefined) => void;
}) {
  const liveGames = filterStorefrontGames(
    games.filter((game) => game.status === "playable"),
    searchQuery,
    activeGenre,
  );
  const plannedGames = filterStorefrontGames(
    games.filter((game) => game.status === "coming-soon"),
    searchQuery,
    activeGenre,
  );
  const visibleCount = liveGames.length + plannedGames.length;
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
        <GenrePills activeGenre={activeGenre} resultCount={0} onGenreChange={onGenreChange} />
        <EmptyGenreState genre="Search" />
      </m.div>
    );
  }

  return (
    <m.div className="arcade-storefront" {...motionProps}>
      <ContinuePlayingSection />
      <GenrePills
        activeGenre={activeGenre}
        resultCount={visibleCount}
        onGenreChange={onGenreChange}
      />
      <AllGamesSection activeGenre={activeGenre} games={liveGames} searchQuery={searchQuery} />
      <ComingSoonSection games={plannedGames} />
    </m.div>
  );
}

function AllGamesSection({
  activeGenre,
  games: sectionGames,
  searchQuery,
}: {
  activeGenre?: GenreSlug;
  games: GameDefinition[];
  searchQuery: string;
}) {
  const activeLabel = activeGenre ? getGenreBySlug(activeGenre)?.label : undefined;
  const titleId = "all-games-title";

  return (
    <m.section
      className="store-section all-games-section"
      aria-labelledby={titleId}
      variants={storefrontSectionVariants}
    >
      <div className="store-section-header">
        <div>
          <h2 id={titleId}>All Games</h2>
          <p>
            {activeLabel
              ? `${activeLabel} games that are playable in the browser right now.`
              : "Playable games ready for a quick browser session."}
          </p>
        </div>
        <span>{sectionGames.length} playable</span>
      </div>
      {sectionGames.length ? (
        <div className="store-card-grid live" role="list">
          {sectionGames.map((game) => (
            <m.div key={game.slug} role="listitem" variants={storefrontItemVariants}>
              <StoreGameCard game={game} source="All Games" />
            </m.div>
          ))}
        </div>
      ) : (
        <div className="compact-empty-state">
          <strong>No live games match yet.</strong>
          <span>
            {searchQuery.trim()
              ? "Clear search or choose another category."
              : "Playable releases stay separate from upcoming previews below."}
          </span>
        </div>
      )}
    </m.section>
  );
}

function ContinuePlayingSection() {
  const snake = getGameBySlug("snake") ?? fallbackGame;

  return (
    <m.section
      className="store-section continue-section"
      aria-labelledby="continue-playing-title"
      variants={storefrontSectionVariants}
    >
      <div className="store-section-header compact">
        <div>
          <h2 id="continue-playing-title">Continue Playing</h2>
          <p>Jump back into the one game that is live today.</p>
        </div>
      </div>
      <div className="continue-rail">
        <ContinueCard
          game={snake}
          image="/art/feature-snake.svg"
          summary="Best score saves locally. Restart in one click."
        />
      </div>
    </m.section>
  );
}

function ContinueCard({
  game,
  image,
  summary,
}: {
  game: GameDefinition;
  image: string;
  summary: string;
}) {
  return (
    <m.div variants={storefrontItemVariants}>
      <Link
        className="continue-card"
        href={`/games/${game.slug}` as Route}
        aria-label={`Resume ${game.title} from Continue Playing`}
      >
        <Image
          src={image}
          alt={`${game.title} continue playing artwork`}
          fill
          loading="eager"
          sizes="(max-width: 900px) 100vw, 48vw"
          className="continue-image"
        />
        <span className="continue-overlay" aria-hidden="true" />
        <span className="continue-footer">
          <ArcadeAppIcon game={game} small />
          <span>
            <strong>{game.title}</strong>
            <em>{summary}</em>
          </span>
          <span className="store-get-button">Resume</span>
        </span>
      </Link>
    </m.div>
  );
}

function StoreGameCard({ game, source }: { game: GameDefinition; source: string }) {
  const isPlayable = game.status === "playable";
  const action = isPlayable ? "Play" : "Preview";

  return (
    <Link
      className={`store-game-card ${game.status}`}
      href={`/games/${game.slug}` as Route}
      aria-label={`${action} ${game.title} from ${source}`}
    >
      <ArcadeAppIcon game={game} />
      <span className="store-game-copy">
        <span className="store-game-title-row">
          <strong>{game.title}</strong>
          <span className={`mini-status ${game.status}`}>
            {isPlayable ? <Gamepad2 aria-hidden="true" /> : <Lock aria-hidden="true" />}
            {isPlayable ? "Playable" : "Coming soon"}
          </span>
        </span>
        <span>{game.summary}</span>
        <span className="store-game-meta">
          <small>{game.genre}</small>
          <small>{isPlayable ? "1 min rounds" : "Preview route"}</small>
        </span>
      </span>
      <span className={`store-get-button ${isPlayable ? "" : "secondary"}`}>{action}</span>
    </Link>
  );
}

function ComingSoonSection({ games: plannedGames }: { games: GameDefinition[] }) {
  if (!plannedGames.length) {
    return null;
  }

  const featuredGame =
    plannedGames.find((game) => game.slug === "dashline") ?? plannedGames[0] ?? fallbackGame;
  const supportingGames = plannedGames
    .filter((game) => game.slug !== featuredGame.slug)
    .slice(0, 4);

  return (
    <m.section
      className="store-section coming-soon-section"
      aria-labelledby="coming-soon-title"
      variants={storefrontSectionVariants}
    >
      <div className="store-section-header">
        <div>
          <h2 id="coming-soon-title">Coming Soon</h2>
          <p>Unreleased concepts are grouped here so playable games stay clear.</p>
        </div>
      </div>
      <div className="coming-soon-layout">
        <Link
          className="coming-soon-card"
          href={`/games/${featuredGame.slug}` as Route}
          aria-label={`Preview ${featuredGame.title} from Coming Soon`}
        >
          <span className="coming-soon-media">
            <Image
              src="/art/discover-racing.png"
              alt={`${featuredGame.title} preview artwork`}
              fill
              sizes="(max-width: 900px) 100vw, 46vw"
              className="coming-soon-image"
            />
          </span>
          <span className="coming-soon-copy">
            <small>Expected Summer 2026</small>
            <strong>{featuredGame.title}</strong>
            <span>{featuredGame.description}</span>
            <span className="coming-soon-meta">
              <span>{featuredGame.genre}</span>
              <span>Preview route ready</span>
            </span>
            <span className="store-get-button secondary">Preview</span>
          </span>
        </Link>
        {supportingGames.length ? (
          <div className="store-card-grid planned" role="list">
            {supportingGames.map((game) => (
              <m.div key={game.slug} role="listitem" variants={storefrontItemVariants}>
                <StoreGameCard game={game} source="Coming Soon" />
              </m.div>
            ))}
          </div>
        ) : null}
      </div>
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
    <m.div className="collection-page" variants={pageCascadeVariants}>
      <m.header className="collection-hero" variants={pageItemVariants}>
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
      </m.header>

      <m.section
        className="template-panel-grid"
        aria-label={`${meta.title} highlights`}
        variants={pageItemVariants}
      >
        {meta.panels.map((panel) => (
          <article key={panel.title} className="template-panel">
            <p>{panel.label}</p>
            <h2>{panel.title}</h2>
            <span>{panel.body}</span>
          </article>
        ))}
      </m.section>

      <m.section
        className="game-shelf template-shelf"
        aria-labelledby="template-shelf-title"
        variants={pageItemVariants}
      >
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
      </m.section>

      {view === "discover" ? (
        <m.div variants={pageItemVariants}>
          <DiscoverParallaxContent />
        </m.div>
      ) : null}
    </m.div>
  );
}

function GenrePills({
  activeGenre,
  resultCount,
  onGenreChange,
}: {
  activeGenre?: GenreSlug;
  resultCount: number;
  onGenreChange: (genre: GenreSlug | undefined) => void;
}) {
  const allCount = games.length;

  return (
    <nav className="genre-pills" aria-label="Game genres">
      <button
        className={`genre-pill ${!activeGenre ? "active" : ""}`}
        type="button"
        onClick={() => onGenreChange(undefined)}
        aria-pressed={!activeGenre}
      >
        <Grid2X2 aria-hidden="true" />
        <span>All Games</span>
        <small>{allCount}</small>
      </button>
      {gameGenres.map((genre) => {
        const Icon = iconMap[genre.icon];
        const genreCount = games.filter((game) => game.genre === genre.label).length;

        return (
          <button
            key={genre.slug}
            className={`genre-pill ${activeGenre === genre.slug ? "active" : ""}`}
            type="button"
            onClick={() => onGenreChange(genre.slug)}
            aria-pressed={activeGenre === genre.slug}
          >
            <Icon aria-hidden="true" />
            <span>{genre.label}</span>
            <small>{genreCount}</small>
          </button>
        );
      })}
      <span className="genre-result-count" aria-live="polite">
        {resultCount} {resultCount === 1 ? "result" : "results"}
      </span>
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
    <m.div
      className={`shelf-card ${selected ? "selected" : ""}`}
      role="listitem"
      variants={pageItemVariants}
    >
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
    </m.div>
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
  shouldReduceMotion,
  onPlaySnake,
}: {
  selectedGame: GameDefinition;
  shouldReduceMotion: boolean;
  onPlaySnake: () => void;
}) {
  const GameComponent = gameComponents[selectedGame.slug as keyof typeof gameComponents];

  return (
    <m.section
      id="launcher"
      className="launcher-panel"
      aria-labelledby="launcher-title"
      variants={pageItemVariants}
    >
      <m.div className="launcher-header">
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
      </m.div>

      <AnimatePresence mode="wait">
        <m.div
          key={selectedGame.slug}
          className="launcher-motion-surface"
          variants={gamePanelVariants}
          initial={shouldReduceMotion ? false : "hidden"}
          animate="visible"
          exit={shouldReduceMotion ? undefined : "exit"}
        >
          {GameComponent ? (
            <GameComponent />
          ) : (
            <UnavailableGame game={selectedGame} onPlaySnake={onPlaySnake} />
          )}
        </m.div>
      </AnimatePresence>
    </m.section>
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

  if (kind === "dashline") {
    return (
      <>
        <i className="road-line main" />
        <i className="road-line side" />
        <i className="race-car" />
      </>
    );
  }

  if (kind === "sky-courier") {
    return (
      <>
        <i className="sky-cloud a" />
        <i className="sky-cloud b" />
        <i className="sky-plane" />
        <i className="sky-route" />
      </>
    );
  }

  if (kind === "word") {
    return (
      <span className="word-rack">
        {["W", "O", "R", "D"].map((letter) => (
          <i key={letter}>{letter}</i>
        ))}
      </span>
    );
  }

  if (kind === "stack") {
    return (
      <span className="stack-blocks">
        {Array.from({ length: 5 }, (_, index) => (
          <i key={index} />
        ))}
      </span>
    );
  }

  if (kind === "garden") {
    return (
      <>
        <i className="garden-bed" />
        <i className="garden-stem" />
        <i className="garden-leaf left" />
        <i className="garden-leaf right" />
      </>
    );
  }

  if (kind === "route") {
    return (
      <>
        <i className="route-line a" />
        <i className="route-line b" />
        <i className="route-node start" />
        <i className="route-node mid" />
        <i className="route-node end" />
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

function filterStorefrontGames(
  storefrontGames: GameDefinition[],
  searchQuery: string,
  activeGenre?: GenreSlug,
) {
  const search = searchQuery.trim().toLowerCase();
  const activeGenreLabel = activeGenre ? getGenreBySlug(activeGenre)?.label : undefined;

  return storefrontGames.filter(
    (game) =>
      (activeGenreLabel ? game.genre === activeGenreLabel : true) &&
      (search
        ? `${game.title} ${game.genre} ${game.summary}`.toLowerCase().includes(search)
        : true),
  );
}
