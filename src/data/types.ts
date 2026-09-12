export const TYPE_IDS = [
  "scout",
  "scribe",
  "ops",
  "forge",
  "sense",
  "voice",
  "keep",
  "chief",
] as const;

export type TypeId = (typeof TYPE_IDS)[number];

export type Rarity = "common" | "uncommon" | "rare" | "legendary";
export type Risk = "low" | "mid" | "high";
export type Verdict = "CATCH" | "WATCH" | "SKIP";
export type Origin = "spawned" | "wild" | "duplicate" | "stub";
export type SlotAdvice = "pin" | "box" | "do-not-create";
export const KIND_IDS = ["grok-bot", "skill", "mcp", "clock", "telegram", "other"] as const;
export type KindId = (typeof KIND_IDS)[number];

export const KIND_LABEL: Record<KindId, string> = {
  "grok-bot": "BOT",
  skill: "SKILL",
  mcp: "MCP",
  clock: "CLOCK",
  telegram: "TG",
  other: "OTHER",
};

export function isKindId(value: string): value is KindId {
  return (KIND_IDS as readonly string[]).includes(value);
}

export interface Specimen {
  id: string;
  name: string;
  title: string;
  types: [TypeId] | [TypeId, TypeId];
  job: string;
  never_list: string[];
  tools: string[];
  rarity: Rarity;
  risk: Risk;
  origin: Origin;
  flavor: string;
  kind?: KindId;
  sourceUrl?: string;
}

export interface IdentifyResult {
  id: string;
  name: string;
  title: string;
  types: TypeId[];
  job_one_liner: string;
  tools_guess: string[];
  never_list: string[];
  risk: Risk;
  rarity: Rarity;
  verdict: Verdict;
  why: string[];
  first_training_task: string;
  slot_advice: SlotAdvice;
  kind?: KindId;
  sourceUrl?: string;
}

export interface ActiveRef {
  id: string;
  name: string;
  types: TypeId[];
  job: string;
}

export interface EncounterLog {
  id: string;
  at: string;
  input: string;
  result: IdentifyResult;
  action: "identify" | "catch" | "watch" | "skip";
}

export interface GymScores {
  correctness: number;
  toolDiscipline: number;
  neverList: number;
  babysit: number;
}

export interface GymRecord {
  id: string;
  at: string;
  brief: string;
  aName: string;
  bName: string;
  a: GymScores;
  b: GymScores;
  winner: "a" | "b" | "tie";
}

export type SlotAction = "keep" | "box" | "rewrite-never" | "empty";

export interface MondaySlot {
  slot: number;
  id: string | null;
  name: string;
  total: number;
  scores: GymScores | null;
  action: SlotAction;
  note: string;
}

export interface MondayReport {
  id: string;
  at: string;
  brief: string;
  slots: MondaySlot[];
  cap: number;
  holes: TypeId[];
  cheapestKill: string | null;
  keep: number;
  box: number;
}

export type DocketSource = "lane" | "import" | "paste";

export interface DocketItem {
  result: IdentifyResult;
  input: string;
  source: DocketSource;
  station?: number;
}

export interface SaveFile {
  v: 1;
  mute: boolean;
  tutorial: boolean;
  trainerName: string;
  crtDone: boolean;
  censusDone: boolean;
  declaredExisting: number;
  seenIds: string[];
  caught: Specimen[];
  boxedIds: string[];
  releasedIds: string[];
  activeIds: [string | null, string | null, string | null, string | null, string | null, string | null];
  encounters: EncounterLog[];
  gyms: GymRecord[];
  monday: MondayReport | null;
  shinyIds: string[];
  legendaryStamps: Record<string, string>;
  docket: DocketItem[];
  laneIndex: number;
  laneLecture: string;
}

export const TYPE_META: Record<
  TypeId,
  { label: string; job: string; color: string; ink: string }
> = {
  scout: { label: "Scout", job: "research, sources, people, news", color: "#7CF0A0", ink: "#0B0F0C" },
  scribe: { label: "Scribe", job: "drafts, docs, posts, decks", color: "#F2E6C8", ink: "#0B0F0C" },
  ops: { label: "Ops", job: "inbox, calendar, chores, routines", color: "#8EC8F2", ink: "#0B0F0C" },
  forge: { label: "Forge", job: "code, PRs, repro, build", color: "#F2A15C", ink: "#0B0F0C" },
  sense: { label: "Sense", job: "analytics, QA, account health", color: "#C89CF2", ink: "#0B0F0C" },
  voice: { label: "Voice", job: "social, GTM, outbound", color: "#F26B8A", ink: "#0B0F0C" },
  keep: { label: "Keep", job: "home, travel, personal admin", color: "#E7D7B6", ink: "#0B0F0C" },
  chief: { label: "Chief", job: "delegate, roster, weekly review", color: "#F2C14E", ink: "#0B0F0C" },
};

export function isTypeId(value: string): value is TypeId {
  return (TYPE_IDS as readonly string[]).includes(value);
}

export function specimenToIdentify(s: Specimen): IdentifyResult {
  return {
    id: s.id,
    name: s.name,
    title: s.title,
    types: [...s.types],
    job_one_liner: s.job,
    tools_guess: [...s.tools],
    never_list: [...s.never_list],
    risk: s.risk,
    rarity: s.rarity,
    verdict: s.origin === "duplicate" || s.origin === "stub" ? "WATCH" : s.risk === "high" ? "SKIP" : "CATCH",
    why: [s.flavor],
    first_training_task: `Run one bounded task that proves ${s.name} owns: ${s.job}`,
    slot_advice: s.origin === "duplicate" ? "box" : s.risk === "high" ? "do-not-create" : "pin",
    kind: s.kind ?? "grok-bot",
    sourceUrl: s.sourceUrl,
  };
}
