"use client";

import type { Route } from "next";
import Link from "next/link";
import { CalendarDays, Flame } from "lucide-react";
import { m, useReducedMotion } from "motion/react";
import { useEffect, useMemo, useState } from "react";

import { getCanonicalCipherwordDate, getCipherwordDailyIndex } from "./daily-answers";
import {
  cipherwordStatsStorageKey,
  legacyCipherwordStatsStorageKey,
  parseCipherwordStats,
} from "./stats";

type DailyCipherwordCTAVariant = "card" | "compact" | "banner";

export function DailyCipherwordCTA({ variant = "card" }: { variant?: DailyCipherwordCTAVariant }) {
  const shouldReduceMotion = useReducedMotion();
  const todayKey = useMemo(() => getCanonicalCipherwordDate(), []);
  const dailyNumber = useMemo(() => getCipherwordDailyIndex(todayKey) + 1, [todayKey]);
  const [solved, setSolved] = useState(false);
  const [streak, setStreak] = useState(0);
  const [guessCount, setGuessCount] = useState(0);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      try {
        const stats = parseCipherwordStats(
          window.localStorage.getItem(cipherwordStatsStorageKey) ??
            window.localStorage.getItem(legacyCipherwordStatsStorageKey),
        );
        const rawProgress =
          window.localStorage.getItem(`games:cipherword-progress:v1:daily:${todayKey}`) ??
          window.localStorage.getItem(`dylan-games:cipherword-progress:v1:daily:${todayKey}`);
        const progress = rawProgress ? (JSON.parse(rawProgress) as unknown) : [];

        setSolved(stats.daily.solvedDates.includes(todayKey));
        setStreak(stats.daily.currentStreak);
        setGuessCount(
          Array.isArray(progress)
            ? progress.filter((guess) => typeof guess === "string").slice(0, 7).length
            : 0,
        );
      } catch {
        setSolved(false);
        setGuessCount(0);
      }
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [todayKey]);

  const status = solved ? "Solved" : guessCount ? "In progress" : "Unsolved";
  const statusLine = solved
    ? "Solved today"
    : guessCount
      ? `${guessCount}/7 guesses used`
      : "Today's puzzle not solved";
  const action = solved ? "Play Unlimited" : "Play";
  const href = solved ? "/games/cipher?mode=unlimited" : "/games/cipher";

  return (
    <m.article
      className={`cipherword-cta ${variant}`}
      initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={shouldReduceMotion ? undefined : { y: -2 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
    >
      <span className="cipherword-cta-icon" aria-hidden="true">
        <span>C</span>
        <span>I</span>
        <span>P</span>
      </span>
      <span className="cipherword-cta-copy">
        <strong>Daily Cipher</strong>
        <span>{statusLine}</span>
      </span>
      <span className="cipherword-cta-details">
        <span>Daily #{String(dailyNumber).padStart(3, "0")}</span>
        <span
          className={`cipherword-cta-badge ${solved ? "solved" : guessCount ? "progress" : ""}`}
        >
          {status}
        </span>
      </span>
      {streak > 0 ? (
        <span className="cipherword-cta-meta" aria-label={`Current streak ${streak}`}>
          <Flame aria-hidden="true" />
          Streak {streak}
        </span>
      ) : null}
      <Link className="cipherword-cta-action" href={href as Route}>
        {action}
      </Link>
      <Link className="cipherword-cta-archive" href={"/games/cipher/archive" as Route}>
        <CalendarDays aria-hidden="true" />
        Archive
      </Link>
    </m.article>
  );
}
