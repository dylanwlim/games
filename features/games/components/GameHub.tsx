"use client";

import { DiscoverParallaxContent } from "@/components/ui/text-parallax-content-scroll";
import {
  Sidebar as SidebarShell,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { CipherwordGame } from "@/features/games/cipherword/CipherwordGame";
import { DailyCipherwordCTA } from "@/features/games/cipherword/DailyCipherwordCTA";
import { filterGamesBySearch, getSearchGenre } from "@/features/games/game-search";
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
  ChevronLeft,
  ChevronRight,
  Crosshair,
  Flag,
  Gamepad2,
  Grid2X2,
  Heart,
  Lock,
  Map,
  PanelLeft,
  Play,
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
import {
  AnimatePresence,
  LazyMotion,
  domAnimation,
  m,
  useReducedMotion,
  type Variants,
} from "motion/react";
import {
  type FocusEvent,
  type KeyboardEvent,
  type MouseEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type GameHubView = "games" | "discover" | "favorites" | "genre";

type GameHubProps = {
  initialSlug?: string;
  initialGenre?: GenreSlug;
  focusGame?: boolean;
  view?: GameHubView;
};

const gameComponents = {
  cipher: CipherwordGame,
  snake: SnakeGame,
} as const;

const allGames: GameDefinition[] = games;
const fallbackGame = allGames[0] as GameDefinition;
const favoriteGameSlugs = ["cipher", "snake", "minesweeper", "orbit"] as const;

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
  word: { accent: "violet", preview: "cipherword" },
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
  word: {
    description: "Daily word games built around clean typing, fair clues, and fast return rituals.",
    focus: "Daily meaning",
    rhythm: "Cipher leads the shelf with meaning scores, letter clues, and archive play.",
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

type FeaturedGameSlide = {
  title: string;
  description: string;
  detail: string;
  mode: string;
  tags: string[];
  image: string;
  imagePosition: string;
  route: Route;
  primaryCta: string;
  primaryAriaLabel: string;
  secondaryCta: {
    label: string;
    route: Route;
    ariaLabel: string;
  };
  accent: GameDefinition["accent"];
  preview: GameDefinition["preview"];
};

const featureAutoplayMs = 6200;

const featuredGames: FeaturedGameSlide[] = [
  {
    title: "Cipher",
    description: "Find the hidden concept using letters, meaning, and unlocked clues.",
    detail: "A daily word-logic puzzle built around meaning, clues, and deduction.",
    mode: "Today's Challenge",
    tags: ["Daily #001", "Word logic", "2-4 min"],
    image: "/art/feature-cipherword.svg",
    imagePosition: "center 54%",
    route: "/games/cipher" as Route,
    primaryCta: "Play today's puzzle",
    primaryAriaLabel: "Play Cipher from Featured",
    secondaryCta: {
      label: "View archive",
      route: "/games/cipher/archive" as Route,
      ariaLabel: "View Cipher archive from Featured",
    },
    accent: "violet",
    preview: "cipherword",
  },
  {
    title: "Snake",
    description: "Guide the snake, chain apples, and beat your best run.",
    detail: "A quick arcade run with clean turns, instant restarts, and saved best scores.",
    mode: "Arcade Run",
    tags: ["Action", "1-min rounds", "Best-score chase"],
    image: "/art/feature-snake.svg",
    imagePosition: "center 42%",
    route: "/games/snake" as Route,
    primaryCta: "Play Snake",
    primaryAriaLabel: "Play Snake from Featured",
    secondaryCta: {
      label: "Action shelf",
      route: "/genres/action" as Route,
      ariaLabel: "Open Action shelf from Featured",
    },
    accent: "green",
    preview: "snake",
  },
  {
    title: "Dashline",
    description: "A quick racing challenge built for clean routes, tight turns, and fast restarts.",
    detail: "Featured upcoming work for short races, readable routes, and quick resets.",
    mode: "Featured Upcoming",
    tags: ["Expected Summer 2026", "Racing", "Prototype"],
    image: "/art/discover-racing.png",
    imagePosition: "center 50%",
    route: "/games/dashline" as Route,
    primaryCta: "Preview Dashline",
    primaryAriaLabel: "Preview Dashline from Featured",
    secondaryCta: {
      label: "Racing shelf",
      route: "/genres/racing" as Route,
      ariaLabel: "Open Racing shelf from Featured",
    },
    accent: "slate",
    preview: "dashline",
  },
];

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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pageExiting, setPageExiting] = useState(false);
  const [mainScrolled, setMainScrolled] = useState(false);
  const mainRef = useRef<HTMLElement | null>(null);
  const navigationTimeoutRef = useRef<number | null>(null);
  const selectedGame = useMemo(() => getGameBySlug(selectedSlug) ?? fallbackGame, [selectedSlug]);
  const selectedGenre = initialGenre ? getGenreBySlug(initialGenre) : undefined;
  const isGames = view === "games";
  const contentKey = `${view}:${initialGenre ?? "all"}:${focusGame ? selectedSlug : "store"}`;
  const frameClassName = `arcade-frame ${focusGame ? "play-frame" : ""} ${
    sidebarOpen ? "sidebar-open" : ""
  }`;

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

  const navigateWithMotion = useCallback(
    (href: string) => {
      if (!href.startsWith("/")) {
        return;
      }

      const currentHref = `${window.location.pathname}${window.location.search}${window.location.hash}`;

      if (href === currentHref) {
        setSidebarOpen(false);
        return;
      }

      if (navigationTimeoutRef.current) {
        window.clearTimeout(navigationTimeoutRef.current);
      }

      setSidebarOpen(false);

      if (shouldReduceMotion) {
        router.push(href as Route);
        return;
      }

      setPageExiting(true);
      navigationTimeoutRef.current = window.setTimeout(() => {
        router.push(href as Route);
      }, routeExitDelayMs);
    },
    [router, shouldReduceMotion],
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
      <SidebarProvider
        className={frameClassName}
        defaultOpen={false}
        open={sidebarOpen}
        onOpenChange={setSidebarOpen}
      >
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        <HubSidebar
          activeView={view}
          activeGenre={initialGenre}
          hideSearch={focusGame}
          searchQuery={searchQuery}
          onNavigate={navigateWithMotion}
          onSearchChange={setSearchQuery}
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
          className={`arcade-main ${focusGame ? "play-main" : ""}`}
          ref={mainRef}
          onClickCapture={handleMainLinkClick}
        >
          <HubSidebarBar view={view} activeGenre={selectedGenre} focusGame={focusGame} />
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
                focusGame ? (
                  <GamePlayView
                    selectedGame={selectedGame}
                    sidebarOpen={sidebarOpen}
                    shouldReduceMotion={Boolean(shouldReduceMotion)}
                    onPlaySnake={() => selectGame(games[0])}
                  />
                ) : (
                  <GamesView
                    activeGenre={selectedGenre}
                    focusGame={false}
                    searchQuery={searchQuery}
                    selectedGame={selectedGame}
                    shouldReduceMotion={Boolean(shouldReduceMotion)}
                    onGameSelect={selectGame}
                  />
                )
              ) : (
                <CollectionView activeGenre={selectedGenre} searchQuery={searchQuery} view={view} />
              )}
            </m.div>
          </AnimatePresence>
        </m.main>
      </SidebarProvider>
    </LazyMotion>
  );
}

