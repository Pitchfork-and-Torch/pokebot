import { LANE, LANE_COUNT, LANE_DONE, LANE_MATCH_INDEX } from "../data/lane";
import type { ActiveRef, DocketItem, SaveFile, Verdict } from "../data/types";
import { classify } from "./classify";
import { importIndex } from "./indexMarkdown";
import { caughtIdFor, upgradeOrAdd } from "./ingest";
import { assignSlot } from "./roster";

export function activeRefsFrom(save: SaveFile): ActiveRef[] {
  return save.activeIds
    .map((id) => (id ? save.caught.find((s) => s.id === id) : undefined))
    .filter((s): s is NonNullable<typeof s> => Boolean(s))
    .map((s) => ({ id: s.id, name: s.name, types: [...s.types], job: s.job }));
}

export function laneInProgress(save: SaveFile): boolean {
  const idx = save.laneIndex ?? 0;
  if (idx >= LANE_DONE) return false;
  if (idx > 0) return true;
  return save.docket.some((d) => d.source === "lane");
}

export function startLane(save: SaveFile): SaveFile {
  const cleared = { ...save, laneIndex: 0, docket: save.docket.filter((d) => d.source !== "lane") };
  return loadLaneHearing(cleared, 0);
}

export function currentHearing(save: SaveFile): DocketItem | undefined {
  return save.docket[0];
}

export function enqueue(save: SaveFile, items: DocketItem[]): SaveFile {
  if (items.length === 0) return save;
  return { ...save, docket: [...save.docket, ...items] };
}

export function identifyStation(save: SaveFile, index: number): DocketItem | null {
  const station = LANE[index];
  if (!station || !station.paste) return null;
  const active = activeRefsFrom(save);
  const result = classify(station.paste, { active, activeCount: active.length });
  return { result, input: station.paste, source: "lane", station: index };
}

export function loadLaneHearing(save: SaveFile, index = save.laneIndex ?? 0): SaveFile {
  if (index >= LANE_MATCH_INDEX) {
    const rest = save.docket.filter((d) => d.source !== "lane");
    if (save.laneIndex === index && rest.length === save.docket.length) return save;
    return { ...save, laneIndex: index, docket: rest };
  }
  const current = save.docket[0];
  if (current?.source === "lane" && current.station === index && save.laneIndex === index) return save;
  const item = identifyStation(save, index);
  if (!item) return save.laneIndex === index ? save : { ...save, laneIndex: index };
  const rest = save.docket.filter((d) => d.source !== "lane");
  return { ...save, laneIndex: index, docket: [item, ...rest], laneLecture: LANE[index]?.teach ?? "" };
}

export function ensureLane(save: SaveFile): SaveFile {
  if (!laneInProgress(save)) return save;
  if (save.docket.length > 0) return save;
  const idx = save.laneIndex ?? 0;
  if (idx >= LANE_MATCH_INDEX) return { ...save, laneIndex: Math.min(idx, LANE_DONE) };
  return loadLaneHearing(save, idx);
}

export function queueImport(save: SaveFile, items: DocketItem[]): SaveFile {
  return enqueue(save, items.map((item) => ({ ...item, source: "import" as const })));
}

function pinFirstHole(save: SaveFile, id: string): SaveFile {
  const hole = save.activeIds.findIndex((slot) => slot === null);
  if (hole < 0) return save;
  const next = assignSlot(save.activeIds, save.boxedIds, hole, id);
  return { ...save, ...next };
}

export function stampHearing(
  save: SaveFile,
  action: "catch" | "watch" | "skip",
  opts: { pin?: boolean } = {},
): { save: SaveFile; lecture: string; blocked?: string; pinned?: boolean } {
  const item = save.docket[0];
  if (!item) return { save, lecture: save.laneLecture };

  const station = item.station != null ? LANE[item.station] : undefined;
  const stamped: Verdict = action === "catch" ? "CATCH" : action === "watch" ? "WATCH" : "SKIP";
  let lecture = "";
  if (station) {
    lecture =
      stamped === station.expected
        ? station.teach
        : `Identify said ${station.expected}. You stamped ${stamped}. ${station.miss}`;
  }

  let next = save;
  let pinned = false;

  if (action === "catch") {
    const step = upgradeOrAdd(next, item.result, "wild");
    if (step.blocked) return { save, lecture, blocked: step.blocked };
    next = step.save;
    const specId = caughtIdFor(next, item.result);
    const shouldPin = opts.pin ?? item.result.slot_advice === "pin";
    if (shouldPin) {
      next = pinFirstHole(next, specId);
      pinned = next.activeIds.includes(specId);
    }
    next = {
      ...next,
      encounters: [
        {
          id: item.result.id + "-catch-" + Date.now(),
          at: new Date().toISOString(),
          input: item.input,
          result: item.result,
          action: "catch" as const,
        },
        ...next.encounters,
      ].slice(0, 80),
    };
  } else {
    next = {
      ...next,
      seenIds: next.seenIds.includes(item.result.id) ? next.seenIds : [...next.seenIds, item.result.id],
      encounters: [
        {
          id: item.result.id + "-" + action + "-" + Date.now(),
          at: new Date().toISOString(),
          input: item.input,
          result: item.result,
          action,
        },
        ...next.encounters,
      ].slice(0, 80),
    };
  }

  next = { ...next, docket: next.docket.slice(1), laneLecture: lecture };

  if (item.source === "lane") {
    const nxt = Math.min((item.station ?? 0) + 1, LANE_DONE);
    next = { ...next, laneIndex: nxt };
    if (nxt < LANE_MATCH_INDEX) next = loadLaneHearing(next, nxt);
  }

  return { save: next, lecture, pinned };
}

export function markLaneDone(save: SaveFile): SaveFile {
  return { ...save, laneIndex: LANE_DONE, laneLecture: "Lane done. Paste your own jobs, or Import a dump." };
}

export function applyIndexFile(save: SaveFile, md: string): SaveFile {
  const next = importIndex(md, save);
  return {
    ...next,
    docket: next.docket.filter((d) => d.source !== "lane"),
    laneIndex: LANE_DONE,
    laneLecture: "INDEX.md loaded. File of record owns the six.",
  };
}

export { LANE_COUNT, LANE_DONE, LANE_MATCH_INDEX };
