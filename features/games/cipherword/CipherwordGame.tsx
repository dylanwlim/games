"use client";

import type { Route } from "next";
import Link from "next/link";
import {
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  Flame,
  History,
  Keyboard,
  Lightbulb,
  RotateCcw,
  Send,
  Settings,
  Share2,
  Sparkles,
  Target,
  Trophy,
  X,
} from "lucide-react";
import { AnimatePresence, m, useReducedMotion } from "motion/react";
import { Suspense, useEffect, useRef, useState, type FormEvent } from "react";

import {
  cipherwordModeLabels,
  getCipherwordDailyNumber,
  getUnlockedClues,
  getVisibleScore,
} from "./game-engine";
import { getAnswerShape, getDisplayLetterGroups } from "./normalize";
import { getShareText } from "./share";
import { cipherwordAchievements } from "./achievements";
import type { CipherwordGuessResult, CipherwordMode, CipherwordRoundResult } from "./types";
import { useCipherwordGame } from "./useCipherwordGame";

type CipherwordGameProps = {
  menuOpen?: boolean;
};

export function CipherwordGame({ menuOpen = false }: CipherwordGameProps) {
  return (
    <Suspense fallback={<div className="cipherword-game loading">Loading Cipherword...</div>}>
      <CipherwordGameInner menuOpen={menuOpen} />
    </Suspense>
  );
}

