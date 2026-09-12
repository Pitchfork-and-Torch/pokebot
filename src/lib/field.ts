import { FIELD_ROWS, GRASS_RATE, SIGNS, SPAWNS, TILE, type Sign } from "../data/fieldMap";
import { FIELD_POOL, getFieldPlate } from "../data/fieldWilds";
import { specimenToIdentify } from "../data/types";
import type { IdentifyResult, SaveFile, Specimen, Verdict } from "../data/types";

export const MAP_W = FIELD_ROWS[0]?.length ?? 0;
export const MAP_H = FIELD_ROWS.length;

export type FieldMode = "intro" | "help" | "walk" | "talk" | "encounter" | "paste";

export interface FieldActor {
  uid: string;
  id: string;
  x: number;
  y: number;
  dir: number;
  wander: boolean;
  npc: boolean;
}

export interface FieldState {
  x: number;
  y: number;
  dir: number;
  frame: number;
  mode: FieldMode;
  talk: string | null;
  encounterId: string | null;
  encounterUid: string | null;
  flash: number;
  toast: string | null;
  actors: FieldActor[];
  grassSeen: number;
}

const BLOCK = new Set<string>([TILE.wall, TILE.water]);

export function tileAt(x: number, y: number): string {
  if (y < 0 || y >= MAP_H || x < 0 || x >= MAP_W) return TILE.wall;
  return FIELD_ROWS[y]?.[x] ?? TILE.wall;
}

export function walkable(x: number, y: number): boolean {
  return !BLOCK.has(tileAt(x, y));
}

export function regionOf(ch: string): string {
  if (ch === TILE.tower) return "tower";
  if (ch === TILE.archive) return "archive";
  if (ch === TILE.market) return "market";
  if (ch === TILE.hearth) return "hearth";
  if (ch === TILE.forge) return "forge";
  if (ch === TILE.ops) return "ops";
  if (ch === TILE.lab || ch === TILE.spawn) return "lab";
  if (ch === TILE.tall) return "grass";
  return "path";
}

export function findSpawn(): { x: number; y: number } {
  for (let y = 0; y < MAP_H; y++) {
    const row = FIELD_ROWS[y] ?? "";
    const x = row.indexOf(TILE.spawn);
    if (x >= 0) return { x, y };
  }
  return { x: 13, y: 13 };
}

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function occupied(actors: FieldActor[], x: number, y: number, skipUid?: string): boolean {
  return actors.some((a) => a.x === x && a.y === y && a.uid !== skipUid);
}

export function createField(opts?: { intro?: boolean; seed?: number }): FieldState {
  const spawn = findSpawn();
  const rng = mulberry32(opts?.seed ?? 1);
  const actors: FieldActor[] = [];
  for (const s of SPAWNS) {
    if (!walkable(s.x, s.y)) continue;
    if (!getFieldPlate(s.id)) continue;
    actors.push({
      uid: s.id + "-" + s.x + "-" + s.y,
      id: s.id,
      x: s.x,
      y: s.y,
      dir: Math.floor(rng() * 4),
      wander: Boolean(s.wander),
      npc: Boolean(s.npc),
    });
  }
  return {
    x: spawn.x,
    y: spawn.y,
    dir: 0,
    frame: 0,
    mode: opts?.intro === false ? "walk" : "intro",
    talk: null,
    encounterId: null,
    encounterUid: null,
    flash: 0,
    toast: null,
    actors,
    grassSeen: 0,
  };
}

export function actorAt(state: FieldState, x: number, y: number): FieldActor | null {
  return state.actors.find((a) => a.x === x && a.y === y) ?? null;
}

export function facingTile(state: FieldState): { x: number; y: number } {
  const dx = state.dir === 1 ? 1 : state.dir === 3 ? -1 : 0;
  const dy = state.dir === 0 ? 1 : state.dir === 2 ? -1 : 0;
  return { x: state.x + dx, y: state.y + dy };
}

function signAt(x: number, y: number): Sign | undefined {
  return SIGNS.find((s) => s.x === x && s.y === y);
}

function professorTalk(): string {
  return "I am the professor you did not hire. Walk the field. Read the job. Stamp Keep, Watch, or Skip. Cap 50. Six standing. We never click Add.";
}

export function plateFor(id: string): Specimen | undefined {
  return getFieldPlate(id);
}

export function identifyPlate(spec: Specimen, save: SaveFile): IdentifyResult {
  const base = specimenToIdentify(spec);
  const already = save.caught.some((c) => c.id === spec.id || c.name.toLowerCase() === spec.name.toLowerCase());
  if (already) {
    return { ...base, verdict: "WATCH", why: [`${spec.name} is already in the Index. Box or six from the desk.`], slot_advice: "box" };
  }
  const active = save.activeIds
    .map((id) => (id ? save.caught.find((c) => c.id === id) : undefined))
    .filter((s): s is Specimen => Boolean(s));
  const sameType = active.find((a) => a.types[0] === spec.types[0]);
  if (sameType && spec.origin !== "wild") {
    return { ...base, verdict: "WATCH", why: [`${sameType.name} already holds ${spec.types[0]}. This may be a hat.`] };
  }
  if (sameType && spec.origin === "duplicate") {
    return { ...base, verdict: "WATCH", why: [`You already have ${sameType.name}. Same animal, new hat.`] };
  }
  return base;
}

function openTalk(state: FieldState, text: string): FieldState {
  return { ...state, mode: "talk", talk: text, toast: null };
}

function openEncounter(state: FieldState, actor: FieldActor): FieldState {
  return {
    ...state,
    mode: "encounter",
    encounterId: actor.id,
    encounterUid: actor.uid,
    flash: 6,
    talk: null,
    toast: null,
  };
}