function HubSidebar({
  activeView,
  activeGenre,
  hideSearch,
  searchQuery,
  onNavigate,
  onSearchChange,
}: {
  activeView: GameHubView;
  activeGenre?: GenreSlug;
  hideSearch: boolean;
  searchQuery: string;
  onNavigate: (href: string) => void;
  onSearchChange: (value: string) => void;
}) {
  return (
    <SidebarShell
      id="arcade-sidebar"
      className="game-sidebar"
      aria-label="Dylan Games navigation"
      collapsible="icon"
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={activeView === "games" && !activeGenre}
              size="lg"
              tooltip="Dylan Games"
            >
              <Link
                href={"/" as Route}
                onClick={(event) => handleSidebarNavigation(event, "/", onNavigate)}
              >
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Gamepad2 aria-hidden="true" className="size-4" />
                </div>
                <div className="flex min-w-0 flex-col gap-0.5 leading-none">
                  <span className="truncate font-semibold">Dylan Games</span>
                  <span className="truncate text-xs text-sidebar-foreground/70">Quiet arcade</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        {!hideSearch ? (
          <form
            role="search"
            onSubmit={(event) => {
              event.preventDefault();
            }}
          >
            <SidebarGroup className="game-sidebar-search-group py-0">
              <SidebarGroupContent className="relative">
                <label htmlFor="game-sidebar-search" className="sr-only">
                  Search games
                </label>
                <SidebarInput
                  id="game-sidebar-search"
                  aria-label="Search games"
                  value={searchQuery}
                  onChange={(event) => onSearchChange(event.target.value)}
                  placeholder="Search games..."
                  className="game-sidebar-search pl-8"
                  type="search"
                />
                <Search
                  aria-hidden="true"
                  className="pointer-events-none absolute left-2 top-1/2 size-4 -translate-y-1/2 select-none opacity-50"
                />
              </SidebarGroupContent>
            </SidebarGroup>
          </form>
        ) : null}
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Library</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <HubSidebarLink
                href="/"
                icon={Grid2X2}
                label="Games"
                active={activeView === "games" && !activeGenre}
                onNavigate={onNavigate}
              />
              <HubSidebarLink
                href="/games/favorites"
                icon={Heart}
                label="Favorites"
                active={activeView === "favorites"}
                onNavigate={onNavigate}
              />
              <HubSidebarLink
                href="/discover"
                icon={Star}
                label="Discover"
                active={activeView === "discover"}
                onNavigate={onNavigate}
              />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Genres</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {gameGenres.map((genre) => (
                <HubSidebarLink
                  key={genre.slug}
                  href={`/genres/${genre.slug}`}
                  icon={iconMap[genre.icon]}
                  label={genre.label}
                  active={activeGenre === genre.slug}
                  onNavigate={onNavigate}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="dylanwlim.com">
              <a href="https://dylanwlim.com" rel="noreferrer">
                <ArrowUpRight aria-hidden="true" />
                <span>dylanwlim.com</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </SidebarShell>
  );
}

function HubSidebarLink({
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
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={active} tooltip={label}>
        <Link
          href={href as Route}
          aria-current={active ? "page" : undefined}
          aria-label={label}
          onClick={(event) => handleSidebarNavigation(event, href, onNavigate)}
        >
          <Icon aria-hidden="true" />
          <span>{label}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

function HubSidebarBar({
  view,
  activeGenre,
  focusGame,
}: {
  view: GameHubView;
  activeGenre?: ReturnType<typeof getGenreBySlug>;
  focusGame: boolean;
}) {
  const { open, openMobile, isMobile, toggleSidebar } = useSidebar();
  const navigationOpen = isMobile ? openMobile : open;
  const label = navigationOpen ? "Close navigation" : "Open navigation";
  const pageLabel = focusGame
    ? "Play"
    : (activeGenre?.label ??
      (view === "discover" ? "Discover" : view === "favorites" ? "Favorites" : "Games"));

  return (
    <header className="hub-sidebar-bar">
      <button
        className="hub-sidebar-trigger"
        type="button"
        onClick={toggleSidebar}
        aria-controls="arcade-sidebar"
        aria-expanded={navigationOpen}
        aria-label={label}
      >
        <PanelLeft aria-hidden="true" />
      </button>
      <div className="hub-sidebar-breadcrumb" aria-label="Current section">
        <span>Dylan Games</span>
        <i aria-hidden="true" />
        <strong>{pageLabel}</strong>
      </div>
    </header>
  );
}

function handleSidebarNavigation(
  event: MouseEvent<HTMLAnchorElement>,
  href: string,
  onNavigate: (href: string) => void,
) {
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
  const visibleGames = filterGamesBySearch(games, searchQuery, activeGenre?.slug);

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
          {searchQuery.trim() ? null : <FeatureHero shouldReduceMotion={shouldReduceMotion} />}
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
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [hoverPaused, setHoverPaused] = useState(false);
  const [focusPaused, setFocusPaused] = useState(false);
  const [dragPaused, setDragPaused] = useState(false);
  const [documentHidden, setDocumentHidden] = useState(false);
  const activeSlide = featuredGames[activeIndex] ?? featuredGames[0];
  const autoplayPaused =
    shouldReduceMotion || hoverPaused || focusPaused || dragPaused || documentHidden;
  const slideVariants = useMemo<Variants>(
    () => ({
      enter: (travelDirection: number) => ({
        opacity: 0,
        x: shouldReduceMotion ? 0 : travelDirection > 0 ? 24 : -24,
        scale: shouldReduceMotion ? 1 : 0.985,
      }),
      center: {
        opacity: 1,
        x: 0,
        scale: 1,
        transition: {
          duration: shouldReduceMotion ? 0 : 0.58,
          ease: motionEase,
        },
      },
      exit: (travelDirection: number) => ({
        opacity: 0,
        x: shouldReduceMotion ? 0 : travelDirection > 0 ? -24 : 24,
        scale: shouldReduceMotion ? 1 : 0.985,
        transition: {
          duration: shouldReduceMotion ? 0 : 0.24,
          ease: "easeIn",
        },
      }),
    }),
    [shouldReduceMotion],
  );

  const goToSlide = useCallback(
    (nextIndex: number, nextDirection = nextIndex > activeIndex ? 1 : -1) => {
      const total = featuredGames.length;
      const boundedIndex = ((nextIndex % total) + total) % total;

      if (boundedIndex === activeIndex) {
        return;
      }

      setDirection(nextDirection);
      setActiveIndex(boundedIndex);
    },
    [activeIndex],
  );

  const showPreviousSlide = useCallback(() => {
    goToSlide(activeIndex - 1, -1);
  }, [activeIndex, goToSlide]);

  const showNextSlide = useCallback(() => {
    goToSlide(activeIndex + 1, 1);
  }, [activeIndex, goToSlide]);

  useEffect(() => {
    const updateVisibility = () => {
      setDocumentHidden(document.visibilityState === "hidden");
    };

    updateVisibility();
    document.addEventListener("visibilitychange", updateVisibility);

    return () => {
      document.removeEventListener("visibilitychange", updateVisibility);
    };
  }, []);

  useEffect(() => {
    if (autoplayPaused) {
      return;
    }

    const timeout = window.setTimeout(showNextSlide, featureAutoplayMs);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [autoplayPaused, showNextSlide]);

  const handleCarouselKeyDown = useCallback(
    (event: KeyboardEvent<HTMLElement>) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        showPreviousSlide();
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        showNextSlide();
      }
    },
    [showNextSlide, showPreviousSlide],
  );

  const handleCarouselBlur = useCallback((event: FocusEvent<HTMLElement>) => {
    const nextTarget = event.relatedTarget;

    if (!(nextTarget instanceof Node) || !event.currentTarget.contains(nextTarget)) {
      setFocusPaused(false);
    }
  }, []);

  return (
    <m.section
      className="feature-spotlight"
      aria-label="Featured games"
      variants={pageItemVariants}
    >
      <m.div
        className={`feature-card accent-${activeSlide.accent}`}
        aria-label={`Featured games carousel, slide ${activeIndex + 1} of ${featuredGames.length}`}
        aria-roledescription="carousel"
        role="region"
        tabIndex={0}
        initial={shouldReduceMotion ? false : { opacity: 0.92, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: "easeOut" }}
        onBlurCapture={handleCarouselBlur}
        onFocusCapture={() => setFocusPaused(true)}
        onKeyDown={handleCarouselKeyDown}
        onPointerEnter={() => setHoverPaused(true)}
        onPointerLeave={() => setHoverPaused(false)}
      >
        <m.div
          className="feature-swipe-layer"
          drag={shouldReduceMotion ? false : "x"}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.18}
          onDragStart={() => setDragPaused(true)}
          onDragEnd={(_, info) => {
            setDragPaused(false);

            const swipe = info.offset.x + info.velocity.x * 0.16;

            if (swipe < -52) {
              showNextSlide();
            }

            if (swipe > 52) {
              showPreviousSlide();
            }
          }}
        >
          <AnimatePresence custom={direction} initial={false} mode="popLayout">
            <m.div
              key={activeSlide.title}
              className="feature-slide"
              aria-label={`${activeSlide.title}, ${activeIndex + 1} of ${featuredGames.length}`}
              aria-roledescription="slide"
              custom={direction}
              initial="enter"
              animate="center"
              exit="exit"
              variants={slideVariants}
            >
              <Image
                src={activeSlide.image}
                alt=""
                fill
                priority
                sizes="(max-width: 900px) 100vw, calc(100vw - 96px)"
                className={`feature-image ${activeSlide.preview}`}
                style={{ objectPosition: activeSlide.imagePosition }}
              />
              <div className="feature-scrim" aria-hidden="true" />
              <div className="feature-copy">
                <p>{activeSlide.mode}</p>
                <h2>{activeSlide.title}</h2>
                <span>{activeSlide.description}</span>
                <div className="feature-actions">
                  <Link
                    className="primary-play-button"
                    href={activeSlide.route}
                    aria-label={activeSlide.primaryAriaLabel}
                  >
                    <Play aria-hidden="true" />
                    {activeSlide.primaryCta}
                  </Link>
                  <Link
                    className="feature-secondary-button"
                    href={activeSlide.secondaryCta.route}
                    aria-label={activeSlide.secondaryCta.ariaLabel}
                  >
                    {activeSlide.secondaryCta.label}
                    <ArrowUpRight aria-hidden="true" />
                  </Link>
                </div>
                <div className="feature-meta" aria-label={`${activeSlide.title} details`}>
                  {activeSlide.tags.map((item) => (
                    <span key={item}>{item}</span>
                  ))}
                </div>
              </div>
              <div className="feature-game-preview" aria-hidden="true">
                <ArcadeAppIcon
                  game={{
                    ...fallbackGame,
                    slug: activeSlide.title.toLowerCase(),
                    title: activeSlide.title,
                    genre:
                      activeSlide.title === "Snake"
                        ? "Action"
                        : activeSlide.title === "Dashline"
                          ? "Racing"
                          : "Word",
                    status: activeSlide.title === "Dashline" ? "coming-soon" : "playable",
                    summary: activeSlide.detail,
                    description: activeSlide.detail,
                    accent: activeSlide.accent,
                    preview: activeSlide.preview,
                    priority: activeIndex,
                  }}
                  small
                />
                <span className="feature-app-copy">
                  <strong>{activeSlide.mode}</strong>
                  <small>{activeSlide.detail}</small>
                </span>
              </div>
            </m.div>
          </AnimatePresence>
        </m.div>
        <button
          className="feature-arrow previous"
          type="button"
          onClick={showPreviousSlide}
          aria-label="Show previous featured game"
        >
          <ChevronLeft aria-hidden="true" />
        </button>
        <button
          className="feature-arrow next"
          type="button"
          onClick={showNextSlide}
          aria-label="Show next featured game"
        >
          <ChevronRight aria-hidden="true" />
        </button>
        <div className="feature-carousel-controls" aria-label="Featured game slides">
          <div className="feature-dots">
            {featuredGames.map((slide, index) => (
              <button
                key={slide.title}
                className={`feature-dot accent-${slide.accent} ${index === activeIndex ? "active" : ""}`}
                type="button"
                onClick={() => goToSlide(index)}
                aria-label={`Show ${slide.title} featured slide`}
                aria-pressed={index === activeIndex}
              />
            ))}
          </div>
          <span className="feature-progress" aria-hidden="true">
            <span
              key={`${activeIndex}-${autoplayPaused ? "paused" : "running"}`}
              className={autoplayPaused ? "is-paused" : "is-running"}
            />
          </span>
        </div>
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
  const hasSearch = Boolean(searchQuery.trim());
  const searchGenre = getSearchGenre(searchQuery);
  const effectiveGenre = searchGenre ?? activeGenre;
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
        <GenrePills
          activeGenre={effectiveGenre}
          playableOnly={!hasSearch}
          resultCount={0}
          onGenreChange={onGenreChange}
        />
        <EmptyGenreState genre="Search" />
      </m.div>
    );
  }

  return (
    <m.div className="arcade-storefront" {...motionProps}>
      {!hasSearch ? <ContinuePlayingSection /> : null}
      <GenrePills
        activeGenre={effectiveGenre}
        playableOnly={!hasSearch}
        resultCount={visibleCount}
        onGenreChange={onGenreChange}
      />
      <AllGamesSection activeGenre={effectiveGenre} games={liveGames} searchQuery={searchQuery} />
      <ComingSoonSection games={plannedGames} searching={hasSearch} />
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
  const titleId = "playable-games-title";

  return (
    <m.section
      className="store-section all-games-section"
      id="playable-games"
      aria-labelledby={titleId}
      variants={storefrontSectionVariants}
    >
      <div className="store-section-header">
        <div>
          <h2 id={titleId}>{searchQuery.trim() ? "Playable results" : "Playable Games"}</h2>
          <p>
            {activeLabel
              ? `${activeLabel} games that are playable in the browser right now.`
              : "Ready for a quick browser session."}
          </p>
        </div>
        <span className="section-count-badge">Playable {sectionGames.length}</span>
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
          <p>Resume today&apos;s puzzle or jump back into your latest run.</p>
        </div>
      </div>
      <div className="continue-rail">
        <DailyCipherwordCTA variant="banner" />
        <ContinueCard
          game={snake}
          image="/art/feature-snake.svg"
          summary="Eat apples, chase streaks, and restart in one click."
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
  const [bestScore, setBestScore] = useState(0);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      try {
        const rawScores = window.localStorage.getItem("dylan-games:snake-best-scores");
        const parsed = rawScores ? (JSON.parse(rawScores) as Record<string, unknown>) : {};
        const scores = Object.values(parsed).filter(
          (score): score is number => typeof score === "number" && Number.isFinite(score),
        );

        setBestScore(scores.length ? Math.max(0, ...scores.map((score) => Math.floor(score))) : 0);
      } catch {
        setBestScore(0);
      }
    }, 0);

    return () => window.clearTimeout(timeout);
  }, []);

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
          <span className="continue-stats" aria-label={`Best Snake score ${bestScore}`}>
            <Trophy aria-hidden="true" />
            Best {bestScore}
          </span>
          <span className="store-get-button">Resume Snake</span>
        </span>
      </Link>
    </m.div>
  );
}