function CipherwordGameInner({ menuOpen }: CipherwordGameProps) {
  const shouldReduceMotion = useReducedMotion();
  const { round, stats, lastResult, achievementUnlocks, storageAvailable, actions } =
    useCipherwordGame();
  const [guess, setGuess] = useState("");
  const [shareFallback, setShareFallback] = useState("");
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const clues = getUnlockedClues(round);
  const answerShape = getAnswerShape(round.puzzle.answer);
  const dailyNumber = round.dateKey ? getCipherwordDailyNumber(round.dateKey) : undefined;
  const remaining = useCountdownLabel();
  const highContrast = stats.settings.highContrast;
  const isComplete = round.status === "won" || round.status === "lost";

  useEffect(() => {
    if (!menuOpen && round.status === "playing") {
      inputRef.current?.focus({ preventScroll: true });
    }
  }, [menuOpen, round.status]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        actions.dismissResult();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [actions]);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!guess.trim()) {
      actions.submitGuess(guess);
      return;
    }

    actions.submitGuess(guess);
    setGuess("");
  };

  const shareResult = async (result: CipherwordRoundResult) => {
    const text = getShareText(result);

    setCopied(false);
    setShareFallback("");

    try {
      if (navigator.share) {
        await navigator.share({ text, title: "Cipherword" });
        return;
      }

      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      setShareFallback(text);
    }
  };

  return (
    <section
      id="cipherword-play"
      className={`cipherword-game ${highContrast ? "high-contrast" : ""}`}
      aria-label="Cipherword game"
    >
      <header className="cipherword-toolbar">
        <div>
          <p>Cipherword</p>
          <h2>Daily semantic word puzzle</h2>
          <span>
            {round.mode === "archive" && round.dateKey
              ? `Archive ${round.dateKey}`
              : round.mode === "daily"
                ? `Puzzle #${dailyNumber ?? "--"} - new in ${remaining}`
                : `${cipherwordModeLabels[round.mode]} mode`}
          </span>
        </div>
        <div className="cipherword-toolbar-actions">
          <Link className="cipherword-archive-link" href={"/games/cipherword/archive" as Route}>
            <CalendarDays aria-hidden="true" />
            Archive
          </Link>
          <span className={`cipherword-status-chip status-${round.status}`} aria-live="polite">
            {round.status === "unavailable" ? "Needs extension" : round.status}
          </span>
        </div>
      </header>

      <div className="cipherword-mode-tabs" role="tablist" aria-label="Cipherword modes">
        {(["daily", "archive", "unlimited", "hard", "zen"] as const).map((mode) =>
          mode === "archive" ? (
            <Link
              key={mode}
              className={round.mode === "archive" ? "active" : ""}
              href={"/games/cipherword/archive" as Route}
              role="tab"
              aria-selected={round.mode === "archive"}
            >
              {cipherwordModeLabels[mode]}
            </Link>
          ) : (
            <button
              key={mode}
              type="button"
              role="tab"
              aria-selected={round.mode === mode}
              className={round.mode === mode ? "active" : ""}
              onClick={() => actions.selectMode(mode)}
            >
              {cipherwordModeLabels[mode]}
            </button>
          ),
        )}
      </div>

      {round.bankExhausted ? (
        <BankExtensionState />
      ) : (
        <div className="cipherword-shell">
          <main className="cipherword-play-panel" aria-label="Cipherword board and input">
            <div className="cipherword-board-header">
              <div>
                <span>Answer shape</span>
                <strong>{answerShape}</strong>
              </div>
              <div>
                <span>Category</span>
                <strong>
                  {round.mode === "hard" && round.guesses.length < 2
                    ? "Hidden"
                    : round.puzzle.category}
                </strong>
              </div>
              <div>
                <span>Attempts</span>
                <strong>
                  {round.guesses.length}/{round.maxGuesses ?? "∞"}
                </strong>
              </div>
            </div>

            <GuessBoard guesses={round.guesses} answer={round.puzzle.answer} mode={round.mode} />

            <SemanticMeter guess={round.guesses.at(-1)} mode={round.mode} />

            <form className="cipherword-input-row" onSubmit={onSubmit}>
              <label className="sr-only" htmlFor="cipherword-input">
                Enter a Cipherword guess
              </label>
              <input
                id="cipherword-input"
                ref={inputRef}
                value={guess}
                onChange={(event) => setGuess(event.target.value.slice(0, 32))}
                disabled={round.status !== "playing"}
                maxLength={32}
                placeholder={isComplete ? "Round complete" : "Type any word or phrase"}
                autoComplete="off"
              />
              <button
                className="primary-action as-button"
                type="submit"
                disabled={round.status !== "playing"}
              >
                <Send aria-hidden="true" />
                Guess
              </button>
            </form>

            <div className="cipherword-feedback" aria-live="polite">
              {round.message ?? "Use meaning first, then letters."}
            </div>
            <div className="cipherword-error" aria-live="assertive">
              {round.error}
            </div>
          </main>

          <aside className="cipherword-side-panel" aria-label="Cipherword stats and clues">
            {!storageAvailable ? (
              <div className="cipherword-storage-warning">
                Stats are not saving in this browser session.
              </div>
            ) : null}
            <DailyStreakPanel streak={stats.daily.currentStreak} best={stats.daily.bestStreak} />
            <SignalTrail
              clues={clues}
              closestGuess={round.closestGuess}
              reduceMotion={Boolean(shouldReduceMotion)}
            />
            <StatsPanel stats={stats} />
            <AchievementShelf stats={stats} />
            <div className="cipherword-settings-panel">
              <button
                type="button"
                className="secondary-action"
                onClick={actions.toggleHighContrast}
              >
                <Settings aria-hidden="true" />
                {highContrast ? "Standard contrast" : "High contrast"}
              </button>
              <button type="button" className="secondary-action" onClick={actions.restart}>
                <RotateCcw aria-hidden="true" />
                New round
              </button>
            </div>
          </aside>
        </div>
      )}

      <AnimatePresence>
        {lastResult ? (
          <ResultModal
            key={`${lastResult.puzzleId}-${lastResult.solved ? "won" : "lost"}`}
            result={lastResult}
            unlocks={achievementUnlocks}
            copied={copied}
            shareFallback={shareFallback}
            onClose={actions.dismissResult}
            onShare={() => shareResult(lastResult)}
            onUnlimited={() => actions.selectMode("unlimited")}
          />
        ) : null}
      </AnimatePresence>
    </section>
  );
}

function GuessBoard({
  guesses,
  answer,
  mode,
}: {
  guesses: CipherwordGuessResult[];
  answer: string;
  mode: CipherwordMode;
}) {
  const groups = getDisplayLetterGroups(answer);

  if (!guesses.length) {
    return (
      <div className="cipherword-empty-board">
        <Keyboard aria-hidden="true" />
        <strong>Start with a meaning guess.</strong>
        <span>Different lengths are allowed. Matching length unlocks letter tiles.</span>
      </div>
    );
  }

  return (
    <div className="cipherword-board" aria-label="Guess history">
      {guesses.map((guess) => (
        <m.article
          key={guess.id}
          className={`cipherword-row tier-${tierSlug(guess.tier)}`}
          layout
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          <div className="cipherword-row-summary">
            <strong>{guess.guess}</strong>
            <span>
              {guess.tier}
              {getVisibleScore(guess, mode) === null ? "" : ` · ${guess.score}`}
            </span>
          </div>
          {guess.tileStates.length ? (
            <div className="cipherword-tiles" aria-label={`Letter feedback for ${guess.guess}`}>
              {guess.tileStates.map((state, index) => (
                <m.span
                  key={`${guess.id}-${index}`}
                  className={`cipherword-tile ${state}`}
                  initial={{ opacity: 0, rotateX: 70 }}
                  animate={{ opacity: 1, rotateX: 0 }}
                  transition={{ delay: index * 0.045, duration: 0.18, ease: "easeOut" }}
                >
                  {guess.normalizedGuess[index]}
                </m.span>
              ))}
            </div>
          ) : (
            <div className="cipherword-shape-chip">
              Shape {groups.map((group) => group.length).join(" + ")}
            </div>
          )}
        </m.article>
      ))}
    </div>
  );
}