export function tryMove(state: FieldState, dx: number, dy: number, rng: () => number): FieldState {
  if (state.mode !== "walk") return state;
  const dir = dy > 0 ? 0 : dy < 0 ? 2 : dx > 0 ? 1 : 3;
  const nx = state.x + dx;
  const ny = state.y + dy;
  const bumped = actorAt(state, nx, ny);
  if (bumped) {
    const spec = plateFor(bumped.id);
    if (!spec) return { ...state, dir };
    if (bumped.npc) return { ...openTalk(state, professorTalk()), dir };
    return { ...openEncounter(state, bumped), dir };
  }
  if (!walkable(nx, ny)) return { ...state, dir };
  const next: FieldState = { ...state, x: nx, y: ny, dir, toast: null };
  if (tileAt(nx, ny) === TILE.tall && rng() < GRASS_RATE) {
    const pool = FIELD_POOL.filter((s) => !next.actors.some((a) => a.id === s.id));
    const pick = pool[Math.floor(rng() * Math.max(1, pool.length))];
    if (pick) {
      return {
        ...next,
        mode: "encounter",
        encounterId: pick.id,
        encounterUid: null,
        flash: 6,
        grassSeen: next.grassSeen + 1,
      };
    }
  }
  return next;
}

export function interact(state: FieldState): FieldState {
  if (state.mode === "intro") return { ...state, mode: "walk" };
  if (state.mode === "help" || state.mode === "talk") return { ...state, mode: "walk", talk: null };
  if (state.mode === "encounter" || state.mode === "paste") return state;
  const face = facingTile(state);
  const here = signAt(state.x, state.y);
  const ahead = signAt(face.x, face.y);
  const bumped = actorAt(state, face.x, face.y);
  if (bumped) {
    if (bumped.npc) return openTalk(state, professorTalk());
    return openEncounter(state, bumped);
  }
  if (ahead) return openTalk(state, ahead.text);
  if (here) return openTalk(state, here.text);
  if (regionOf(tileAt(state.x, state.y)) === "lab") {
    return { ...state, mode: "paste", toast: null };
  }
  return { ...state, toast: "Nothing in front. Walk to a wild or a sign." };
}

export function cancel(state: FieldState): FieldState {
  if (state.mode === "intro") return { ...state, mode: "walk" };
  if (state.mode === "help") return { ...state, mode: "walk" };
  if (state.mode === "talk") return { ...state, mode: "walk", talk: null };
  if (state.mode === "encounter") {
    return { ...state, mode: "walk", encounterId: null, encounterUid: null, toast: "Left the wild standing." };
  }
  if (state.mode === "paste") return { ...state, mode: "walk" };
  return { ...state, mode: "help" };
}

export function stampRoast(action: "catch" | "watch" | "skip", verdict: Verdict): string {
  if (action === "catch" && verdict === "SKIP") return "You stamped Keep on a mouth with no fence. The Index will remember.";
  if (action === "catch" && verdict === "WATCH") return "Kept a Watch. It is in the Index. Pin it only if the six has a real hole.";
  if (action === "skip" && verdict === "CATCH") return "You skipped a fenced job. Fine. The grass will keep it.";
  if (action === "skip") return "Skip. The toy thanks you.";
  if (action === "watch") return "Watch. Not standing. Not gone.";
  return "Keep writes the local Index. You still click Add on x.ai.";
}

export function afterStamp(state: FieldState, action: "catch" | "watch" | "skip", roast: string): FieldState {
  let actors = state.actors;
  if (action === "catch" && state.encounterUid) {
    actors = actors.filter((a) => a.uid !== state.encounterUid);
  }
  return {
    ...state,
    mode: "walk",
    encounterId: null,
    encounterUid: null,
    actors,
    toast: roast,
    flash: 0,
  };
}

const DIRS: Array<[number, number]> = [
  [0, 1],
  [1, 0],
  [0, -1],
  [-1, 0],
];

export function tick(state: FieldState, rng: () => number): FieldState {
  const frame = state.frame + 1;
  const flash = Math.max(0, state.flash - 1);
  if (state.mode !== "walk" || frame % 40 !== 0) {
    return { ...state, frame, flash };
  }
  const actors = state.actors.map((a) => {
    if (!a.wander || rng() > 0.45) return a;
    const dir = Math.floor(rng() * 4);
    const step = DIRS[dir];
    if (!step) return { ...a, dir };
    const nx = a.x + step[0];
    const ny = a.y + step[1];
    if (!walkable(nx, ny)) return { ...a, dir };
    if (nx === state.x && ny === state.y) return { ...a, dir };
    if (occupied(state.actors, nx, ny, a.uid)) return { ...a, dir };
    return { ...a, x: nx, y: ny, dir };
  });
  return { ...state, frame, flash, actors };
}

export const KEY_MOVE: Record<string, [number, number]> = {
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  w: [0, -1],
  W: [0, -1],
  s: [0, 1],
  S: [0, 1],
  a: [-1, 0],
  A: [-1, 0],
  d: [1, 0],
  D: [1, 0],
};

export function isConfirmKey(key: string): boolean {
  return key === "Enter" || key === "z" || key === "Z" || key === " ";
}

export function isCancelKey(key: string): boolean {
  return key === "Escape" || key === "x" || key === "X" || key === "Backspace";
}

export function stampKey(key: string): "catch" | "watch" | "skip" | null {
  if (key === "1" || key === "c" || key === "C") return "catch";
  if (key === "2" || key === "t" || key === "T") return "watch";
  if (key === "3") return "skip";
  return null;
}
