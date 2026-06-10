import { describe, expect, it } from "vitest";

import {
  advanceMeadow,
  applyMeadowAction,
  createInitialMeadowState,
  getMeadowObjectives,
  getMeadowRunResult,
  isMeadowStabilized,
} from "./meadow-engine";

describe("meadow engine", () => {
  it("runs the core outpost, rare feed, market, and bank loop", () => {
    let state = createInitialMeadowState();

    state = applyMeadowAction(state, { type: "build-coop" });
    state = applyMeadowAction(state, { type: "buy-feed" });
    state = applyMeadowAction(state, { type: "buy-chicken" });
    for (let index = 0; index < 9; index += 1) {
      state = advanceMeadow(state, 1_000);
    }

    expect(state.inventory.eggs).toBe(1);
    expect(state.inventory.feed).toBe(9);
    expect(getMeadowObjectives(state).find((objective) => objective.id === "first-eggs")?.state).toBe(
      "complete",
    );

    state = applyMeadowAction(state, { type: "move-runner", spawnId: "rare-feed" });
    for (let index = 0; index < 3; index += 1) {
      state = advanceMeadow(state, 1_000);
    }
    state = applyMeadowAction(state, { type: "claim-spawn", spawnId: "rare-feed" });

    expect(state.inventory.feed).toBeGreaterThanOrEqual(27);
    expect(getMeadowObjectives(state).find((objective) => objective.id === "rare-feed")?.state).toBe(
      "complete",
    );

    state = applyMeadowAction(state, { type: "sell-goods" });

    expect(getMeadowObjectives(state).find((objective) => objective.id === "market-sale")?.state).toBe(
      "complete",
    );
    expect(isMeadowStabilized(state)).toBe(true);

    state = applyMeadowAction(state, { type: "bank-run" });

    expect(state.status).toBe("complete");
    expect(getMeadowRunResult(state).score).toBeGreaterThan(0);
  });

  it("permanently raises co-op tier when helpers join", () => {
    let state = createInitialMeadowState();

    state = applyMeadowAction(state, { type: "invite-helper" });
    state = applyMeadowAction(state, { type: "invite-helper" });

    expect(state.tier).toBe(3);
    expect(state.helpers.map((helper) => helper.name)).toEqual(["Maya", "Leo"]);
    expect(getMeadowObjectives(state).find((objective) => objective.id === "helper-tier")?.state).toBe(
      "complete",
    );
  });
});
