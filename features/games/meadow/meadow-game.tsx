"use client";

import {
  Coins,
  Egg,
  Flag,
  MapPin,
  Package,
  Pause,
  Play,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  Sprout,
  Timer,
  Trophy,
  Users,
  Wheat,
  type LucideIcon,
} from "lucide-react";
import { m } from "motion/react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef } from "react";
import type { CSSProperties } from "react";

import { useGameProgression } from "@/features/games/use-game-progression";

import {
  computeMeadowScore,
  formatMeadowClock,
  getSpawnDistance,
  inventoryUsed,
  isMeadowStabilized,
  isSpawnLive,
  meadowClaimRange,
  meadowStorageCap,
  pressureLabel,
  type MeadowAction,
  type MeadowItemId,
  type MeadowObjective,
  type MeadowSpawn,
  type MeadowStatus,
} from "./meadow-engine";
import { useMeadowGame } from "./use-meadow-game";

type MeadowGameProps = {
  menuOpen?: boolean;
};

const keyboardActions: Record<string, MeadowAction> = {
  Digit1: { type: "build-coop" },
  Digit2: { type: "buy-feed" },
  Digit3: { type: "buy-chicken" },
  Digit4: { type: "plant-wheat" },
  KeyH: { type: "harvest-wheat" },
  KeyS: { type: "sell-goods" },
  KeyM: { type: "move-runner", spawnId: "rare-feed" },
  KeyC: { type: "claim-spawn", spawnId: "rare-feed" },
  KeyG: { type: "drive-off-rival" },
};

