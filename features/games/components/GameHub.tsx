"use client";

import { AnimatePresence, LazyMotion, domAnimation, m, useReducedMotion } from "motion/react";
import { ArrowUpRight, Gamepad2, Lock, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { games, getGameBySlug } from "@/features/games/game-registry";
import { SnakeGame } from "@/features/games/snake/SnakeGame";
import type { GameDefinition } from "@/features/games/types";
import { siteConfig } from "@/lib/site";

type GameHubProps = {
  initialSlug: string;
};

const gameComponents = {
  snake: SnakeGame,
} as const;

export function GameHub({ initialSlug }: GameHubProps) {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();
  const [selectedSlug, setSelectedSlug] = useState(
    () => getGameBySlug(initialSlug)?.slug ?? "snake",
  );
  const selectedGame = useMemo(() => getGameBySlug(selectedSlug) ?? games[0], [selectedSlug]);

  const selectGame = (game: GameDefinition) => {
    setSelectedSlug(game.slug);
    router.push(`/games/${game.slug}`, { scroll: false });
  };

  const GameComponent = gameComponents[selectedGame.slug as keyof typeof gameComponents];

  return (
    <LazyMotion features={domAnimation}>
      <div className="site-shell">
        <header className="topbar">
          <Link className="brand" href="/" aria-label="Dylan Games home">
            <span className="brand-mark" aria-hidden="true">
              DG
            </span>
            <span>{siteConfig.name}</span>
          </Link>
          <nav className="topnav" aria-label="Primary">
            <a href="#games">Games</a>
            <a href="#launcher">Launcher</a>
          </nav>
        </header>

        <main className="hub-page">
          <section className="hub-intro" aria-labelledby="hub-title">
            <div>
              <p className="subtle-line">games.dylanwlim.com</p>
              <h1 id="hub-title">Dylan Games</h1>
            </div>
            <p>
              A quiet place for small browser games, built as a polished extension of Dylan W.
              Lim&apos;s personal site.
            </p>
          </section>

          <div className="hub-grid">
            <m.section
              id="launcher"
              className="launcher-panel"
              aria-labelledby="launcher-title"
              layout={!shouldReduceMotion}
            >
              <div className="launcher-header">
                <div>
                  <p className="panel-kicker">
                    {selectedGame.status === "playable" ? "Playing" : "Preview"}
                  </p>
                  <h2 id="launcher-title">{selectedGame.title}</h2>
                  <p>{selectedGame.summary}</p>
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
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
                  animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                  exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                >
                  {GameComponent ? (
                    <GameComponent />
                  ) : (
                    <UnavailableGame game={selectedGame} onPlaySnake={() => selectGame(games[0])} />
                  )}
                </m.div>
              </AnimatePresence>
            </m.section>

            <section id="games" className="game-list-panel" aria-labelledby="games-title">
              <div className="section-heading">
                <div>
                  <p className="panel-kicker">Library</p>
                  <h2 id="games-title">All games</h2>
                </div>
                <span>{games.length} slots</span>
              </div>

              <div className="game-grid" role="list">
                {games.map((game) => (
                  <div key={game.slug} role="listitem">
                    <GameCard
                      game={game}
                      selected={game.slug === selectedGame.slug}
                      onSelect={() => selectGame(game)}
                    />
                  </div>
                ))}
              </div>
            </section>
          </div>
        </main>
      </div>
    </LazyMotion>
  );
}

function GameCard({
  game,
  selected,
  onSelect,
}: {
  game: GameDefinition;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      className={`game-card ${selected ? "selected" : ""}`}
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
    >
      <span className={`game-preview ${game.preview} accent-${game.accent}`} aria-hidden="true">
        <PreviewArt kind={game.preview} />
      </span>
      <span className="game-card-copy">
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
  );
}

function UnavailableGame({ game, onPlaySnake }: { game: GameDefinition; onPlaySnake: () => void }) {
  return (
    <div className="unavailable-state">
      <div className={`unavailable-art ${game.preview} accent-${game.accent}`} aria-hidden="true">
        <PreviewArt kind={game.preview} />
      </div>
      <div>
        <p className="panel-kicker">Reserved slot</p>
        <h3>{game.title} is not playable yet.</h3>
        <p>{game.description}</p>
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
          <i key={index}>{index === 1 ? "1" : index === 3 ? "2" : index === 4 ? "" : ""}</i>
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
