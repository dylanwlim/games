export type MeadowStatus = "ready" | "playing" | "paused" | "complete";

export type MeadowItemId = "feed" | "eggs" | "wheat" | "scrap" | "parts";

export type MeadowSpawnType = "rare-feed" | "scrap" | "parts";

export type MeadowTone = "info" | "success" | "warning";

export type MeadowObjectiveId =
  | "outpost-online"
  | "first-eggs"
  | "rare-feed"
  | "market-sale"
  | "helper-tier";

export type MeadowPoint = {
  x: number;
  y: number;
};

export type MeadowInventory = Record<MeadowItemId, number>;

export type MeadowCrop = {
  id: string;
  plantedAtMs: number;
  qty: number;
  readyAtMs: number;
};

export type MeadowSpawn = MeadowPoint & {
  claimedAtMs: number | null;
  id: string;
  loot: {
    itemId: MeadowItemId;
    qty: number;
  };
  nextSpawnAtMs: number;
  type: MeadowSpawnType;
};

export type MeadowRunner = MeadowPoint & {
  status: "idle" | "moving" | "arrived" | "stopped";
  targetSpawnId: string | null;
};

export type MeadowHelper = {
  id: string;
  joinedAtMs: number;
  name: string;
  role: "Runner" | "Guard" | "Reserve";
};

export type MeadowEvent = {
  id: string;
  atMs: number;
  text: string;
  tone: MeadowTone;
};

export type MeadowState = {
  activity: MeadowEvent[];
  cash: number;
  chickens: number;
  completedObjectiveIds: MeadowObjectiveId[];
  coopBuilt: boolean;
  crops: MeadowCrop[];
  elapsedMs: number;
  eventCounter: number;
  finalScore: number | null;
  helpers: MeadowHelper[];
  inventory: MeadowInventory;
  pressure: number;
  productionRemainderMs: number;
  runner: MeadowRunner;
  spawns: MeadowSpawn[];
  status: MeadowStatus;
  tier: 1 | 2 | 3 | 4;
  version: 1;
};

export type MeadowAction =
  | { type: "build-coop" }
  | { type: "buy-feed" }
  | { type: "buy-chicken" }
  | { type: "plant-wheat" }
  | { type: "harvest-wheat" }
  | { type: "sell-goods" }
  | { type: "move-runner"; spawnId: string }
  | { type: "stop-runner" }
  | { type: "claim-spawn"; spawnId: string }
  | { type: "invite-helper" }
  | { type: "drive-off-rival" }
  | { type: "bank-run" };

export type MeadowObjective = {
  detail: string;
  id: MeadowObjectiveId;
  label: string;
  state: "complete" | "active" | "blocked" | "upcoming";
};

export type MeadowRunResult = {
  cash: number;
  claimedSpawns: number;
  elapsedMs: number;
  maxTier: number;
  objectivesCompleted: number;
  score: number;
};

export const meadowClaimRange = 8;
export const meadowStorageCap = 80;
export const meadowRegionSize = 100;

const startingCash = 85;
const coopCost = 30;
const feedBundleQty = 10;
const feedBundleBaseCost = 20;
const chickenBaseCost = 15;
const wheatBundleQty = 3;
const wheatBundleBaseCost = 3;
const wheatGrowMs = 24_000;
const eggCycleMs = 8_000;
const runnerSpeedPerSecond = 24;
const baseSpawnRespawnMs = 42_000;
const helperNames = ["Maya", "Leo", "Ari"] as const;

const sellPrices = {
  feed: 1,
  eggs: 5,
  wheat: 3,
  scrap: 14,
  parts: 25,
} satisfies Record<MeadowItemId, number>;

const pressureMultiplierByTier = {
  1: 1,
  2: 1.25,
  3: 1.55,
  4: 1.9,
} satisfies Record<MeadowState["tier"], number>;

