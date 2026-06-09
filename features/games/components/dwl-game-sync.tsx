"use client";

import { useEffect } from "react";

type DwlSessionResponse = {
  user?: { id: string } | null;
};

type DwlStorageState = {
  savedAt?: string;
  storage?: Record<string, string>;
};

const RELOAD_FLAG = "games:dwl-sync-applied";

function shouldSyncKey(key: string) {
  return key.startsWith("games:") || key.startsWith("dylan-games:");
}

function readGameStorage() {
  const storage: Record<string, string> = {};

  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (!key || !shouldSyncKey(key)) {
      continue;
    }

    const value = window.localStorage.getItem(key);
    if (value !== null) {
      storage[key] = value;
    }
  }

  return storage;
}

function applyRemoteStorage(remoteStorage: Record<string, string>) {
  let appliedMissingValue = false;

  for (const [key, value] of Object.entries(remoteStorage)) {
    if (!shouldSyncKey(key)) {
      continue;
    }

    if (window.localStorage.getItem(key) === null) {
      appliedMissingValue = true;
      window.localStorage.setItem(key, value);
    }
  }

  return appliedMissingValue;
}

async function fetchSession() {
  const response = await fetch("/api/dwl/session", { cache: "no-store" });
  if (!response.ok) {
    return null;
  }

  const body = (await response.json()) as DwlSessionResponse;
  return body.user ?? null;
}

async function fetchRemoteState() {
  const response = await fetch("/api/dwl/state", { cache: "no-store" });
  if (!response.ok) {
    return null;
  }

  const body = (await response.json()) as { state?: DwlStorageState | null };
  return body.state ?? null;
}

async function saveRemoteState(storage: Record<string, string>) {
  await fetch("/api/dwl/state", {
    body: JSON.stringify({
      state: {
        savedAt: new Date().toISOString(),
        storage,
      },
    }),
    headers: {
      "Content-Type": "application/json",
    },
    method: "PUT",
  });
}

export function DwlGameSync() {
  useEffect(() => {
    let cancelled = false;
    let lastSavedPayload = "";
    let interval: number | undefined;

    async function runSync() {
      try {
        const user = await fetchSession();
        if (cancelled || !user) {
          return;
        }

        const remoteState = await fetchRemoteState();
        if (cancelled) {
          return;
        }

        const remoteStorage = remoteState?.storage ?? {};
        const appliedMissingValue = applyRemoteStorage(remoteStorage);
        const mergedStorage = {
          ...remoteStorage,
          ...readGameStorage(),
        };

        lastSavedPayload = JSON.stringify(mergedStorage);
        await saveRemoteState(mergedStorage);

        if (appliedMissingValue && window.sessionStorage.getItem(RELOAD_FLAG) !== "true") {
          window.sessionStorage.setItem(RELOAD_FLAG, "true");
          window.location.reload();
          return;
        }

        interval = window.setInterval(() => {
          const nextStorage = readGameStorage();
          const nextPayload = JSON.stringify(nextStorage);
          if (nextPayload === lastSavedPayload) {
            return;
          }
          lastSavedPayload = nextPayload;
          void saveRemoteState(nextStorage);
        }, 2500);
      } catch {
        // Local game progress remains available when account sync is offline.
      }
    }

    void runSync();

    return () => {
      cancelled = true;
      if (interval) {
        window.clearInterval(interval);
      }
    };
  }, []);

  return null;
}