function getUpcomingStage(game: GameDefinition) {
  if (game.slug === "dashline" || game.slug === "minesweeper") {
    return "In progress";
  }

  if (game.slug === "pong" || game.slug === "tiles") {
    return "Prototype";
  }

  return "Planned";
}

function getUpcomingTiming(game: GameDefinition) {
  if (game.slug === "dashline") {
    return "Expected Summer 2026";
  }

  if (game.slug === "minesweeper" || game.slug === "pong" || game.slug === "tiles") {
    return "Prototype";
  }

  return "Designing";
}

function getUpcomingDescription(game: GameDefinition) {
  if (game.slug === "dashline") {
    return "A quick racing challenge built for clean routes, tight turns, and fast restarts.";
  }

  if (game.slug === "minesweeper") {
    return "Classic mine-clearing with clean counts and readable boards.";
  }

  if (game.slug === "pong") {
    return "Fast paddle rallies with crisp ball movement.";
  }

  if (game.slug === "tiles") {
    return "A compact falling-block puzzle built for quick sessions.";
  }

  if (game.slug === "orbit") {
    return "Time each tap to stay locked in orbit.";
  }

  return game.summary;
}

function StoreGameCard({ game, source }: { game: GameDefinition; source: string }) {
  const isPlayable = game.status === "playable";
  const action = "Play";
  const statusLabel = isPlayable ? (game.daily ? "Daily" : "Arcade") : getUpcomingStage(game);
  const duration = game.duration ?? (game.slug === "snake" ? "1-min rounds" : "Quick session");
  const summary =
    game.slug === "snake"
      ? "Guide the snake, chain apples, and beat your best run."
      : game.slug === "cipher"
        ? "Find the hidden word with meaning scores, clues, and letters."
        : isPlayable
          ? game.summary
          : getUpcomingDescription(game);
  const cardContent = (
    <>
      <ArcadeAppIcon game={game} />
      <span className="store-game-copy">
        <span className="store-game-title-row">
          <strong>{game.title}</strong>
          <span className={`mini-status ${game.status}`}>
            {isPlayable ? <Gamepad2 aria-hidden="true" /> : <Lock aria-hidden="true" />}
            {statusLabel}
          </span>
        </span>
        <span>{summary}</span>
        <span className="store-game-meta">
          <small>{game.genre}</small>
          <small>{isPlayable ? duration : getUpcomingTiming(game)}</small>
        </span>
      </span>
      {isPlayable ? <span className="store-get-button">{action}</span> : null}
    </>
  );

  if (!isPlayable) {
    return (
      <article className={`store-game-card ${game.status} is-disabled`} data-disabled="true">
        {cardContent}
      </article>
    );
  }

  return (
    <Link
      className={`store-game-card ${game.status}`}
      href={`/games/${game.slug}` as Route}
      aria-label={`${action} ${game.title} from ${source}`}
    >
      {cardContent}
    </Link>
  );
}