export function createInitialMeadowState(): MeadowState {
  return {
    activity: [
      {
        id: "event-0",
        atMs: 0,
        text: "The Meadow land-rush is open. Build the coop, start egg production, and send a runner for Rare Feed.",
        tone: "info",
      },
    ],
    cash: startingCash,
    chickens: 0,
    completedObjectiveIds: [],
    coopBuilt: false,
    crops: [],
    elapsedMs: 0,
    eventCounter: 1,
    finalScore: null,
    helpers: [],
    inventory: {
      feed: 0,
      eggs: 0,
      wheat: 0,
      scrap: 0,
      parts: 0,
    },
    pressure: 16,
    productionRemainderMs: 0,
    runner: {
      x: 50,
      y: 50,
      status: "idle",
      targetSpawnId: null,
    },
    spawns: [
      {
        id: "rare-feed",
        type: "rare-feed",
        x: 20,
        y: 24,
        loot: { itemId: "feed", qty: 18 },
        nextSpawnAtMs: 0,
        claimedAtMs: null,
      },
      {
        id: "scrap-cache",
        type: "scrap",
        x: 78,
        y: 64,
        loot: { itemId: "scrap", qty: 4 },
        nextSpawnAtMs: 0,
        claimedAtMs: null,
      },
      {
        id: "parts-drop",
        type: "parts",
        x: 58,
        y: 38,
        loot: { itemId: "parts", qty: 2 },
        nextSpawnAtMs: 18_000,
        claimedAtMs: null,
      },
    ],
    status: "ready",
    tier: 1,
    version: 1,
  };
}

export function parseMeadowState(rawState: string | null): MeadowState {
  if (!rawState) {
    return createInitialMeadowState();
  }

  try {
    return normalizeMeadowState(JSON.parse(rawState));
  } catch {
    return createInitialMeadowState();
  }
}

export function startMeadow(state: MeadowState): MeadowState {
  if (state.status === "complete") {
    return createInitialMeadowState();
  }

  return addEvent(
    {
      ...state,
      status: state.status === "playing" ? "paused" : "playing",
    },
    state.status === "playing" ? "Meadow paused." : "Meadow shift started.",
    "info",
  );
}

export function restartMeadow(): MeadowState {
  return createInitialMeadowState();
}

export function advanceMeadow(state: MeadowState, deltaMs: number): MeadowState {
  if (state.status !== "playing") {
    return state;
  }

  const boundedDelta = Math.max(0, Math.min(deltaMs, 1000));
  let nextState = {
    ...state,
    elapsedMs: state.elapsedMs + boundedDelta,
  };

  nextState = moveRunner(nextState, boundedDelta);
  nextState = produceEggs(nextState, boundedDelta);
  nextState = raisePressure(nextState, boundedDelta);
  nextState = updateObjectives(nextState);

  return nextState;
}

