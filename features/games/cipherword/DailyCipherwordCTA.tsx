"use client";

import type { Route } from "next";
import Link from "next/link";
import { CalendarDays, Flame, Sparkles } from "lucide-react";
import { m, useReducedMotion } from "motion/react";
import { useEffect, useMemo, useState } from "react";

import { getCanonicalCipherwordDate } from "./dailyAnswers";
import { cipherwordStatsStorageKey, parseCipherwordStats } from "./stats";

type DailyCipherwordCTAVariant = "card" | "compact" | "banner";

export function DailyCipherwordCTA({ variant = "card" }: { variant?: DailyCipherwordCTAVariant }) {
  const shouldReduceMotion = useReducedMotion();
  const todayKey = useMemo(() => getCanonicalCipherwordDate(), []);
  const [solved, setSolved] = useState(false);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      try {
        const stats = parseCipherwordStats(window.localStorage.getItem(cipherwordStatsStorageKey));
        setSolved(stats.daily.solvedDates.includes(todayKey));
        setStreak(stats.daily.currentStreak);
      } catch {
        setSolved(false);
      }
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [todayKey]);

  const status = solved ? "Solved today" : "Daily unsolved";
  const action = solved ? "Play Unlimited" : "Play";
  const href = solved ? "/games/cipherword?mode=unlimited" : "/games/cipherword";

  return (
    <m.article
      className={`cipherword-cta ${variant}`}
      initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={shouldReduceMotion ? undefined : { y: -2 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
    >
      <span className="cipherword-cta-icon" aria-hidden="true">
        <Sparkles />
      </span>
      <span className="cipherword-cta-copy">
        <strong>Daily Cipherword</strong>
        <span>{status}</span>
      </span>
      <span className="cipherword-cta-meta" aria-label={`Current streak ${streak}`}>
        <Flame aria-hidden="true" />
        {streak}
      </span>
      <Link className="cipherword-cta-action" href={href as Route}>
        {action}
      </Link>
      <Link className="cipherword-cta-archive" href={"/games/cipherword/archive" as Route}>
        <CalendarDays aria-hidden="true" />
        Archive
      </Link>
    </m.article>
  );
}
