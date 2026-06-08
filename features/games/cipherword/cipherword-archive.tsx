"use client";

import type { Route } from "next";
import Link from "next/link";
import { ArrowLeft, CalendarDays, ChevronLeft, ChevronRight, Shuffle } from "lucide-react";
import { m, useReducedMotion } from "motion/react";
import { useEffect, useMemo, useState } from "react";

import {
  CIPHERWORD_DAILY_END_DATE,
  CIPHERWORD_DAILY_START_DATE,
  getCanonicalCipherwordDate,
  getCipherwordArchiveEntry,
  isoDateFromUtcOrdinal,
  utcOrdinalFromIsoDate,
} from "./daily-answers";
import { cipherwordStatsStorageKey, parseCipherwordStats } from "./stats";

export function CipherwordArchive() {
  const shouldReduceMotion = useReducedMotion();
  const todayKey = useMemo(() => getCanonicalCipherwordDate(), []);
  const [cursorMonth, setCursorMonth] = useState(todayKey.slice(0, 7));
  const [solvedDates, setSolvedDates] = useState<string[]>([]);
  const entries = useMemo(() => getMonthEntries(cursorMonth), [cursorMonth]);
  const available = entries.filter((entry) => entry.status !== "locked");
  const solvedInMonth = available.filter((entry) => solvedDates.includes(entry.date)).length;
  const progress = available.length ? Math.round((solvedInMonth / available.length) * 100) : 0;
  const randomUnsolved =
    available.find((entry) => !solvedDates.includes(entry.date)) ?? available[available.length - 1];

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      try {
        const stats = parseCipherwordStats(window.localStorage.getItem(cipherwordStatsStorageKey));
        setSolvedDates([...stats.daily.solvedDates, ...stats.archive.solvedDates]);
      } catch {
        setSolvedDates([]);
      }
    }, 0);

    return () => window.clearTimeout(timeout);
  }, []);

  const goToToday = () => setCursorMonth(todayKey.slice(0, 7));
  const moveMonth = (delta: number) => {
    const [year, month] = cursorMonth.split("-").map(Number);
    const next = new Date(Date.UTC(year, month - 1 + delta, 1));
    const nextMonth = next.toISOString().slice(0, 7);

    if (
      nextMonth >= CIPHERWORD_DAILY_START_DATE.slice(0, 7) &&
      nextMonth <= CIPHERWORD_DAILY_END_DATE.slice(0, 7)
    ) {
      setCursorMonth(nextMonth);
    }
  };

  return (
    <main className="cipherword-archive-page">
      <m.section
        className="cipherword-archive-hero"
        initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.24, ease: "easeOut" }}
      >
        <Link className="secondary-action" href={"/games/cipher" as Route}>
          <ArrowLeft aria-hidden="true" />
          Back to Cipher
        </Link>
        <div>
          <p>Archive</p>
          <h1>Cipher Archive</h1>
          <span>Past and today are playable. Future cells stay locked and spoiler-free.</span>
        </div>
        <div className="cipherword-archive-actions">
          <button type="button" className="secondary-action" onClick={goToToday}>
            <CalendarDays aria-hidden="true" />
            Jump to today
          </button>
          {randomUnsolved ? (
            <Link
              className="primary-action"
              href={`/games/cipher?mode=archive&date=${randomUnsolved.date}` as Route}
            >
              <Shuffle aria-hidden="true" />
              Random unsolved
            </Link>
          ) : null}
        </div>
      </m.section>

      <section className="cipherword-archive-panel" aria-label="Cipher archive calendar">
        <div className="cipherword-archive-monthbar">
          <button type="button" className="secondary-action" onClick={() => moveMonth(-1)}>
            <ChevronLeft aria-hidden="true" />
            Previous
          </button>
          <div>
            <strong>{formatMonth(cursorMonth)}</strong>
            <span>{progress}% complete</span>
          </div>
          <button type="button" className="secondary-action" onClick={() => moveMonth(1)}>
            Next
            <ChevronRight aria-hidden="true" />
          </button>
        </div>

        <div className="cipherword-archive-legend" aria-label="Archive status legend">
          <span className="solved">Solved</span>
          <span className="unsolved">Unsolved</span>
          <span className="missed">Missed</span>
          <span className="locked">Locked</span>
        </div>

        <div className="cipherword-archive-grid" aria-label={`${formatMonth(cursorMonth)} puzzles`}>
          {entries.map((entry) => {
            const solved = solvedDates.includes(entry.date);
            const status = solved
              ? "solved"
              : entry.status === "locked"
                ? "locked"
                : entry.status === "today"
                  ? "unsolved"
                  : "missed";
            const label = `${entry.date} ${status}`;

            if (entry.status === "locked") {
              return (
                <span
                  key={entry.date}
                  className={`cipherword-archive-cell ${status}`}
                  aria-label={label}
                >
                  <strong>{entry.date.slice(-2)}</strong>
                  <small>Locked</small>
                </span>
              );
            }

            return (
              <Link
                key={entry.date}
                className={`cipherword-archive-cell ${status}`}
                href={`/games/cipher?mode=archive&date=${entry.date}` as Route}
                aria-label={`Play Cipher archive ${label}`}
              >
                <strong>{entry.date.slice(-2)}</strong>
                <small>{solved ? "Solved" : entry.status === "today" ? "Today" : "Open"}</small>
              </Link>
            );
          })}
        </div>
      </section>
    </main>
  );
}

function getMonthEntries(month: string) {
  const [year, monthIndex] = month.split("-").map(Number);
  const firstOrdinal = utcOrdinalFromIsoDate(`${month}-01`);
  const daysInMonth = new Date(Date.UTC(year, monthIndex, 0)).getUTCDate();
  const today = new Date();

  return Array.from({ length: daysInMonth }, (_, offset) => {
    const date = isoDateFromUtcOrdinal(firstOrdinal + offset);

    if (date < CIPHERWORD_DAILY_START_DATE || date > CIPHERWORD_DAILY_END_DATE) {
      return null;
    }

    return getCipherwordArchiveEntry(date, today, false);
  }).filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));
}

function formatMonth(month: string) {
  const [year, monthIndex] = month.split("-").map(Number);

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    timeZone: "UTC",
    year: "numeric",
  }).format(new Date(Date.UTC(year, monthIndex - 1, 1)));
}