export function applyMeadowAction(state: MeadowState, action: MeadowAction): MeadowState {
  if (action.type === "bank-run") {
    if (!isMeadowStabilized(state)) {
      return addEvent(state, "Finish the active Meadow objectives before banking the run.", "warning");
    }

    const finalScore = computeMeadowScore(state);
    return addEvent(
      {
        ...updateObjectives(state),
        finalScore,
        status: "complete",
      },
      `Meadow stabilized at ${finalScore.toLocaleString()} influence.`,
      "success",
    );
  }

  if (state.status === "complete") {
    return state;
  }

  let workingState = state.status === "ready" ? { ...state, status: "playing" as const } : state;

  if (action.type === "build-coop") {
    if (workingState.coopBuilt) {
      return addEvent(workingState, "The coop is already built.", "info");
    }

    const cost = scaledCost(coopCost, workingState.tier);
    if (workingState.cash < cost) {
      return addEvent(workingState, `Need $${cost} to build the coop.`, "warning");
    }

    workingState = addEvent(
      {
        ...workingState,
        cash: workingState.cash - cost,
        coopBuilt: true,
      },
      "Coop built. Feed and chickens can turn time into eggs.",
      "success",
    );
  }

  if (action.type === "buy-feed") {
    const cost = scaledCost(feedBundleBaseCost, workingState.tier);
    if (workingState.cash < cost) {
      return addEvent(workingState, `Need $${cost} to buy Feed x${feedBundleQty}.`, "warning");
    }

    workingState = addEvent(
      {
        ...workingState,
        cash: workingState.cash - cost,
        inventory: addInventory(workingState.inventory, "feed", feedBundleQty),
      },
      `Bought Feed x${feedBundleQty}.`,
      "success",
    );
  }

  if (action.type === "buy-chicken") {
    if (!workingState.coopBuilt) {
      return addEvent(workingState, "Build the coop before buying chickens.", "warning");
    }

    const cost = scaledCost(chickenBaseCost, workingState.tier);
    if (workingState.cash < cost) {
      return addEvent(workingState, `Need $${cost} for another chicken.`, "warning");
    }

    workingState = addEvent(
      {
        ...workingState,
        cash: workingState.cash - cost,
        chickens: workingState.chickens + 1,
      },
      "Chicken added to the shared outpost.",
      "success",
    );
  }

  if (action.type === "plant-wheat") {
    const cost = scaledCost(wheatBundleBaseCost, workingState.tier);
    if (workingState.cash < cost) {
      return addEvent(workingState, `Need $${cost} to plant Wheat x${wheatBundleQty}.`, "warning");
    }

    workingState = addEvent(
      {
        ...workingState,
        cash: workingState.cash - cost,
        crops: [
          ...workingState.crops,
          {
            id: `wheat-${workingState.eventCounter}`,
            plantedAtMs: workingState.elapsedMs,
            qty: wheatBundleQty,
            readyAtMs: workingState.elapsedMs + wheatGrowMs,
          },
        ],
      },
      "Wheat planted as a backup cash line.",
      "success",
    );
  }

  if (action.type === "harvest-wheat") {
    const readyCrops = workingState.crops.filter((crop) => crop.readyAtMs <= workingState.elapsedMs);
    const readyQty = readyCrops.reduce((total, crop) => total + crop.qty, 0);

    if (readyQty <= 0) {
      return addEvent(workingState, "No Wheat is ready yet.", "warning");
    }

    workingState = addEvent(
      {
        ...workingState,
        crops: workingState.crops.filter((crop) => crop.readyAtMs > workingState.elapsedMs),
        inventory: addInventory(workingState.inventory, "wheat", readyQty),
      },
      `Harvested Wheat x${readyQty}.`,
      "success",
    );
  }

  if (action.type === "sell-goods") {
    const saleValue =
      workingState.inventory.eggs * sellPrices.eggs +
      workingState.inventory.wheat * sellPrices.wheat +
      workingState.inventory.scrap * sellPrices.scrap +
      workingState.inventory.parts * sellPrices.parts;

    if (saleValue <= 0) {
      return addEvent(workingState, "No market goods are ready to sell.", "warning");
    }

    workingState = addEvent(
      {
        ...workingState,
        cash: workingState.cash + saleValue,
        completedObjectiveIds: addObjective(workingState.completedObjectiveIds, "market-sale"),
        inventory: {
          ...workingState.inventory,
          eggs: 0,
          parts: 0,
          scrap: 0,
          wheat: 0,
        },
      },
      `Sold goods for $${saleValue}.`,
      "success",
    );
  }

  if (action.type === "move-runner") {
    const spawn = workingState.spawns.find((candidate) => candidate.id === action.spawnId);
    if (!spawn) {
      return workingState;
    }

    workingState = addEvent(
      {
        ...workingState,
        runner: {
          ...workingState.runner,
          status: "moving",
          targetSpawnId: spawn.id,
        },
      },
      `Runner moving toward ${spawnLabel(spawn.type)}.`,
      "info",
    );
  }

  if (action.type === "stop-runner") {
    workingState = {
      ...workingState,
      runner: {
        ...workingState.runner,
        status: "stopped",
      },
    };
  }

  if (action.type === "claim-spawn") {
    workingState = claimSpawn(workingState, action.spawnId);
  }

  if (action.type === "invite-helper") {
    if (workingState.tier >= 4) {
      return addEvent(workingState, "The Meadow roster is already at Tier 4.", "warning");
    }

    const helperName = helperNames[workingState.helpers.length] ?? `Helper ${workingState.helpers.length + 1}`;
    const nextTier = normalizeTier(workingState.tier + 1);

    workingState = addEvent(
      {
        ...workingState,
        cash: workingState.cash + 25,
        completedObjectiveIds: addObjective(workingState.completedObjectiveIds, "helper-tier"),
        helpers: [
          ...workingState.helpers,
          {
            id: `helper-${helperName.toLowerCase()}`,
            joinedAtMs: workingState.elapsedMs,
            name: helperName,
            role: workingState.helpers.length === 0 ? "Runner" : "Guard",
          },
        ],
        tier: nextTier,
      },
      `${helperName} joined the roster. World difficulty is now permanently Tier ${nextTier}.`,
      "success",
    );
  }

  if (action.type === "drive-off-rival") {
    const pressureDrop = workingState.helpers.length > 0 ? 34 : 24;
    workingState = addEvent(
      {
        ...workingState,
        pressure: Math.max(0, workingState.pressure - pressureDrop),
      },
      "Guard action pushed nearby rivals back from the outpost.",
      "success",
    );
  }

  return updateObjectives(workingState);
}