function SemanticMeter({ guess, mode }: { guess?: CipherwordGuessResult; mode: CipherwordMode }) {
  const score = guess ? getVisibleScore(guess, mode) : 0;
  const displayScore = score === null ? 64 : score;

  return (
    <section className="cipherword-meter" aria-label="Semantic warmth feedback">
      <div className="cipherword-meter-top">
        <span>Semantic warmth</span>
        <strong>{guess ? guess.tier : "No signal yet"}</strong>
        <em>{score === null ? "Tier only" : `${displayScore}/100`}</em>
      </div>
      <div className="cipherword-meter-track" aria-hidden="true">
        <m.span
          initial={false}
          animate={{ width: `${displayScore}%` }}
          transition={{ type: "spring", stiffness: 190, damping: 28 }}
        />
      </div>
      <p>
        {guess?.hint ??
          "Every accepted guess returns a tier, hint, and letter logic when lengths match."}
      </p>
    </section>
  );
}

function SignalTrail({
  clues,
  closestGuess,
  reduceMotion,
}: {
  clues: ReturnType<typeof getUnlockedClues>;
  closestGuess?: CipherwordGuessResult;
  reduceMotion: boolean;
}) {
  return (
    <section className="cipherword-signal-trail" aria-label="Signal Trail">
      <div className="cipherword-panel-heading">
        <Lightbulb aria-hidden="true" />
        <h3>Signal Trail</h3>
      </div>
      <div className="cipherword-clue-list">
        {clues.map((clue) => (
          <m.article
            key={clue.id}
            className="cipherword-clue-card"
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <span>{clue.label}</span>
            <p>{clue.text}</p>
          </m.article>
        ))}
      </div>
      <div className="cipherword-closest-card">
        <span>Closest guess</span>
        <strong>{closestGuess?.guess ?? "None yet"}</strong>
        <em>
          {closestGuess
            ? `${closestGuess.tier} · ${closestGuess.score}`
            : "The best signal will pin here."}
        </em>
      </div>
    </section>
  );
}

function DailyStreakPanel({ streak, best }: { streak: number; best: number }) {
  return (
    <section className="cipherword-streak-panel" aria-label="Daily streak">
      <Flame aria-hidden="true" />
      <div>
        <span>Daily streak</span>
        <strong>{streak}</strong>
      </div>
      <div>
        <span>Best</span>
        <strong>{best}</strong>
      </div>
    </section>
  );
}

function StatsPanel({ stats }: { stats: ReturnType<typeof useCipherwordGame>["stats"] }) {
  const winRate = stats.totals.played
    ? Math.round((stats.totals.solved / stats.totals.played) * 100)
    : 0;

  return (
    <section className="cipherword-stats-panel" aria-label="Cipherword stats">
      <div className="cipherword-panel-heading">
        <BarChart3 aria-hidden="true" />
        <h3>Stats</h3>
      </div>
      <div className="cipherword-stat-grid">
        <Metric label="Played" value={stats.totals.played} />
        <Metric label="Solved" value={stats.totals.solved} />
        <Metric label="Win rate" value={`${winRate}%`} />
        <Metric label="Archive" value={stats.archive.solvedDates.length} />
      </div>
    </section>
  );
}