export function MeadowGame({ menuOpen = false }: MeadowGameProps) {
  const { actions, objectives, runResult, state, stateRef } = useMeadowGame();
  const { levelProgress, progression, recordMeadowRun } = useGameProgression();
  const animationRef = useRef<number | null>(null);
  const lastFrameRef = useRef(0);
  const reportedRunRef = useRef<string | null>(null);
  const activeObjective = useMemo(
    () => objectives.find((objective) => objective.state === "active") ?? objectives[0],
    [objectives],
  );
  const completedObjectiveCount = objectives.filter((objective) => objective.state === "complete").length;
  const storageUsed = inventoryUsed(state.inventory);
  const statusLabel = getStatusLabel(state.status);
  const rareFeed = state.spawns.find((spawn) => spawn.id === "rare-feed") ?? state.spawns[0];
  const canBankRun = isMeadowStabilized(state);
  const score = computeMeadowScore(state);

  const dispatch = useCallback(
    (action: MeadowAction) => {
      actions.dispatch(action);
    },
    [actions],
  );

  useEffect(() => {
    if (menuOpen && stateRef.current.status === "playing") {
      actions.togglePlay();
    }
  }, [actions, menuOpen, stateRef]);

  useEffect(() => {
    const handleKeyboard = (event: KeyboardEvent) => {
      if (event.defaultPrevented || shouldIgnoreShortcut(event.target)) {
        return;
      }

      if (event.code === "Space") {
        event.preventDefault();
        actions.togglePlay();
        return;
      }

      if (event.code === "KeyR") {
        event.preventDefault();
        actions.restart();
        return;
      }

      const action = keyboardActions[event.code];
      if (action) {
        event.preventDefault();
        dispatch(action);
      }
    };

    window.addEventListener("keydown", handleKeyboard);

    return () => window.removeEventListener("keydown", handleKeyboard);
  }, [actions, dispatch]);

  useEffect(() => {
    const paint = (timestamp: number) => {
      if (!lastFrameRef.current) {
        lastFrameRef.current = timestamp;
      }

      const deltaMs = timestamp - lastFrameRef.current;
      lastFrameRef.current = timestamp;

      if (stateRef.current.status === "playing") {
        actions.advanceFrame(deltaMs);
      }

      animationRef.current = window.requestAnimationFrame(paint);
    };

    animationRef.current = window.requestAnimationFrame(paint);

    return () => {
      if (animationRef.current !== null) {
        window.cancelAnimationFrame(animationRef.current);
      }
    };
  }, [actions, stateRef]);

  useEffect(() => {
    if (state.status !== "complete") {
      reportedRunRef.current = null;
      return;
    }

    const runKey = `${runResult.score}:${runResult.elapsedMs}:${runResult.cash}:${runResult.claimedSpawns}:${runResult.maxTier}`;
    if (reportedRunRef.current === runKey) {
      return;
    }

    reportedRunRef.current = runKey;
    recordMeadowRun(runResult);
  }, [recordMeadowRun, runResult, state.status]);

  return (
    <section className={`meadow-game status-${state.status}`} aria-label="Meadow game">
      <header className="meadow-toolbar">
        <div className="meadow-title-block">
          <Link className="snake-back-link meadow-back-link" href="/">
            <span aria-hidden="true">←</span> Games
          </Link>
          <div>
            <h2>Meadow</h2>
            <span>Build the outpost. Race the scarce spawns. Bank the land rush.</span>
          </div>
        </div>
        <div className="meadow-header-stats" aria-label="Meadow run state">
          <span>Tier {state.tier}</span>
          <span className={`meadow-status-chip status-${state.status}`} aria-live="polite">
            {statusLabel}
          </span>
          <span>${state.cash}</span>
        </div>
      </header>

      <span id="meadow-board-instructions" className="sr-only">
        Start or pause with Space. Use number keys for outpost actions, M to move to Rare Feed, C to
        claim Rare Feed, S to sell goods, and R to restart.
      </span>

      <div className="meadow-game-shell">
        <div
          className="meadow-board-shell"
          role="application"
          tabIndex={0}
          aria-describedby="meadow-board-instructions"
          aria-label={`Meadow board. ${statusLabel}. Cash ${state.cash}. Tier ${state.tier}. Score ${score}.`}
        >
          <div className="meadow-board-sky" aria-hidden="true" />
          <div className="meadow-region-board">
            <span className="meadow-board-label top-left">Shared outpost</span>
            <span className="meadow-board-label bottom-right">Meadow region</span>
            <OutpostMarker />
            <RunnerMarker x={state.runner.x} y={state.runner.y} status={state.runner.status} />
            {state.spawns.map((spawn) => (
              <SpawnMarker key={spawn.id} spawn={spawn} state={state} onMove={dispatch} onClaim={dispatch} />
            ))}
            <RivalMarker pressure={state.pressure} />
          </div>
          {state.status !== "playing" ? (
            <m.div
              className="meadow-state-overlay"
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
            >
              <span>{state.status === "complete" ? "Run banked" : "Land-rush production"}</span>
              <strong>{state.status === "complete" ? "Meadow stabilized." : "Start the outpost shift."}</strong>
              <p>
                {state.status === "complete"
                  ? `Final influence ${runResult.score.toLocaleString()}. Progress has been saved to DWL Accounts sync.`
                  : "Build Coop, buy Feed and Chicken, produce Eggs, claim Rare Feed, then sell goods."}
              </p>
              <button className="primary-action" type="button" onClick={actions.togglePlay}>
                {state.status === "complete" ? <RotateCcw aria-hidden="true" /> : <Play aria-hidden="true" />}
                <span>{state.status === "complete" ? "New run" : "Start Meadow"}</span>
                <kbd>Space</kbd>
              </button>
            </m.div>
          ) : null}
        </div>

        <aside className="meadow-side-panel" aria-label="Meadow controls and stats">
          <section className="meadow-run-summary" aria-label="Current Meadow run">
            <div>
              <span>Influence</span>
              <strong>{score.toLocaleString()}</strong>
            </div>
            <div className="meadow-run-summary-meta">
              <span>{formatMeadowClock(state.elapsedMs)}</span>
              <span>{completedObjectiveCount}/{objectives.length} objectives</span>
              <span>{pressureLabel(state.pressure)}</span>
            </div>
          </section>

          <section className="meadow-objective-panel" aria-label="Current objective">
            <span>Current objective</span>
            <strong>{activeObjective?.label ?? "Read the board"}</strong>
            <p>{activeObjective?.detail ?? "Use the outpost controls to start the run."}</p>
          </section>

          <div className="meadow-metric-grid" aria-label="Meadow resources">
            <MeadowMetric Icon={Coins} label="Cash" value={`$${state.cash}`} />
            <MeadowMetric Icon={Package} label="Feed" value={String(state.inventory.feed)} />
            <MeadowMetric Icon={Egg} label="Eggs" value={String(state.inventory.eggs)} />
            <MeadowMetric Icon={Wheat} label="Wheat" value={String(state.inventory.wheat)} />
            <MeadowMetric Icon={Users} label="Roster" value={`${state.tier}/4`} />
            <MeadowMetric Icon={ShieldAlert} label="Pressure" value={`${Math.round(state.pressure)}%`} />
          </div>

          <section className="meadow-action-panel" aria-label="Outpost actions">
            <div className="meadow-panel-heading">
              <span>Outpost</span>
              <small>
                Storage {storageUsed}/{meadowStorageCap}
              </small>
            </div>
            <div className="meadow-action-grid">
              <ActionButton label="Build Coop" shortcut="1" onClick={() => dispatch({ type: "build-coop" })} />
              <ActionButton label="Buy Feed" shortcut="2" onClick={() => dispatch({ type: "buy-feed" })} />
              <ActionButton label="Buy Chicken" shortcut="3" onClick={() => dispatch({ type: "buy-chicken" })} />
              <ActionButton label="Plant Wheat" shortcut="4" onClick={() => dispatch({ type: "plant-wheat" })} />
              <ActionButton label="Harvest Wheat" shortcut="H" onClick={() => dispatch({ type: "harvest-wheat" })} />
              <ActionButton label="Sell Goods" shortcut="S" onClick={() => dispatch({ type: "sell-goods" })} />
            </div>
          </section>

          <section className="meadow-action-panel" aria-label="Runner actions">
            <div className="meadow-panel-heading">
              <span>Runner</span>
              <small>
                Claim range {meadowClaimRange}u
              </small>
            </div>
            <div className="meadow-action-grid">
              <ActionButton
                label="Move Rare Feed"
                shortcut="M"
                onClick={() => rareFeed && dispatch({ type: "move-runner", spawnId: rareFeed.id })}
              />
              <ActionButton
                label="Claim Rare Feed"
                shortcut="C"
                onClick={() => rareFeed && dispatch({ type: "claim-spawn", spawnId: rareFeed.id })}
              />
              <ActionButton label="Add Helper" onClick={() => dispatch({ type: "invite-helper" })} />
              <ActionButton label="Guard Outpost" shortcut="G" onClick={() => dispatch({ type: "drive-off-rival" })} />
            </div>
          </section>

          <section className="meadow-objectives-list" aria-label="Meadow objectives">
            {objectives.map((objective) => (
              <ObjectiveRow key={objective.id} objective={objective} />
            ))}
          </section>

          <ProgressionPanel
            level={progression.level}
            nextLevelProgress={`${levelProgress.earnedThisLevel}/${levelProgress.neededThisLevel}`}
            totalXp={progression.totalXp}
            unlockedCount={Object.keys(progression.achievements).length}
          />

          <div className="meadow-run-actions">
            <button className="primary-action" type="button" onClick={actions.togglePlay}>
              {state.status === "playing" ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
              <span>{state.status === "playing" ? "Pause" : "Start"}</span>
              <kbd>Space</kbd>
            </button>
            <button className="secondary-action" type="button" onClick={actions.restart}>
              <RotateCcw aria-hidden="true" />
              <span>Restart</span>
              <kbd>R</kbd>
            </button>
            <button
              className="secondary-action bank-action"
              disabled={!canBankRun}
              type="button"
              onClick={() => dispatch({ type: "bank-run" })}
            >
              <Flag aria-hidden="true" />
              <span>Bank Run</span>
            </button>
          </div>
        </aside>
      </div>

      <section className="meadow-activity-log" aria-label="Meadow signal log">
        {state.activity.map((event) => (
          <span key={event.id} className={`tone-${event.tone}`}>
            <small>{formatMeadowClock(event.atMs)}</small>
            {event.text}
          </span>
        ))}
      </section>

      <p className="sr-only" aria-live="polite">
        Meadow status: {statusLabel}. Cash {state.cash}. Tier {state.tier}. Score {score}. Current
        objective {activeObjective?.label ?? "none"}.
      </p>
    </section>
  );
}

function OutpostMarker() {
  return (
    <span className="meadow-outpost-marker" aria-hidden="true">
      <i />
      <b />
      <em />
    </span>
  );
}

function RunnerMarker({ status, x, y }: { status: string; x: number; y: number }) {
  return (
    <span
      className={`meadow-runner-marker status-${status}`}
      style={markerStyle(x, y)}
      aria-hidden="true"
    >
      <MapPin />
    </span>
  );
}

function SpawnMarker({
  onClaim,
  onMove,
  spawn,
  state,
}: {
  onClaim: (action: MeadowAction) => void;
  onMove: (action: MeadowAction) => void;
  spawn: MeadowSpawn;
  state: ReturnType<typeof useMeadowGame>["state"];
}) {
  const live = isSpawnLive(state, spawn);
  const distance = getSpawnDistance(state, spawn);
  const inRange = live && distance <= meadowClaimRange;

  return (
    <span
      className={`meadow-spawn-marker spawn-${spawn.type} ${live ? "live" : "respawning"} ${
        inRange ? "in-range" : ""
      }`}
      style={markerStyle(spawn.x, spawn.y)}
    >
      <button
        type="button"
        aria-label={`${inRange ? "Claim" : "Move to"} ${spawnName(spawn)}`}
        onClick={() =>
          inRange ? onClaim({ type: "claim-spawn", spawnId: spawn.id }) : onMove({ type: "move-runner", spawnId: spawn.id })
        }
      >
        <span>{spawnName(spawn)}</span>
        <small>{live ? `${distance.toFixed(1)}u` : "Respawn"}</small>
      </button>
    </span>
  );
}

function RivalMarker({ pressure }: { pressure: number }) {
  return (
    <span
      className={`meadow-rival-marker ${pressure >= 70 ? "danger" : ""}`}
      style={markerStyle(84, 25)}
      aria-hidden="true"
    >
      <ShieldAlert />
    </span>
  );
}

function MeadowMetric({
  Icon,
  label,
  value,
}: {
  Icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="meadow-metric">
      <span>
        <Icon aria-hidden="true" />
        {label}
      </span>
      <strong>{value}</strong>
    </div>
  );
}

function ActionButton({
  label,
  onClick,
  shortcut,
}: {
  label: string;
  onClick: () => void;
  shortcut?: string;
}) {
  return (
    <button className="meadow-action-button" type="button" onClick={onClick}>
      <span>{label}</span>
      {shortcut ? <kbd>{shortcut}</kbd> : null}
    </button>
  );
}

function ObjectiveRow({ objective }: { objective: MeadowObjective }) {
  return (
    <article className={`meadow-objective-row state-${objective.state}`}>
      <span>
        {objective.state === "complete" ? <Trophy aria-hidden="true" /> : <Timer aria-hidden="true" />}
      </span>
      <div>
        <strong>{objective.label}</strong>
        <small>{objective.detail}</small>
      </div>
    </article>
  );
}

function ProgressionPanel({
  level,
  nextLevelProgress,
  totalXp,
  unlockedCount,
}: {
  level: number;
  nextLevelProgress: string;
  totalXp: number;
  unlockedCount: number;
}) {
  return (
    <section className="snake-progression-panel meadow-progression-panel" aria-label="Account progression">
      <div>
        <span>
          <Sparkles aria-hidden="true" />
          Level {level}
        </span>
        <strong>{totalXp.toLocaleString()} XP</strong>
      </div>
      <div>
        <span>
          <Trophy aria-hidden="true" />
          Achievements
        </span>
        <strong>{unlockedCount}</strong>
      </div>
      <small>Next level {nextLevelProgress}</small>
    </section>
  );
}

function markerStyle(x: number, y: number): CSSProperties {
  return {
    left: `${x}%`,
    top: `${y}%`,
  };
}

function spawnName(spawn: MeadowSpawn) {
  if (spawn.type === "rare-feed") {
    return "Rare Feed";
  }

  if (spawn.type === "scrap") {
    return "Scrap Cache";
  }

  return "Parts Drop";
}

function getStatusLabel(status: MeadowStatus) {
  if (status === "playing") {
    return "Playing";
  }

  if (status === "paused") {
    return "Paused";
  }

  if (status === "complete") {
    return "Banked";
  }

  return "Ready";
}

function shouldIgnoreShortcut(target: EventTarget | null) {
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    (target instanceof HTMLElement && target.isContentEditable)
  );
}
