"use client";

import {
  Carousel,
  CarouselContent,
  CarouselIndicator,
  CarouselItem,
  CarouselNavigation,
} from "@/components/core/carousel";
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
import { achievementDefinitions } from "@/features/games/progression";
import { games, getGameBySlug, playableGames } from "@/features/games/game-registry";
import { SnakeGame } from "@/features/games/snake/snake-game";
import type { GameDefinition } from "@/features/games/types";
import { useGameProgression } from "@/features/games/use-game-progression";
import {
  DWL_DEFAULT_AUTH_RETURN_URL,
  getDwlAccountUrl,
  getDwlAuthReturnUrl,
  getDwlSignInUrl,
  getDwlSignUpUrl,
  type DwlAccountUser,
} from "@/lib/dwl-accounts";
import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  CheckCircle2,
  Gamepad2,
  Grid2X2,
  Lock,
  LogIn,
  LogOut,
  PanelLeft,
  Play,
  Search,
  Trophy,
  UserRound,
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
import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent } from "react";

type GameHubView = "games" | "achievements";

type GameHubProps = {
  focusGame?: boolean;
  initialSlug?: string;
  view?: GameHubView;
};

const fallbackGame = games[0] as GameDefinition;
const featureAutoplayMs = 6200;
const routeExitDelayMs = 150;
const motionEase = [0.22, 1, 0.36, 1] as const;

const pageMotionVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.24, ease: motionEase },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: { duration: 0.14, ease: "easeIn" },
  },
};

const pageItemVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.24, ease: "easeOut" },
  },
};

export function GameHub({
  focusGame = false,
  initialSlug = "snake",
  view = "games",
}: GameHubProps) {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pageExiting, setPageExiting] = useState(false);
  const navigationTimeoutRef = useRef<number | null>(null);
  const selectedGame = useMemo(() => getGameBySlug(initialSlug) ?? fallbackGame, [initialSlug]);
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
          activeGameSlug={focusGame ? selectedGame.slug : undefined}
          activeView={view}
          hideSearch={focusGame || view === "achievements"}
          searchQuery={searchQuery}
          onNavigate={navigateWithMotion}
          onSearchChange={setSearchQuery}
        />
        <m.main
          id="main-content"
          className={`arcade-main ${focusGame ? "play-main" : ""}`}
          onClickCapture={handleMainLinkClick}
        >
          <HubSidebarBar focusGame={focusGame} view={view} />
          <AnimatePresence mode="wait" initial={false}>
            <m.div
              key={`${view}:${focusGame ? selectedGame.slug : "index"}`}
              className="page-motion-shell"
              variants={pageMotionVariants}
              initial={shouldReduceMotion ? false : "hidden"}
              animate={pageExiting && !shouldReduceMotion ? "exit" : "visible"}
              exit={shouldReduceMotion ? undefined : "exit"}
            >
              {focusGame ? (
                <GamePlayView
                  selectedGame={selectedGame}
                  sidebarOpen={sidebarOpen}
                  shouldReduceMotion={Boolean(shouldReduceMotion)}
                />
              ) : view === "achievements" ? (
                <AchievementsView shouldReduceMotion={Boolean(shouldReduceMotion)} />
              ) : (
                <GamesView
                  searchQuery={searchQuery}
                  shouldReduceMotion={Boolean(shouldReduceMotion)}
                />
              )}
            </m.div>
          </AnimatePresence>
        </m.main>
      </SidebarProvider>
    </LazyMotion>
  );
}