function AchievementShelf({ stats }: { stats: ReturnType<typeof useCipherwordGame>["stats"] }) {
  const shown = cipherwordAchievements.slice(0, 6);

  return (
    <section className="cipherword-achievement-shelf" aria-label="Cipherword achievements">
      <div className="cipherword-panel-heading">
        <Trophy aria-hidden="true" />
        <h3>Achievements</h3>
      </div>
      <div className="cipherword-achievement-list">
        {shown.map((achievement) => {
          const unlocked = Boolean(stats.achievements[achievement.id]?.unlockedAt);

          return (
            <article key={achievement.id} className={unlocked ? "unlocked" : ""}>
              <strong>{achievement.name}</strong>
              <span>{unlocked ? "Unlocked" : achievement.condition}</span>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function ResultModal({
  result,
  unlocks,
  copied,
  shareFallback,
  onClose,
  onShare,
  onUnlimited,
}: {
  result: CipherwordRoundResult;
  unlocks: Array<{ id: string; name: string }>;
  copied: boolean;
  shareFallback: string;
  onClose: () => void;
  onShare: () => void;
  onUnlimited: () => void;
}) {
  return (
    <m.div
      className="cipherword-modal-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <m.div
        className="cipherword-result-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cipherword-result-title"
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.98 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
      >
        <button
          className="cipherword-modal-close"
          type="button"
          aria-label="Close result"
          onClick={onClose}
        >
          <X aria-hidden="true" />
        </button>
        <p>{result.solved ? "Signal found" : "Round complete"}</p>
        <h2 id="cipherword-result-title">{result.answer}</h2>
        <span>{result.learn}</span>
        <div className="cipherword-result-stats">
          <Metric label="Guesses" value={`${result.guesses.length}/${result.maxGuesses ?? "∞"}`} />
          <Metric
            label="Best"
            value={result.guesses.reduce((best, guess) => Math.max(best, guess.score), 0)}
          />
          <Metric label="Mode" value={result.mode} />
        </div>
        <SolveReplay result={result} />
        {unlocks.length ? (
          <div className="cipherword-unlocks" aria-label="New achievements">
            {unlocks.map((unlock) => (
              <span key={unlock.id}>
                <Sparkles aria-hidden="true" />
                {unlock.name}
              </span>
            ))}
          </div>
        ) : null}
        <div className="cipherword-result-actions">
          <button className="primary-action as-button" type="button" onClick={onShare}>
            <Share2 aria-hidden="true" />
            {copied ? "Copied" : "Share"}
          </button>
          <button className="secondary-action" type="button" onClick={onUnlimited}>
            Play Unlimited
          </button>
          <Link className="secondary-action" href={"/games" as Route}>
            Games
            <ArrowUpRight aria-hidden="true" />
          </Link>
        </div>
        {shareFallback ? (
          <textarea className="cipherword-share-fallback" readOnly value={shareFallback} />
        ) : null}
      </m.div>
    </m.div>
  );
}

function SolveReplay({ result }: { result: CipherwordRoundResult }) {
  return (
    <section className="cipherword-replay" aria-label="Solve replay">
      <div className="cipherword-panel-heading">
        <History aria-hidden="true" />
        <h3>Solve Replay</h3>
      </div>
      <div className="cipherword-replay-track">
        {result.guesses.map((guess, index) => (
          <span key={guess.id}>
            <em>{index + 1}</em>
            <strong>{guess.tier}</strong>
          </span>
        ))}
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function BankExtensionState() {
  return (
    <section className="cipherword-bank-state">
      <Target aria-hidden="true" />
      <h3>Daily bank needs extension.</h3>
      <p>The 2026-2050 bank is intentionally not reused. Unlimited is still ready.</p>
      <div>
        <Link className="primary-action" href={"/games/cipherword?mode=unlimited" as Route}>
          Play Unlimited
        </Link>
        <Link className="secondary-action" href={"/games/cipherword/archive" as Route}>
          Open Archive
        </Link>
      </div>
    </section>
  );
}

function useCountdownLabel() {
  const [label, setLabel] = useState(() => getCountdownLabel());

  useEffect(() => {
    const interval = window.setInterval(() => setLabel(getCountdownLabel()), 30_000);

    return () => window.clearInterval(interval);
  }, []);

  return label;
}

function getCountdownLabel(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? 0);
  const remainingSeconds =
    24 * 60 * 60 - (get("hour") * 60 * 60 + get("minute") * 60 + get("second"));
  const hours = Math.floor(remainingSeconds / 3600);
  const minutes = Math.floor((remainingSeconds % 3600) / 60);

  return `${hours}h ${String(minutes).padStart(2, "0")}m`;
}

function tierSlug(tier: string) {
  return tier.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}
