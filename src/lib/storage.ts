import type { SaveFile } from "../data/types";
import { emptyActive } from "./roster";

export const SAVE_KEY = "pokebot.v2";

export function blankSave(): SaveFile {
  return {
    v: 1,
    mute: true,
    tutorial: false,
    trainerName: "Trainer",
    crtDone: false,
    censusDone: false,
    declaredExisting: 0,
    seenIds: [],
    caught: [],
    boxedIds: [],
    releasedIds: [],
    activeIds: emptyActive(),
    encounters: [],
    gyms: [],
    monday: null,
    shinyIds: [],
    legendaryStamps: {},
    docket: [],
    laneIndex: 0,
    laneLecture: "",
  };
}

function isSaveFile(value: unknown): value is SaveFile {
  if (!value || typeof value !== "object") return false;
  const v = value as Partial<SaveFile>;
  return v.v === 1 && Array.isArray(v.caught) && Array.isArray(v.activeIds) && v.activeIds.length === 6;
}

export function loadSave(): SaveFile {
  if (typeof localStorage === "undefined") return blankSave();
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return blankSave();
    const parsed: unknown = JSON.parse(raw);
    if (!isSaveFile(parsed)) return blankSave();
    return {
      ...blankSave(),
      ...parsed,
      activeIds: [
        parsed.activeIds[0] ?? null,
        parsed.activeIds[1] ?? null,
        parsed.activeIds[2] ?? null,
        parsed.activeIds[3] ?? null,
        parsed.activeIds[4] ?? null,
        parsed.activeIds[5] ?? null,
      ],
      docket: Array.isArray((parsed as SaveFile).docket) ? (parsed as SaveFile).docket : [],
      laneIndex: typeof (parsed as SaveFile).laneIndex === "number" ? (parsed as SaveFile).laneIndex : 0,
      laneLecture: typeof (parsed as SaveFile).laneLecture === "string" ? (parsed as SaveFile).laneLecture : "",
    };
  } catch {
    return blankSave();
  }
}

export function persistSave(save: SaveFile): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(SAVE_KEY, JSON.stringify(save));
}

export function resetSave(): SaveFile {
  const next = blankSave();
  persistSave(next);
  return next;
}