function HubSidebar({
  activeGameSlug,
  activeView,
  hideSearch,
  searchQuery,
  onNavigate,
  onSearchChange,
}: {
  activeGameSlug?: string;
  activeView: GameHubView;
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
              isActive={activeView === "games" && !activeGameSlug}
              size="lg"
              tooltip="Dylan Games"
            >
              <Link
                href={"/" as Route}
                onClick={(event) => handleSidebarNavigation(event, "/", onNavigate)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- Official SVG logo is a static public asset. */}
                <img
                  alt=""
                  aria-hidden="true"
                  className="aspect-square size-8"
                  height={32}
                  src="/logo-dark.svg"
                  width={32}
                />
                <div className="flex min-w-0 flex-col gap-0.5 leading-none">
                  <span className="truncate font-semibold">Dylan Games</span>
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
                <Search
                  aria-hidden="true"
                  className="game-sidebar-search-icon pointer-events-none absolute top-1/2 size-4 select-none opacity-50"
                />
                <SidebarInput
                  id="game-sidebar-search"
                  aria-label="Search games"
                  value={searchQuery}
                  onChange={(event) => onSearchChange(event.target.value)}
                  placeholder="Search games..."
                  className="game-sidebar-search pl-9"
                  type="search"
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
                active={activeView === "games" && !activeGameSlug}
                onNavigate={onNavigate}
              />
              <HubSidebarLink
                href="/achievements"
                icon={Trophy}
                label="Achievements"
                active={activeView === "achievements"}
                onNavigate={onNavigate}
              />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Games</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {playableGames.map((game) => (
                <HubSidebarLink
                  key={game.slug}
                  href={`/games/${game.slug}`}
                  icon={Gamepad2}
                  label={game.title}
                  active={activeGameSlug === game.slug}
                  onNavigate={onNavigate}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <DwlAccountSidebarItems />
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
  active,
  href,
  icon: Icon,
  label,
  onNavigate,
}: {
  active: boolean;
  href: string;
  icon: LucideIcon;
  label: string;
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

function HubSidebarBar({ focusGame, view }: { focusGame: boolean; view: GameHubView }) {
  const { isMobile, open, openMobile, toggleSidebar } = useSidebar();
  const navigationOpen = isMobile ? openMobile : open;
  const label = navigationOpen ? "Close navigation" : "Open navigation";
  const pageLabel = focusGame ? "Play" : view === "achievements" ? "Achievements" : "Games";

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

function DwlAccountSidebarItems() {
  const { authReturnUrl, user } = useDwlSession();

  if (user) {
    return (
      <>
        <SidebarMenuItem>
          <SidebarMenuButton asChild tooltip={user.email}>
            <a href={getDwlAccountUrl({ returnUrl: authReturnUrl })}>
              <UserRound aria-hidden="true" />
              <span>{user.name || user.email}</span>
            </a>
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton asChild tooltip="Sign out">
            <a href="/auth/sign-out">
              <LogOut aria-hidden="true" />
              <span>Sign out</span>
            </a>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </>
    );
  }

  return (
    <>
      <SidebarMenuItem>
        <SidebarMenuButton asChild tooltip="Sign in">
          <a href={getDwlSignInUrl({ returnUrl: authReturnUrl })}>
            <LogIn aria-hidden="true" />
            <span>Sign in</span>
          </a>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton asChild tooltip="Create account">
          <a href={getDwlSignUpUrl({ returnUrl: authReturnUrl })}>
            <UserRound aria-hidden="true" />
            <span>Create account</span>
          </a>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </>
  );
}

function GamesView({
  searchQuery,
  shouldReduceMotion,
}: {
  searchQuery: string;
  shouldReduceMotion: boolean;
}) {
  const visibleGames = useMemo(() => filterPlayableGames(searchQuery), [searchQuery]);

  return (
    <m.div className="games-page compact-games-page" variants={pageMotionVariants}>
      <m.header className="arcade-title" variants={pageItemVariants}>
        <h1>Games</h1>
      </m.header>
      <FeatureCarousel shouldReduceMotion={shouldReduceMotion} />
      <m.section
        className="available-games-section"
        aria-labelledby="available-games-title"
        variants={pageItemVariants}
      >
        <div className="available-games-heading">
          <h2 id="available-games-title">Games</h2>
          <span>{visibleGames.length} available</span>
        </div>
        {visibleGames.length ? (
          <div className="available-games-grid" role="list">
            {visibleGames.map((game) => (
              <AvailableGameCard key={game.slug} game={game} />
            ))}
          </div>
        ) : (
          <div className="compact-empty-state">
            <strong>No available games match.</strong>
            <span>Clear search to show Snake.</span>
          </div>
        )}
      </m.section>
    </m.div>
  );
}

function FeatureCarousel({ shouldReduceMotion }: { shouldReduceMotion: boolean }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const featured = playableGames;

  useEffect(() => {
    if (shouldReduceMotion || featured.length < 2) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setActiveIndex((currentIndex) => (currentIndex + 1) % featured.length);
    }, featureAutoplayMs);

    return () => window.clearTimeout(timeout);
  }, [activeIndex, featured.length, shouldReduceMotion]);

  return (
    <m.section className="games-showcase" aria-label="Featured games" variants={pageItemVariants}>
      <Carousel
        className="games-showcase-carousel"
        disableDrag={shouldReduceMotion || featured.length < 2}
        index={activeIndex}
        onIndexChange={setActiveIndex}
      >
        <CarouselContent>
          {featured.map((game) => (
            <CarouselItem key={game.slug} className="games-showcase-item">
              <ShowcaseSlide game={game} />
            </CarouselItem>
          ))}
        </CarouselContent>
        {featured.length > 1 ? (
          <>
            <CarouselNavigation
              alwaysShow
              className="games-showcase-navigation"
              classNameButton="games-showcase-nav-button"
            />
            <CarouselIndicator className="games-showcase-indicator" />
          </>
        ) : null}
      </Carousel>
    </m.section>
  );
}

function ShowcaseSlide({ game }: { game: GameDefinition }) {
  return (
    <div className={`games-showcase-slide accent-${game.accent}`}>
      <div className="games-showcase-copy">
        <span className="showcase-kicker">Available now</span>
        <h2>{game.title}</h2>
        <p>{game.description}</p>
        <div className="showcase-actions">
          <Link
            className="primary-play-button"
            href={`/games/${game.slug}` as Route}
            aria-label={`Play ${game.title} from showcase`}
          >
            <Play aria-hidden="true" />
            Play {game.title}
          </Link>
          <Link
            className="feature-secondary-button"
            href={"/achievements" as Route}
            aria-label="View achievements"
          >
            Achievements
            <Trophy aria-hidden="true" />
          </Link>
        </div>
      </div>
      <div className="games-showcase-art" aria-hidden="true">
        <PreviewArt kind={game.preview} />
      </div>
    </div>
  );
}

function AvailableGameCard({ game }: { game: GameDefinition }) {
  return (
    <Link
      className={`available-game-card accent-${game.accent}`}
      href={`/games/${game.slug}` as Route}
      role="listitem"
      aria-label={`Play ${game.title}`}
    >
      <span className="available-game-art" aria-hidden="true">
        <PreviewArt kind={game.preview} />
      </span>
      <span className="available-game-copy">
        <strong>{game.title}</strong>
        <span>{game.summary}</span>
        <small>{game.duration}</small>
      </span>
      <span className="store-get-button">Play</span>
    </Link>
  );
}

function AchievementsView({ shouldReduceMotion }: { shouldReduceMotion: boolean }) {
  const { levelProgress, loaded, progression } = useGameProgression();
  const unlockedCount = Object.keys(progression.achievements).length;
  const unlockedXp = Object.values(progression.achievements).reduce(
    (total, achievement) => total + achievement.xp,
    0,
  );

  return (
    <m.div className="achievements-page" variants={pageMotionVariants}>
      <m.header className="achievements-hero" variants={pageItemVariants}>
        <div>
          <h1>Achievements</h1>
          <p>XP and unlocks add up across every game on Dylan Games.</p>
        </div>
        <div className="xp-ring" aria-label={`Level ${progression.level}`}>
          <span>Level</span>
          <strong>{loaded ? progression.level : 1}</strong>
        </div>
      </m.header>

      <m.section className="xp-overview-grid" aria-label="XP summary" variants={pageItemVariants}>
        <ProgressStat label="Total XP" value={progression.totalXp.toLocaleString()} />
        <ProgressStat
          label="Next level"
          value={`${levelProgress.earnedThisLevel}/${levelProgress.neededThisLevel}`}
        />
        <ProgressStat
          label="Achievements"
          value={`${unlockedCount}/${achievementDefinitions.length}`}
        />
        <ProgressStat label="Unlock XP" value={unlockedXp.toLocaleString()} />
      </m.section>

      <m.section
        className="achievement-grid-section"
        aria-labelledby="achievement-grid-title"
        variants={pageItemVariants}
      >
        <div className="available-games-heading">
          <h2 id="achievement-grid-title">All Achievements</h2>
          <span>{unlockedCount} unlocked</span>
        </div>
        <div className="achievement-grid" role="list">
          {achievementDefinitions.map((achievement) => {
            const unlocked = Boolean(progression.achievements[achievement.id]);

            return (
              <article
                key={achievement.id}
                className={`achievement-card ${unlocked ? "unlocked" : ""}`}
                role="listitem"
              >
                <span className="achievement-icon" aria-hidden="true">
                  {unlocked ? <CheckCircle2 /> : <Lock />}
                </span>
                <span className="achievement-copy">
                  <strong>{achievement.title}</strong>
                  <span>{achievement.description}</span>
                  <small>{achievement.xp} XP</small>
                </span>
              </article>
            );
          })}
        </div>
      </m.section>
      <m.div className="achievements-play-link" variants={pageItemVariants}>
        <Link className="primary-play-button" href="/games/snake">
          <Gamepad2 aria-hidden="true" />
          Play Snake
        </Link>
      </m.div>
      {shouldReduceMotion ? null : <span className="achievements-glow" aria-hidden="true" />}
    </m.div>
  );
}

function ProgressStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="progress-stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function GamePlayView({
  selectedGame,
  sidebarOpen,
  shouldReduceMotion,
}: {
  selectedGame: GameDefinition;
  sidebarOpen: boolean;
  shouldReduceMotion: boolean;
}) {
  const { authReturnUrl, loading, user } = useDwlSession();

  return (
    <m.div className="play-page" variants={pageMotionVariants}>
      <AnimatePresence mode="wait">
        <m.div
          key={user ? selectedGame.slug : "account-required"}
          className="play-game-surface"
          variants={pageMotionVariants}
          initial={shouldReduceMotion ? false : "hidden"}
          animate="visible"
          exit={shouldReduceMotion ? undefined : "exit"}
        >
          {loading ? (
            <AccountGate loading />
          ) : user ? (
            <SnakeGame menuOpen={sidebarOpen} />
          ) : (
            <AccountGate authReturnUrl={authReturnUrl} game={selectedGame} />
          )}
        </m.div>
      </AnimatePresence>
    </m.div>
  );
}

function AccountGate({
  authReturnUrl,
  game,
  loading = false,
}: {
  authReturnUrl?: string;
  game?: GameDefinition;
  loading?: boolean;
}) {
  return (
    <section className="account-gate" aria-labelledby="account-gate-title">
      <div className="account-gate-art" aria-hidden="true">
        <PreviewArt kind="snake" />
      </div>
      <div className="account-gate-copy">
        <span>{loading ? "Checking account" : "DWL Accounts required"}</span>
        <h1 id="account-gate-title">
          {loading ? "Loading account status." : `Sign in to play ${game?.title ?? "Snake"}.`}
        </h1>
        <p>
          Game access, XP, achievements, and cross-device progress use your DWL Accounts session.
        </p>
        {!loading && authReturnUrl ? (
          <div className="account-gate-actions">
            <a className="primary-play-button" href={getDwlSignInUrl({ returnUrl: authReturnUrl })}>
              <LogIn aria-hidden="true" />
              Sign in
            </a>
            <a
              className="feature-secondary-button"
              href={getDwlSignUpUrl({ returnUrl: authReturnUrl })}
            >
              Create account
              <UserRound aria-hidden="true" />
            </a>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function PreviewArt({ kind }: { kind: GameDefinition["preview"] }) {
  if (kind !== "snake") {
    return null;
  }

  return (
    <span className="snake-preview-route">
      <i className="snake-route tail" />
      <i className="snake-route turn" />
      <i className="snake-route neck" />
      <i className="snake-head-dot" />
      <i className="food-dot" />
    </span>
  );
}

function filterPlayableGames(searchQuery: string) {
  const query = searchQuery.trim().toLowerCase();

  if (!query) {
    return playableGames;
  }

  return playableGames.filter((game) =>
    [game.title, game.summary, game.description, game.genre, ...(game.tags ?? [])]
      .join(" ")
      .toLowerCase()
      .includes(query),
  );
}

function useDwlSession() {
  const [user, setUser] = useState<DwlAccountUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [authReturnUrl, setAuthReturnUrl] = useState(DWL_DEFAULT_AUTH_RETURN_URL);

  useEffect(() => {
    let cancelled = false;
    const authReturnFrame = window.requestAnimationFrame(() => {
      if (!cancelled) {
        setAuthReturnUrl(getDwlAuthReturnUrl(getCurrentAuthReturnPath()));
      }
    });

    void fetch("/api/dwl/session", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((body: { user?: DwlAccountUser | null } | null) => {
        if (!cancelled) {
          setUser(body?.user ?? null);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(authReturnFrame);
    };
  }, []);

  return {
    authReturnUrl,
    loading,
    user,
  };
}

function getCurrentAuthReturnPath() {
  if (typeof window === "undefined") {
    return "/auth/callback";
  }

  const currentPath =
    `${window.location.pathname}${window.location.search}${window.location.hash}` || "/";
  return `/auth/callback?next=${encodeURIComponent(currentPath)}`;
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
