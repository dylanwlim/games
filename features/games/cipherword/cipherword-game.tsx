"use client";

import type { Route } from "next";
import Link from "next/link";
import {
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  CircleHelp,
  Flame,
  History,
  KeyRound,
  Lightbulb,
  LockKeyhole,
  RotateCcw,
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
import { getDisplayLetterGroups, getNormalizedLetterCount, normalizeAnswer } from "./normalize";
import { getShareText } from "./share";
import { cipherwordAchievements } from "./achievements";
import type { CipherwordGuessResult, CipherwordMode, CipherwordRoundResult } from "./types";
import { useCipherwordGame } from "./use-cipherword-game";

type CipherwordGameProps = {
  menuOpen?: boolean;
};

export function CipherwordGame({ menuOpen = false }: CipherwordGameProps) {
  return (
    <Suspense fallback={<div className="cipherword-game loading">Loading Cipher...</div>}>
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
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const clues = getUnlockedClues(round);
  const answerLength = getNormalizedLetterCount(round.puzzle.answer);
  const dailyNumber = round.dateKey ? getCipherwordDailyNumber(round.dateKey) : undefined;
  const remaining = useCountdownLabel();
  const highContrast = stats.settings.highContrast;
  const isComplete = round.status === "won" || round.status === "lost";
  const latestGuess = round.guesses.at(-1);
  const bestGuess =
    round.guesses.find((entry) => entry.isExact) ??
    round.guesses
      .filter((entry) => !entry.isExact)
      .sort((left, right) => right.score - left.score)[0];
  const categoryHidden = round.mode === "hard" && round.guesses.length < 2;
  const categoryLabel = categoryHidden
    ? "Hidden until guess 2"
    : getFriendlyCategory(round.puzzle.category, round.puzzle.answer);
  const guessesLeft =
    round.maxGuesses === null ? null : Math.max(round.maxGuesses - round.guesses.length, 0);
  const statusLabel = getRoundStatusLabel(round.status);
  const inputPlaceholder = getInputPlaceholder({
    answerLength,
    categoryLabel,
    categoryHidden,
    isComplete,
    guessCount: round.guesses.length,
  });

  useEffect(() => {
    if (!menuOpen && round.status === "playing") {
      inputRef.current?.focus({ preventScroll: true });
    }
  }, [menuOpen, round.status]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowHowToPlay(false);
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
        await navigator.share({ text, title: "Cipher" });
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
      aria-label="Cipher game"
    >
      <header className="cipherword-toolbar">
        <div>
          <p>
            {round.mode === "archive"
              ? "Archive puzzle"
              : `${cipherwordModeLabels[round.mode]} mode`}
          </p>
          <h2>Cipher</h2>
          <span>
            {round.mode === "archive" && round.dateKey
              ? `Archive ${round.dateKey}`
              : round.mode === "daily"
                ? `Puzzle #${dailyNumber ?? "--"} · Next puzzle in ${remaining}`
                : modeDescriptions[round.mode]}
          </span>
        </div>
        <div className="cipherword-toolbar-actions">
          <button
            type="button"
            className="cipherword-archive-link"
            onClick={() => setShowHowToPlay(true)}
          >
            <CircleHelp aria-hidden="true" />
            How it works
          </button>
          <Link className="cipherword-archive-link" href={"/games/cipher/archive" as Route}>
            <CalendarDays aria-hidden="true" />
            Archive
          </Link>
          <span className={`cipherword-status-chip status-${round.status}`} aria-live="polite">
            {round.mode === "daily" && dailyNumber ? `Daily #${dailyNumber}` : statusLabel}
          </span>
        </div>
      </header>

      <div className="cipherword-mode-tabs" role="tablist" aria-label="Cipher modes">
        {(["daily", "unlimited", "hard", "zen"] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            role="tab"
            aria-selected={round.mode === mode}
            aria-label={`${cipherwordModeLabels[mode]} mode: ${modeDescriptions[mode]}`}
            title={modeDescriptions[mode]}
            className={round.mode === mode ? "active" : ""}
            onClick={() => actions.selectMode(mode)}
          >
            {cipherwordModeLabels[mode]}
          </button>
        ))}
      </div>

      {round.bankExhausted ? (
        <BankExtensionState />
      ) : (
        <div className="cipherword-shell">
          <main className="cipherword-play-panel" aria-label="Cipher board and input">
            <div className="cipherword-clue-strip" aria-label="Current puzzle clues">
              <div>
                <span>Goal</span>
                <strong>Find the hidden word</strong>
              </div>
              <div>
                <span>Answer length</span>
                <strong>{answerLength} letters</strong>
              </div>
              <div>
                <span>Clue category</span>
                <strong>{categoryLabel}</strong>
              </div>
              <div>
                <span>Guesses</span>
                <strong>
                  {round.maxGuesses === null
                    ? `${round.guesses.length} used · no limit`
                    : `${guessesLeft} left`}
                </strong>
              </div>
            </div>

            <AnswerPattern
              answer={round.puzzle.answer}
              guesses={round.guesses}
              solved={round.status === "won"}
            />

            <GuessBoard
              guesses={round.guesses}
              answer={round.puzzle.answer}
              mode={round.mode}
              maxGuesses={round.maxGuesses}
              reduceMotion={Boolean(shouldReduceMotion)}
            />

            <SemanticMeter bestGuess={bestGuess} latestGuess={latestGuess} mode={round.mode} />

            <form className="cipherword-input-row" onSubmit={onSubmit}>
              <label className="sr-only" htmlFor="cipherword-input">
                Enter a Cipher guess
              </label>
              <input
                id="cipherword-input"
                ref={inputRef}
                value={guess}
                onChange={(event) => setGuess(event.target.value.slice(0, 32))}
                disabled={round.status !== "playing"}
                maxLength={32}
                placeholder={inputPlaceholder}
                autoComplete="off"
              />
              <button
                className="primary-action as-button"
                type="submit"
                disabled={round.status !== "playing"}
              >
                <Target aria-hidden="true" />
                Guess
              </button>
            </form>

            <div className="cipherword-feedback" aria-live="polite">
              {round.message ?? getInputHelper(round.guesses.length, answerLength)}
            </div>
            <div className="cipherword-error" aria-live="assertive">
              {round.error}
            </div>
          </main>

          <aside className="cipherword-side-panel" aria-label="Cipher clues and progress">
            {!storageAvailable ? (
              <div className="cipherword-storage-warning">
                Stats are not saving in this browser session.
              </div>
            ) : null}
            <SignalTrail
              clues={clues}
              bestGuess={bestGuess}
              latestGuess={latestGuess}
              reduceMotion={Boolean(shouldReduceMotion)}
            />
            <DailyStreakPanel
              streak={stats.daily.currentStreak}
              best={stats.daily.bestStreak}
              guessesLeft={guessesLeft}
              used={round.guesses.length}
            />
            {isComplete || stats.totals.played > 0 ? <StatsPanel stats={stats} /> : null}
            {isComplete || stats.totals.played > 0 ? <AchievementShelf stats={stats} /> : null}
            <details className="cipherword-settings-panel">
              <summary>
                <Settings aria-hidden="true" />
                Settings
              </summary>
              <button
                type="button"
                className="secondary-action"
                onClick={actions.toggleHighContrast}
              >
                {highContrast ? "Standard contrast" : "High contrast"}
              </button>
              {round.mode === "daily" || round.mode === "archive" ? (
                <button
                  type="button"
                  className="secondary-action"
                  onClick={() => actions.selectMode("unlimited")}
                >
                  <KeyRound aria-hidden="true" />
                  Play Unlimited
                </button>
              ) : (
                <button type="button" className="secondary-action" onClick={actions.restart}>
                  <RotateCcw aria-hidden="true" />
                  New round
                </button>
              )}
            </details>
          </aside>
        </div>
      )}

      <AnimatePresence>
        {showHowToPlay ? (
          <HowToPlayModal key="cipher-how-to-play" onClose={() => setShowHowToPlay(false)} />
        ) : null}
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

function AnswerPattern({
  answer,
  guesses,
  solved,
}: {
  answer: string;
  guesses: CipherwordGuessResult[];
  solved: boolean;
}) {
  const answerLetters = normalizeAnswer(answer).split("");
  const revealed = new Map<number, string>();
  const groups = getDisplayLetterGroups(answer);
  const indexedGroups = groups.map((group, groupIndex) => {
    const offset = groups
      .slice(0, groupIndex)
      .reduce((total, currentGroup) => total + currentGroup.length, 0);

    return group.map((letter, index) => ({ index: offset + index, letter }));
  });

  guesses.forEach((guessResult) => {
    guessResult.tileStates.forEach((state, index) => {
      if (state === "correct") {
        revealed.set(index, answerLetters[index] ?? guessResult.normalizedGuess[index] ?? "");
      }
    });
  });

  if (solved) {
    answerLetters.forEach((letter, index) => revealed.set(index, letter));
  } else {
    if (guesses.length >= 2 && answerLetters[0]) {
      revealed.set(0, answerLetters[0]);
    }

    if (guesses.length >= 5 && answerLetters.at(-1)) {
      revealed.set(answerLetters.length - 1, answerLetters.at(-1) ?? "");
    }
  }

  return (
    <section
      className="cipherword-answer-pattern"
      aria-label={`Hidden answer pattern, ${answerLetters.length} letters`}
    >
      <span className="cipherword-answer-label">
        <LockKeyhole aria-hidden="true" />
        Hidden word
      </span>
      <div>
        {indexedGroups.map((group, groupIndex) => (
          <span
            className="cipherword-answer-group"
            key={`${group.map((entry) => entry.letter).join("")}-${groupIndex}`}
          >
            {group.map(({ index }) => {
              const letter = revealed.get(index);

              return (
                <span key={index} className={`cipherword-answer-tile ${letter ? "revealed" : ""}`}>
                  {letter ?? ""}
                </span>
              );
            })}
          </span>
        ))}
      </div>
      <p>
        Find today&apos;s hidden word. Each guess gets a meaning score; exact-length guesses reveal
        letter clues.
      </p>
    </section>
  );
}

function GuessBoard({
  guesses,
  answer,
  mode,
  maxGuesses,
  reduceMotion,
}: {
  guesses: CipherwordGuessResult[];
  answer: string;
  mode: CipherwordMode;
  maxGuesses: number | null;
  reduceMotion: boolean;
}) {
  const answerLength = getNormalizedLetterCount(answer);
  const slotCount = Math.max(maxGuesses ?? 7, guesses.length + (maxGuesses === null ? 1 : 0));

  return (
    <div className="cipherword-board" aria-label="Guess history">
      {Array.from({ length: slotCount }, (_, index) => {
        const guessResult = guesses[index];

        if (!guessResult) {
          const isNextSlot = index === guesses.length;

          return (
            <article
              key={`empty-${index}`}
              className={`cipherword-row empty ${isNextSlot ? "current" : ""}`}
            >
              <div className="cipherword-row-summary">
                <span>Guess {index + 1}</span>
                <strong>{isNextSlot ? "Next guess" : "Open slot"}</strong>
                <p>
                  {isNextSlot
                    ? `Try related words. ${answerLength}-letter guesses reveal tiles.`
                    : "Ready."}
                </p>
              </div>
              <div className="cipherword-row-result ghost" aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
            </article>
          );
        }

        const visibleScore = getVisibleScore(guessResult, mode);
        const displayScore = visibleScore === null ? 62 : visibleScore;
        const lengthText =
          guessResult.normalizedGuess.length === answerLength
            ? "Length match"
            : `${guessResult.normalizedGuess.length}/${answerLength} letters`;

        return (
          <m.article
            key={guessResult.id}
            className={`cipherword-row tier-${tierSlug(guessResult.tier)}`}
            layout
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <div className="cipherword-row-summary">
              <span>Guess {index + 1}</span>
              <strong>{guessResult.guess}</strong>
              <p>{guessResult.hint}</p>
            </div>
            <div className="cipherword-row-result">
              <div className="cipherword-row-score">
                <span>{guessResult.tier}</span>
                <strong>{visibleScore === null ? "Tier only" : `${visibleScore}/100`}</strong>
                <i aria-hidden="true">
                  <span style={{ width: `${displayScore}%` }} />
                </i>
              </div>
              {guessResult.tileStates.length ? (
                <div
                  className="cipherword-tiles"
                  aria-label={`Letter feedback for ${guessResult.guess}`}
                >
                  {guessResult.tileStates.map((state, tileIndex) => (
                    <m.span
                      key={`${guessResult.id}-${tileIndex}`}
                      className={`cipherword-tile ${state}`}
                      initial={reduceMotion ? false : { opacity: 0, rotateX: 70 }}
                      animate={{ opacity: 1, rotateX: 0 }}
                      transition={{
                        delay: tileIndex * 0.045,
                        duration: 0.18,
                        ease: "easeOut",
                      }}
                    >
                      {guessResult.normalizedGuess[tileIndex]}
                    </m.span>
                  ))}
                </div>
              ) : (
                <div className="cipherword-length-chip">No letter clue · {lengthText}</div>
              )}
            </div>
          </m.article>
        );
      })}
    </div>
  );
}

function SemanticMeter({
  bestGuess,
  latestGuess,
  mode,
}: {
  bestGuess?: CipherwordGuessResult;
  latestGuess?: CipherwordGuessResult;
  mode: CipherwordMode;
}) {
  const score = bestGuess ? getVisibleScore(bestGuess, mode) : 0;
  const displayScore = score === null ? 64 : score;
  const latestScore = latestGuess ? getVisibleScore(latestGuess, mode) : 0;
  const latestLabel = latestGuess
    ? `Latest: ${latestGuess.guess} · ${latestScore === null ? latestGuess.tier : `${latestScore}/100`}`
    : "Latest: no guesses yet";

  return (
    <section className="cipherword-meter" aria-label="Meaning score feedback">
      <div className="cipherword-meter-top">
        <span>Meaning score</span>
        <strong>
          {bestGuess ? `Best: ${bestGuess.guess} · ${bestGuess.tier}` : "No guesses yet"}
        </strong>
        <em>{score === null ? "Tier only" : `${displayScore}/100`}</em>
      </div>
      <div className="cipherword-meter-track" aria-hidden="true">
        <m.span
          initial={false}
          animate={{ width: `${displayScore}%` }}
          transition={{ type: "spring", stiffness: 190, damping: 28 }}
        />
      </div>
      <div className="cipherword-meter-scale" aria-hidden="true">
        <span>0 = unrelated</span>
        <span>100 = exact answer</span>
      </div>
      <p>{bestGuess?.hint ?? "Wordle, but every guess is scored by meaning."}</p>
      <p className="cipherword-latest-score">{latestLabel}</p>
    </section>
  );
}

function SignalTrail({
  clues,
  bestGuess,
  latestGuess,
  reduceMotion,
}: {
  clues: ReturnType<typeof getUnlockedClues>;
  bestGuess?: CipherwordGuessResult;
  latestGuess?: CipherwordGuessResult;
  reduceMotion: boolean;
}) {
  return (
    <section className="cipherword-signal-trail" aria-label="Cipher clues">
      <div className="cipherword-panel-heading">
        <Lightbulb aria-hidden="true" />
        <h3>Clues</h3>
      </div>
      <div className="cipherword-closest-card">
        <span>Best guess so far</span>
        <strong>{bestGuess?.guess ?? "No guesses yet"}</strong>
        <em>
          {bestGuess
            ? `${bestGuess.tier} · ${bestGuess.score}/100`
            : "Your closest guess will appear here."}
        </em>
      </div>
      {latestGuess ? (
        <div className="cipherword-latest-card">
          <span>Latest guess</span>
          <strong>{latestGuess.guess}</strong>
          <em>{latestGuess.hint}</em>
        </div>
      ) : null}
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
    </section>
  );
}

function DailyStreakPanel({
  streak,
  best,
  guessesLeft,
  used,
}: {
  streak: number;
  best: number;
  guessesLeft: number | null;
  used: number;
}) {
  return (
    <section className="cipherword-streak-panel" aria-label="Round progress">
      <Flame aria-hidden="true" />
      <div>
        <span>Guesses used</span>
        <strong>{used}</strong>
      </div>
      <div>
        <span>{guessesLeft === null ? "Limit" : "Left"}</span>
        <strong>{guessesLeft === null ? "None" : guessesLeft}</strong>
      </div>
      <div>
        <span>Streak</span>
        <strong>
          {streak} / {best}
        </strong>
      </div>
    </section>
  );
}

function StatsPanel({ stats }: { stats: ReturnType<typeof useCipherwordGame>["stats"] }) {
  const winRate = stats.totals.played
    ? Math.round((stats.totals.solved / stats.totals.played) * 100)
    : 0;

  return (
    <section className="cipherword-stats-panel" aria-label="Cipher stats">
      <div className="cipherword-panel-heading">
        <BarChart3 aria-hidden="true" />
        <h3>Stats</h3>
      </div>
      <div className="cipherword-stat-grid">
        <Metric label="Played" value={stats.totals.played} />
        <Metric label="Solved" value={stats.totals.solved} />
        <Metric label="Win rate" value={`${winRate}%`} />
        <Metric label="Archive solved" value={stats.archive.solvedDates.length} />
      </div>
    </section>
  );
}

function AchievementShelf({ stats }: { stats: ReturnType<typeof useCipherwordGame>["stats"] }) {
  const shown = cipherwordAchievements.slice(0, 3);

  return (
    <section className="cipherword-achievement-shelf" aria-label="Cipher achievements">
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
              <span>{unlocked ? "Unlocked · 1/1" : `${achievement.condition} · 0/1`}</span>
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

function HowToPlayModal({ onClose }: { onClose: () => void }) {
  return (
    <m.div
      className="cipherword-modal-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <m.div
        className="cipherword-result-modal cipherword-howto-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cipherword-howto-title"
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.98 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
      >
        <button
          className="cipherword-modal-close"
          type="button"
          aria-label="Close how to play"
          onClick={onClose}
        >
          <X aria-hidden="true" />
        </button>
        <p>How it works</p>
        <h2 id="cipherword-howto-title">Solve by meaning, then letters.</h2>
        <span>Find the hidden word in 7 guesses. Press Enter to submit.</span>
        <div className="cipherword-howto-steps">
          <article>
            <strong>1. Guess any related word.</strong>
            <span>Your first guess can be broad. Use the clue category to pick a lane.</span>
          </article>
          <article>
            <strong>2. Read the meaning score.</strong>
            <span>0 means unrelated. 100 means the exact answer.</span>
          </article>
          <article>
            <strong>3. Use exact-length guesses.</strong>
            <span>Guesses with the right number of letters reveal tile clues.</span>
          </article>
        </div>
      </m.div>
    </m.div>
  );
}

function SolveReplay({ result }: { result: CipherwordRoundResult }) {
  return (
    <section className="cipherword-replay" aria-label="Solve replay">
      <div className="cipherword-panel-heading">
        <History aria-hidden="true" />
        <h3>Guess path</h3>
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
        <Link className="primary-action" href={"/games/cipher?mode=unlimited" as Route}>
          Play Unlimited
        </Link>
        <Link className="secondary-action" href={"/games/cipher/archive" as Route}>
          Open Archive
        </Link>
      </div>
    </section>
  );
}

const modeDescriptions: Record<CipherwordMode, string> = {
  daily: "One puzzle per day. Progress and streaks are saved.",
  archive: "Replay past daily puzzles without future spoilers.",
  unlimited: "Practice endlessly. No streak impact.",
  hard: "Fewer guesses, delayed category, and hidden scores.",
  zen: "No timer, no streak pressure, and unlimited guesses.",
};

function getRoundStatusLabel(status: string) {
  if (status === "won") return "Solved";
  if (status === "lost") return "Out of guesses";
  if (status === "unavailable") return "Needs extension";
  return "In progress";
}

function getFriendlyCategory(category: string, answer: string) {
  if (normalizeAnswer(answer) === "cipher") return "Codes";

  const labels: Record<string, string> = {
    culture: "Culture",
    design: "Design",
    finance: "Finance",
    history: "History",
    language: "Language & codes",
    nature: "Nature",
    science: "Science",
    strategy: "Strategy",
    technology: "Technology",
  };

  return labels[category] ?? category;
}

function getInputPlaceholder({
  answerLength,
  categoryLabel,
  categoryHidden,
  isComplete,
  guessCount,
}: {
  answerLength: number;
  categoryLabel: string;
  categoryHidden: boolean;
  isComplete: boolean;
  guessCount: number;
}) {
  if (isComplete) return "Round complete";
  if (guessCount >= 2) return `Try a ${answerLength}-letter solve...`;
  if (categoryHidden) return `Guess a related ${answerLength}-letter word...`;
  return `Guess a word connected to ${categoryLabel.toLowerCase()}...`;
}

function getInputHelper(guessCount: number, answerLength: number) {
  if (guessCount === 0) {
    return `Find the ${answerLength}-letter hidden word. Related guesses score by meaning.`;
  }

  if (guessCount >= 2) {
    return `Now try a ${answerLength}-letter solve. Guesses are final.`;
  }

  return `Try related words first. ${answerLength}-letter guesses reveal letter clues.`;
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