function ComingSoonSection({
  games: plannedGames,
  searching,
}: {
  games: GameDefinition[];
  searching: boolean;
}) {
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
          <h2 id="coming-soon-title">{searching ? "In-progress results" : "Coming Soon"}</h2>
          <p>
            {searching
              ? "Unreleased matches stay visible but are disabled until they are playable."
              : "Upcoming games in development. Playable games stay above."}
          </p>
        </div>
      </div>
      <div className="coming-soon-layout">
        <article className="coming-soon-card is-disabled" data-disabled="true">
          <span className="coming-soon-status">Featured upcoming</span>
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
            <span>{getUpcomingDescription(featuredGame)}</span>
            <span className="coming-soon-meta">
              <span>{featuredGame.genre}</span>
              <span>{getUpcomingStage(featuredGame)}</span>
            </span>
          </span>
        </article>
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
  const hasSearch = Boolean(searchQuery.trim());
  const visibleGames = filterGamesBySearch(
    hasSearch ? allGames : shelfGames,
    searchQuery,
    activeGenre?.slug,
  );
  const previewArt = getCollectionArt(view, activeGenre, visibleGames[0] ?? shelfGames[0]);
  const showDailyCta = view !== "genre" || activeGenre?.slug === "word";

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

      {showDailyCta ? (
        <m.div variants={pageItemVariants}>
          <DailyCipherwordCTA variant={view === "discover" ? "banner" : "card"} />
        </m.div>
      ) : null}

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
  playableOnly,
  resultCount,
  onGenreChange,
}: {
  activeGenre?: GenreSlug;
  playableOnly: boolean;
  resultCount: number;
  onGenreChange: (genre: GenreSlug | undefined) => void;
}) {
  const allCount = games.length;
  const playableCount = games.filter((game) => game.status === "playable").length;
  const genresForFilters = gameGenres.filter((genre) =>
    games.some(
      (game) => game.genre === genre.label && (!playableOnly || game.status === "playable"),
    ),
  );

  return (
    <nav className="genre-pills" aria-label="Game genres">
      <span className="genre-filter-label">Filter by category</span>
      <button
        className={`genre-pill ${!activeGenre ? "active" : ""}`}
        type="button"
        onClick={() => onGenreChange(undefined)}
        aria-pressed={!activeGenre}
      >
        <Grid2X2 aria-hidden="true" />
        <span>All</span>
        <small>{allCount}</small>
      </button>
      <span className="genre-pill static" aria-label={`${playableCount} playable games`}>
        <Gamepad2 aria-hidden="true" />
        <span>Playable</span>
        <small>{playableCount}</small>
      </span>
      {genresForFilters.map((genre) => {
        const Icon = iconMap[genre.icon];
        const genreCount = games.filter(
          (game) => game.genre === genre.label && (!playableOnly || game.status === "playable"),
        ).length;

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
  const isPlayable = game.status === "playable";
  const cardContent = (
    <>
      <span className={`game-preview ${game.preview} accent-${game.accent}`} aria-hidden="true">
        <PreviewArt kind={game.preview} />
      </span>
      <span className="template-game-copy">
        <strong>{game.title}</strong>
        <small>{game.summary}</small>
        <span className={`mini-status ${game.status}`}>
          {isPlayable ? <Gamepad2 aria-hidden="true" /> : <Lock aria-hidden="true" />}
          {isPlayable ? "Playable" : "Soon"}
        </span>
      </span>
    </>
  );

  if (!isPlayable) {
    return (
      <article
        className="template-game-card coming-soon is-disabled"
        role="listitem"
        data-disabled="true"
      >
        {cardContent}
      </article>
    );
  }

  return (
    <Link className="template-game-card" href={`/games/${game.slug}` as Route} role="listitem">
      {cardContent}
    </Link>
  );
}

function GamePlayView({
  selectedGame,
  sidebarOpen,
  shouldReduceMotion,
  onPlaySnake,
}: {
  selectedGame: GameDefinition;
  sidebarOpen: boolean;
  shouldReduceMotion: boolean;
  onPlaySnake: () => void;
}) {
  const GameComponent = gameComponents[selectedGame.slug as keyof typeof gameComponents];

  return (
    <m.div className="play-page" variants={pageCascadeVariants}>
      <AnimatePresence mode="wait">
        <m.div
          key={selectedGame.slug}
          className="play-game-surface"
          variants={gamePanelVariants}
          initial={shouldReduceMotion ? false : "hidden"}
          animate="visible"
          exit={shouldReduceMotion ? undefined : "exit"}
        >
          {GameComponent ? (
            <GameComponent menuOpen={sidebarOpen} />
          ) : (
            <section
              className="launcher-panel play-unavailable"
              aria-labelledby="play-unavailable-title"
            >
              <m.div className="launcher-header">
                <div>
                  <p>Preview</p>
                  <h2 id="play-unavailable-title">{selectedGame.title}</h2>
                  <span>{selectedGame.summary}</span>
                </div>
                <span className={`status-badge ${selectedGame.status}`}>
                  <Lock aria-hidden="true" />
                  Coming soon
                </span>
              </m.div>
              <UnavailableGame game={selectedGame} onPlaySnake={onPlaySnake} />
            </section>
          )}
        </m.div>
      </AnimatePresence>
    </m.div>
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
  if (kind === "cipherword") {
    return (
      <span className="cipherword-preview-art">
        <i className="cipherword-preview-tile correct">C</i>
        <i className="cipherword-preview-tile present">I</i>
        <i className="cipherword-preview-tile absent">P</i>
        <i className="cipherword-preview-tile correct">H</i>
        <i className="cipherword-preview-meter" />
      </span>
    );
  }

  if (kind === "snake") {
    return (
      <>
        <span className="snake-preview-route">
          <i className="snake-route tail" />
          <i className="snake-route turn" />
          <i className="snake-route neck" />
          <i className="snake-head-dot" />
        </span>
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
        "A saved-games shelf for daily returns, starter picks, and the games most ready to revisit.",
      href: "/games/cipher",
      action: "Play Cipher",
      artLabel: "Favorite picks",
      shelfLabel: "Saved shelf",
      shelfTitle: "Favorite-ready games",
      panels: [
        {
          label: "Start",
          title: "Cipher is ready daily.",
          body: "The daily word puzzle stays one click away while the playable shelf grows.",
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
    href: "/games/cipher",
    action: "Play Cipher",
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
  return filterGamesBySearch(storefrontGames, searchQuery, activeGenre);
}