export function getMeadowObjectives(state: MeadowState): MeadowObjective[] {
  const hasOutpost = state.coopBuilt && state.chickens > 0 && state.inventory.feed > 0;
  const hasFirstEgg = state.completedObjectiveIds.includes("first-eggs") || state.inventory.eggs > 0;
  const hasRareFeed = state.completedObjectiveIds.includes("rare-feed");
  const hasMarketSale = state.completedObjectiveIds.includes("market-sale");
  const hasHelper = state.completedObjectiveIds.includes("helper-tier");

  return [
    {
      id: "outpost-online",
      label: "Bring the outpost online",
      detail: hasOutpost
        ? "Coop, Feed, and Chicken are all live."
        : "Build Coop, buy Feed, then buy Chicken.",
      state: hasOutpost ? "complete" : "active",
    },
    {
      id: "first-eggs",
      label: "Produce the first Eggs",
      detail: hasFirstEgg ? "Egg production has started." : "Keep Feed stocked while the Chicken cycle runs.",
      state: hasOutpost ? (hasFirstEgg ? "complete" : "active") : "blocked",
    },
    {
      id: "rare-feed",
      label: "Claim Rare Feed",
      detail: hasRareFeed
        ? "The scarce spawn fed the shared outpost."
        : "Move the runner to Rare Feed and claim it in range.",
      state: hasFirstEgg ? (hasRareFeed ? "complete" : "active") : "upcoming",
    },
    {
      id: "market-sale",
      label: "Sell into the market",
      detail: hasMarketSale ? "Cash loop is proven." : "Sell Eggs, Wheat, Scrap, or Parts once inventory is ready.",
      state: hasFirstEgg ? (hasMarketSale ? "complete" : "active") : "upcoming",
    },
    {
      id: "helper-tier",
      label: "Escalate co-op pressure",
      detail: hasHelper
        ? `Roster raised the world to Tier ${state.tier}.`
        : "Optional: add a helper for cash and higher permanent difficulty.",
      state: hasHelper ? "complete" : "upcoming",
    },
  ];
}

export function getMeadowRunResult(state: MeadowState): MeadowRunResult {
  return {
    cash: state.cash,
    claimedSpawns: state.spawns.filter((spawn) => spawn.claimedAtMs !== null).length,
    elapsedMs: state.elapsedMs,
    maxTier: state.tier,
    objectivesCompleted: getMeadowObjectives(state).filter((objective) => objective.state === "complete")
      .length,
    score: state.finalScore ?? computeMeadowScore(state),
  };
}

export function computeMeadowScore(state: MeadowState) {
  const inventoryValue = Object.entries(state.inventory).reduce(
    (total, [itemId, qty]) => total + sellPrices[itemId as MeadowItemId] * qty,
    0,
  );
  const claimedSpawnScore = state.spawns.filter((spawn) => spawn.claimedAtMs !== null).length * 45;
  const objectiveScore =
    getMeadowObjectives(state).filter((objective) => objective.state === "complete").length * 35;

  return Math.max(
    0,
    Math.round(state.cash + inventoryValue + state.chickens * 18 + state.tier * 20 + claimedSpawnScore + objectiveScore),
  );
}

export function isMeadowStabilized(state: MeadowState) {
  const completed = new Set(getMeadowObjectives(state).filter((objective) => objective.state === "complete").map((objective) => objective.id));
  return (
    completed.has("outpost-online") &&
    completed.has("first-eggs") &&
    completed.has("rare-feed") &&
    completed.has("market-sale")
  );
}

