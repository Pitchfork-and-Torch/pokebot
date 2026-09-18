import type { ActiveRef, SaveFile, Specimen } from "../data/types";

export const ACTIVE_MAX = 6;
export const CAP_MAX = 50;
export const CAP_WARN = 40;
export const CAP_HARD = 48;

export type CapLevel = "ok" | "warn" | "hard" | "full";

export function emptyActive(): SaveFile["activeIds"] {
  return [null, null, null, null, null, null];
}

export function activeCount(activeIds: readonly (string | null)[]): number {
  return activeIds.filter((id) => id !== null).length;
}

export function activeRefs(save: SaveFile): ActiveRef[] {
  return save.activeIds
    .map((id) => (id ? save.caught.find((c) => c.id === id) : undefined))
    .filter((s): s is Specimen => Boolean(s))
    .map((s) => ({ id: s.id, name: s.name, types: [...s.types], job: s.job }));
}

export function kindOf(spec: Specimen): string {
  return spec.kind ?? "grok-bot";
}

export function accountUsed(caught: readonly Specimen[], declaredExisting = 0): number {
  const bots = caught.filter((s) => kindOf(s) === "grok-bot").length;
  return bots + declaredExisting;
}

export function capCount(caught: readonly Specimen[], declaredExisting = 0): number {
  return accountUsed(caught, declaredExisting);
}

export function boxedCount(boxedIds: readonly string[]): number {
  return boxedIds.length;
}

export function capState(caughtCount: number): { level: CapLevel; message: string } {
  if (caughtCount >= CAP_MAX) {
    return { level: "full", message: `Cap ${caughtCount}/${CAP_MAX}. Release (hide) before another Catch.` };
  }
  if (caughtCount >= CAP_HARD) {
    return { level: "hard", message: `Hard-warn ${caughtCount}/${CAP_MAX}. Two slots from the wall.` };
  }
  if (caughtCount >= CAP_WARN) {
    return { level: "warn", message: `Warn ${caughtCount}/${CAP_MAX}. Box or release soon.` };
  }
  return { level: "ok", message: `Cap ${caughtCount}/${CAP_MAX}.` };
}

export function canCatch(caughtCount: number): boolean {
  return caughtCount < CAP_MAX;
}

export function assignSlot(
  activeIds: SaveFile["activeIds"],
  boxedIds: string[],
  slot: number,
  id: string,
): { activeIds: SaveFile["activeIds"]; boxedIds: string[] } {
  const next = [...activeIds] as SaveFile["activeIds"];
  if (slot < 0 || slot >= ACTIVE_MAX) return { activeIds: next, boxedIds: [...boxedIds] };
  const prev = next[slot];
  const already = next.indexOf(id);
  if (already !== -1) next[already] = null;
  next[slot] = id;
  const boxed = boxedIds.filter((b) => b !== id);
  if (prev && prev !== id && !next.includes(prev) && !boxed.includes(prev)) boxed.push(prev);
  return { activeIds: next, boxedIds: boxed };
}

export function clearSlot(
  activeIds: SaveFile["activeIds"],
  boxedIds: string[],
  slot: number,
): { activeIds: SaveFile["activeIds"]; boxedIds: string[] } {
  const next = [...activeIds] as SaveFile["activeIds"];
  const prev = next[slot];
  if (slot < 0 || slot >= ACTIVE_MAX) return { activeIds: next, boxedIds: [...boxedIds] };
  next[slot] = null;
  const boxed = [...boxedIds];
  if (prev && !boxed.includes(prev)) boxed.push(prev);
  return { activeIds: next, boxedIds: boxed };
}

export function boxSpecimen(
  activeIds: SaveFile["activeIds"],
  boxedIds: string[],
  id: string,
): { activeIds: SaveFile["activeIds"]; boxedIds: string[] } {
  const next = activeIds.map((slot) => (slot === id ? null : slot)) as SaveFile["activeIds"];
  const boxed = boxedIds.includes(id) ? [...boxedIds] : [...boxedIds, id];
  return { activeIds: next, boxedIds: boxed };
}

export function releaseSpecimen(
  caught: Specimen[],
  activeIds: SaveFile["activeIds"],
  boxedIds: string[],
  releasedIds: string[],
  id: string,
  shinyIds: string[] = [],
  legendaryStamps: Record<string, string> = {},
): {
  caught: Specimen[];
  activeIds: SaveFile["activeIds"];
  boxedIds: string[];
  releasedIds: string[];
  shinyIds: string[];
  legendaryStamps: Record<string, string>;
} {
  // Drop shiny / legendary marks with the specimen. A later Catch of the same
  // id must not inherit a ghost Legendary stamp or SHINY flag from a release.
  const nextStamps = { ...legendaryStamps };
  delete nextStamps[id];
  return {
    caught: caught.filter((s) => s.id !== id),
    activeIds: activeIds.map((slot) => (slot === id ? null : slot)) as SaveFile["activeIds"],
    boxedIds: boxedIds.filter((b) => b !== id),
    releasedIds: releasedIds.includes(id) ? releasedIds : [...releasedIds, id],
    shinyIds: shinyIds.filter((s) => s !== id),
    legendaryStamps: nextStamps,
  };
}

export function stats(save: SaveFile): {
  seen: number;
  caught: number;
  active: number;
  box: number;
  cap: number;
  capLevel: CapLevel;
  capMessage: string;
  attention: number;
} {
  const indexed = save.caught.length;
  const used = accountUsed(save.caught, save.declaredExisting ?? 0);
  const cap = capState(used);
  const attention = activeCount(save.activeIds);
  return {
    seen: save.seenIds.length,
    caught: indexed,
    active: attention,
    box: boxedCount(save.boxedIds),
    cap: used,
    capLevel: cap.level,
    capMessage: cap.message,
    attention,
  };
}