export function formatMeadowClock(elapsedMs: number) {
  const totalSeconds = Math.floor(elapsedMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function getSpawnDistance(state: MeadowState, spawn: MeadowSpawn) {
  return distance(state.runner, spawn);
}

export function isSpawnLive(state: MeadowState, spawn: MeadowSpawn) {
  return spawn.nextSpawnAtMs <= state.elapsedMs;
}

export function pressureLabel(pressure: number) {
  if (pressure >= 75) {
    return "Raid risk";
  }

  if (pressure >= 45) {
    return "Contested";
  }

  return "Stable";
}

function normalizeMeadowState(value: unknown): MeadowState {
  const initial = createInitialMeadowState();
  const input = value && typeof value === "object" ? (value as Partial<MeadowState>) : {};
  const tier = normalizeTier(input.tier);

  return updateObjectives({
    ...initial,
    activity: Array.isArray(input.activity) ? input.activity.slice(0, 8).flatMap(normalizeEvent) : initial.activity,
    cash: normalizeNumber(input.cash, initial.cash),
    chickens: normalizeNumber(input.chickens, initial.chickens),
    completedObjectiveIds: normalizeObjectiveIds(input.completedObjectiveIds),
    coopBuilt: Boolean(input.coopBuilt),
    crops: Array.isArray(input.crops) ? input.crops.flatMap(normalizeCrop) : [],
    elapsedMs: normalizeNumber(input.elapsedMs, 0),
    eventCounter: normalizeNumber(input.eventCounter, 1),
    finalScore: typeof input.finalScore === "number" && Number.isFinite(input.finalScore) ? input.finalScore : null,
    helpers: Array.isArray(input.helpers) ? input.helpers.flatMap(normalizeHelper).slice(0, 3) : [],
    inventory: normalizeInventory(input.inventory),
    pressure: Math.max(0, Math.min(100, normalizeNumber(input.pressure, initial.pressure))),
    productionRemainderMs: normalizeNumber(input.productionRemainderMs, 0),
    runner: normalizeRunner(input.runner),
    spawns: Array.isArray(input.spawns) ? input.spawns.flatMap(normalizeSpawn) : initial.spawns,
    status: input.status === "complete" ? "complete" : input.status === "paused" ? "paused" : "ready",
    tier,
    version: 1,
  });
}

function moveRunner(state: MeadowState, deltaMs: number): MeadowState {
  if (state.runner.status !== "moving" || !state.runner.targetSpawnId) {
    return state;
  }

  const target = state.spawns.find((spawn) => spawn.id === state.runner.targetSpawnId);
  if (!target) {
    return {
      ...state,
      runner: {
        ...state.runner,
        status: "idle",
        targetSpawnId: null,
      },
    };
  }

  const stepDistance = (runnerSpeedPerSecond * deltaMs) / 1000;
  const currentDistance = distance(state.runner, target);

  if (currentDistance <= stepDistance || currentDistance <= meadowClaimRange) {
    return {
      ...state,
      runner: {
        ...state.runner,
        x: target.x,
        y: target.y,
        status: "arrived",
      },
    };
  }

  const ratio = stepDistance / currentDistance;

  return {
    ...state,
    runner: {
      ...state.runner,
      x: clampRegion(state.runner.x + (target.x - state.runner.x) * ratio),
      y: clampRegion(state.runner.y + (target.y - state.runner.y) * ratio),
    },
  };
}

function produceEggs(state: MeadowState, deltaMs: number): MeadowState {
  if (state.chickens <= 0) {
    return state;
  }

  const totalMs = state.productionRemainderMs + deltaMs;
  const cycles = Math.floor(totalMs / eggCycleMs);

  if (cycles <= 0) {
    return {
      ...state,
      productionRemainderMs: totalMs,
    };
  }

  const possibleEggs = cycles * state.chickens;
  const producedEggs = Math.min(possibleEggs, state.inventory.feed);
  const nextInventory = {
    ...state.inventory,
    eggs: state.inventory.eggs + producedEggs,
    feed: state.inventory.feed - producedEggs,
  };

  let nextState: MeadowState = {
    ...state,
    inventory: nextInventory,
    productionRemainderMs: totalMs % eggCycleMs,
  };

  if (producedEggs > 0 && !state.completedObjectiveIds.includes("first-eggs")) {
    nextState = addEvent(
      {
        ...nextState,
        completedObjectiveIds: addObjective(nextState.completedObjectiveIds, "first-eggs"),
      },
      `First Egg cycle produced Eggs x${producedEggs}.`,
      "success",
    );
  }

  if (producedEggs === 0 && state.inventory.feed <= 0) {
    nextState = addEvent(nextState, "Egg production is waiting on Feed.", "warning");
  }

  return nextState;
}

function raisePressure(state: MeadowState, deltaMs: number): MeadowState {
  const pressurePerSecond = 0.78 * pressureMultiplierByTier[state.tier];
  const nextPressure = state.pressure + (deltaMs / 1000) * pressurePerSecond;

  if (nextPressure < 100) {
    return {
      ...state,
      pressure: nextPressure,
    };
  }

  return addEvent(
    {
      ...state,
      cash: Math.max(0, state.cash - 12 * state.tier),
      inventory: {
        ...state.inventory,
        feed: Math.max(0, state.inventory.feed - 3 * state.tier),
      },
      pressure: 42,
    },
    "Nearby rivals raided the edge of the outpost. Guard pressure reset after losses.",
    "warning",
  );
}

function claimSpawn(state: MeadowState, spawnId: string): MeadowState {
  const spawn = state.spawns.find((candidate) => candidate.id === spawnId);

  if (!spawn) {
    return state;
  }

  if (!isSpawnLive(state, spawn)) {
    return addEvent(state, `${spawnLabel(spawn.type)} is still respawning.`, "warning");
  }

  const spawnDistance = getSpawnDistance(state, spawn);
  if (spawnDistance > meadowClaimRange) {
    return addEvent(
      state,
      `Runner is ${spawnDistance.toFixed(1)} units from ${spawnLabel(spawn.type)}. Move closer before claiming.`,
      "warning",
    );
  }

  const nextSpawns = state.spawns.map((candidate) =>
    candidate.id === spawn.id
      ? {
          ...candidate,
          claimedAtMs: state.elapsedMs,
          nextSpawnAtMs: state.elapsedMs + scaledSpawnRespawnMs(state.tier),
        }
      : candidate,
  );
  const completedObjectiveIds =
    spawn.type === "rare-feed"
      ? addObjective(state.completedObjectiveIds, "rare-feed")
      : state.completedObjectiveIds;

  return addEvent(
    {
      ...state,
      completedObjectiveIds,
      inventory: addInventory(state.inventory, spawn.loot.itemId, spawn.loot.qty),
      pressure: Math.max(0, state.pressure - (spawn.type === "rare-feed" ? 16 : 8)),
      runner: {
        ...state.runner,
        status: "stopped",
      },
      spawns: nextSpawns,
    },
    `${spawnLabel(spawn.type)} claimed for ${itemLabel(spawn.loot.itemId)} x${spawn.loot.qty}.`,
    "success",
  );
}

function updateObjectives(state: MeadowState): MeadowState {
  const completedIds = getMeadowObjectives(state)
    .filter((objective) => objective.state === "complete")
    .map((objective) => objective.id);

  return {
    ...state,
    completedObjectiveIds: Array.from(new Set([...state.completedObjectiveIds, ...completedIds])),
  };
}

function addEvent(state: MeadowState, text: string, tone: MeadowTone): MeadowState {
  const event: MeadowEvent = {
    id: `event-${state.eventCounter}`,
    atMs: state.elapsedMs,
    text,
    tone,
  };

  return {
    ...state,
    activity: [event, ...state.activity].slice(0, 8),
    eventCounter: state.eventCounter + 1,
  };
}

function addInventory(inventory: MeadowInventory, itemId: MeadowItemId, qty: number): MeadowInventory {
  const used = inventoryUsed(inventory);
  const available = Math.max(0, meadowStorageCap - used);
  const added = Math.min(available, Math.max(0, qty));

  return {
    ...inventory,
    [itemId]: inventory[itemId] + added,
  };
}

export function inventoryUsed(inventory: MeadowInventory) {
  return Object.values(inventory).reduce((total, qty) => total + qty, 0);
}

function addObjective(ids: MeadowObjectiveId[], id: MeadowObjectiveId) {
  return ids.includes(id) ? ids : [...ids, id];
}

function scaledCost(baseCost: number, tier: MeadowState["tier"]) {
  return Math.ceil(baseCost * pressureMultiplierByTier[tier]);
}

function scaledSpawnRespawnMs(tier: MeadowState["tier"]) {
  return Math.ceil(baseSpawnRespawnMs * pressureMultiplierByTier[tier]);
}

function distance(left: MeadowPoint, right: MeadowPoint) {
  return Math.hypot(left.x - right.x, left.y - right.y);
}

function clampRegion(value: number) {
  return Math.max(0, Math.min(meadowRegionSize, value));
}

function spawnLabel(type: MeadowSpawnType) {
  if (type === "rare-feed") {
    return "Rare Feed";
  }

  if (type === "scrap") {
    return "Scrap Cache";
  }

  return "Factory Parts";
}

function itemLabel(itemId: MeadowItemId) {
  if (itemId === "feed") {
    return "Feed";
  }

  if (itemId === "eggs") {
    return "Eggs";
  }

  if (itemId === "wheat") {
    return "Wheat";
  }

  if (itemId === "scrap") {
    return "Metal Scrap";
  }

  return "Factory Parts";
}

function normalizeNumber(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? Math.floor(value)
    : fallback;
}

function normalizeTier(value: unknown): MeadowState["tier"] {
  return value === 2 || value === 3 || value === 4 ? value : 1;
}

function normalizeInventory(value: unknown): MeadowInventory {
  const input = value && typeof value === "object" ? (value as Partial<MeadowInventory>) : {};

  return {
    feed: normalizeNumber(input.feed, 0),
    eggs: normalizeNumber(input.eggs, 0),
    wheat: normalizeNumber(input.wheat, 0),
    scrap: normalizeNumber(input.scrap, 0),
    parts: normalizeNumber(input.parts, 0),
  };
}

function normalizeRunner(value: unknown): MeadowRunner {
  const input = value && typeof value === "object" ? (value as Partial<MeadowRunner>) : {};

  return {
    x: clampRegion(normalizeNumber(input.x, 50)),
    y: clampRegion(normalizeNumber(input.y, 50)),
    status:
      input.status === "moving" || input.status === "arrived" || input.status === "stopped"
        ? input.status
        : "idle",
    targetSpawnId: typeof input.targetSpawnId === "string" ? input.targetSpawnId : null,
  };
}

function normalizeCrop(value: unknown): MeadowCrop[] {
  const input = value && typeof value === "object" ? (value as Partial<MeadowCrop>) : {};

  if (typeof input.id !== "string") {
    return [];
  }

  return [
    {
      id: input.id,
      plantedAtMs: normalizeNumber(input.plantedAtMs, 0),
      qty: normalizeNumber(input.qty, wheatBundleQty),
      readyAtMs: normalizeNumber(input.readyAtMs, wheatGrowMs),
    },
  ];
}

function normalizeSpawn(value: unknown): MeadowSpawn[] {
  const input = value && typeof value === "object" ? (value as Partial<MeadowSpawn>) : {};

  if (
    typeof input.id !== "string" ||
    (input.type !== "rare-feed" && input.type !== "scrap" && input.type !== "parts") ||
    !input.loot
  ) {
    return [];
  }

  const loot = input.loot;

  return [
    {
      id: input.id,
      type: input.type,
      x: clampRegion(normalizeNumber(input.x, 50)),
      y: clampRegion(normalizeNumber(input.y, 50)),
      loot: {
        itemId:
          loot.itemId === "feed" ||
          loot.itemId === "eggs" ||
          loot.itemId === "wheat" ||
          loot.itemId === "scrap" ||
          loot.itemId === "parts"
            ? loot.itemId
            : "feed",
        qty: normalizeNumber(loot.qty, 1),
      },
      nextSpawnAtMs: normalizeNumber(input.nextSpawnAtMs, 0),
      claimedAtMs:
        typeof input.claimedAtMs === "number" && Number.isFinite(input.claimedAtMs)
          ? input.claimedAtMs
          : null,
    },
  ];
}

function normalizeHelper(value: unknown): MeadowHelper[] {
  const input = value && typeof value === "object" ? (value as Partial<MeadowHelper>) : {};

  if (typeof input.id !== "string" || typeof input.name !== "string") {
    return [];
  }

  return [
    {
      id: input.id,
      joinedAtMs: normalizeNumber(input.joinedAtMs, 0),
      name: input.name,
      role: input.role === "Guard" || input.role === "Reserve" ? input.role : "Runner",
    },
  ];
}

function normalizeEvent(value: unknown): MeadowEvent[] {
  const input = value && typeof value === "object" ? (value as Partial<MeadowEvent>) : {};

  if (typeof input.id !== "string" || typeof input.text !== "string") {
    return [];
  }

  return [
    {
      id: input.id,
      atMs: normalizeNumber(input.atMs, 0),
      text: input.text,
      tone: input.tone === "success" || input.tone === "warning" ? input.tone : "info",
    },
  ];
}

function normalizeObjectiveIds(value: unknown): MeadowObjectiveId[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (id): id is MeadowObjectiveId =>
      id === "outpost-online" ||
      id === "first-eggs" ||
      id === "rare-feed" ||
      id === "market-sale" ||
      id === "helper-tier",
  );
}
