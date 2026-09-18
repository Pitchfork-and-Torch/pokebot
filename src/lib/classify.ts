import { DEX } from "../data/dex";
import { TYPE_IDS, TYPE_META, type ActiveRef, type IdentifyResult, type Rarity, type Risk, type SlotAdvice, type TypeId, type Verdict } from "../data/types";
import { detectKind } from "./pasteKind";

const TYPE_KEYWORDS: Record<TypeId, string[]> = {
  scout: ["research", "sources", "source", "people", "news", "intel", "digest", "brief", "osint", "investigate", "identify", "field guide", "competitive"],
  scribe: ["draft", "docs", "document", "post", "posts", "deck", "write", "copy", "essay", "readme", "prose"],
  ops: ["inbox", "calendar", "chore", "chores", "routine", "nightly", "file", "schedule", "remind", "habit", "expense", "receipt", "agenda"],
  forge: ["code", "pr", "pull request", "repro", "build", "merge", "repo", "typescript", "bug", "compile", "patch", "git"],
  sense: ["analytics", "qa", "account health", "metrics", "dashboard", "kpi", "health", "audit", "quality"],
  voice: ["social", "gtm", "outbound", "dm", "dms", "leads", "lead", "tweet", "marketing", "promo", "sequence", "strangers"],
  keep: ["home", "travel", "personal admin", "family", "errand", "household", "packing", "visa"],
  chief: ["delegate", "roster", "weekly review", "team of six", "cap 50", "active six", "professor", "field guide"],
};

const STOP = new Set([
  "a", "an", "the", "and", "or", "to", "of", "for", "in", "on", "with", "that", "this", "i", "my", "me",
  "bot", "bots", "need", "want", "please", "just", "from", "into", "it", "is", "be", "as", "at",
]);

export function normalize(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

export function tokens(text: string): string[] {
  return normalize(text)
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 1 && !STOP.has(t));
}

export function idFromText(text: string): string {
  const s = normalize(text);
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return "w" + (h >>> 0).toString(16);
}

function unique(items: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of items) {
    const key = item.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

export function extractNeverList(text: string): string[] {
  const out: string[] = [];
  const re = /\b(?:never|do not|don't|dont|must not|no outbound|approval required)\b[^.!?\n]*/gi;
  for (const match of text.matchAll(re)) {
    const line = match[0].trim().replace(/\s+/g, " ");
    if (line.length > 4) out.push(line);
  }
  return unique(out);
}

export function hasNeverList(text: string): boolean {
  return extractNeverList(text).length > 0;
}

export function stripNeverClauses(text: string): string {
  return text
    .replace(/\bnever\b[^.!?\n]*/gi, " ")
    .replace(/\bdo not\b[^.!?\n]*/gi, " ")
    .replace(/\bdon't\b[^.!?\n]*/gi, " ")
    .replace(/\bdont\b[^.!?\n]*/gi, " ")
    .replace(/\bmust not\b[^.!?\n]*/gi, " ");
}

export function wantsOutbound(text: string): boolean {
  const s = normalize(stripNeverClauses(text));
  return (
    /\bdms?\b/.test(s) ||
    /direct message/.test(s) ||
    /inbound leads/.test(s) ||
    /outbound/.test(s) ||
    /cold (email|dm|call|outreach)/.test(s) ||
    /contact (people|strangers|leads)/.test(s) ||
    /message strangers/.test(s) ||
    /follow up forever/.test(s)
  );
}

export function wantsSpend(text: string): boolean {
  const s = normalize(stripNeverClauses(text));
  return (
    /\bbuy\b/.test(s) ||
    /purchase/.test(s) ||
    /saved card/.test(s) ||
    /credit card/.test(s) ||
    /checkout/.test(s) ||
    /place orders/.test(s) ||
    /pay (a |the )?(vendor|merchant)/.test(s)
  );
}

export function isGeneralHelper(text: string): boolean {
  const s = normalize(text);
  return (
    /general helper/.test(s) ||
    /help with anything/.test(s) ||
    /does? everything/.test(s) ||
    /do everything/.test(s) ||
    /do it all/.test(s) ||
    /personal assistant that does/.test(s)
  );
}

export function isCeoBlob(text: string): boolean {
  const s = normalize(text);
  return /ceo of my (life|everything|world)/.test(s) || /run my life/.test(s) || /be the company/.test(s);
}

export function isCostume(text: string): boolean {
  const s = normalize(text);
  return (
    /costume/.test(s) ||
    /no owner/.test(s) ||
    /no job/.test(s) ||
    /be a meme/.test(s) ||
    /meme bot/.test(s) ||
    /\buwu\b/.test(s) ||
    /based ?pepe/.test(s)
  );
}

export function isMergeHappy(text: string): boolean {
  const s = normalize(stripNeverClauses(text));
  const wantsMerge = /\bmerge\b/.test(s) || /push to main/.test(s) || /auto-?merge/.test(s);
  const gated = /approval/.test(normalize(text)) || hasNeverList(text);
  return wantsMerge && !gated;
}

export function hasApproval(text: string): boolean {
  return /approval/.test(normalize(text));
}

export function hasSchedule(text: string): boolean {
  const s = normalize(text);
  return /every morning|nightly|weekly|daily|once a night|cron|schedule|recurring/.test(s);
}

export function hasDuration(text: string): boolean {
  const s = normalize(text);
  return /30 days|for a quarter|for the quarter|owned for|own for|stated duration/.test(s);
}

export function guessTools(text: string): string[] {
  const s = normalize(text);
  const found: string[] = [];
  const catalog: [RegExp, string][] = [
    [/spreadsheet|sheet|excel/, "spreadsheet"],
    [/calendar/, "calendar"],
    [/gmail|inbox|mail|email/, "mail"],
    [/github|git\b|repo|pr\b/, "git"],
    [/analytics/, "analytics"],
    [/file/, "local file"],
    [/docs|markdown/, "docs"],
    [/crm/, "CRM"],
    [/slack/, "slack"],
    [/receipt/, "receipt folder"],
  ];
  for (const [re, label] of catalog) {
    if (re.test(s)) found.push(label);
  }
  return unique(found);
}

export function scoreTypes(text: string): { id: TypeId; score: number }[] {
  const s = normalize(text);
  const scored = TYPE_IDS.map((id) => {
    let score = 0;
    for (const kw of TYPE_KEYWORDS[id]) {
      if (s.includes(kw)) score += kw.length > 8 ? 2.2 : 1.4;
    }
    return { id, score };
  }).sort((a, b) => b.score - a.score);
  return scored;
}

export function pickTypes(text: string): TypeId[] {
  const ranked = scoreTypes(text);
  const first = ranked[0];
  if (!first || first.score <= 0) {
    if (isCeoBlob(text) || isGeneralHelper(text)) return ["chief"];
    if (wantsOutbound(text)) return ["voice"];
    if (wantsSpend(text)) return ["ops"];
    return ["ops"];
  }
  const types: TypeId[] = [first.id];
  const second = ranked[1];
  if (second && second.score > 0 && first.score - second.score <= 0.6 && second.id !== first.id) {
    types.push(second.id);
  }
  return types;
}

export function overlapScore(a: string, b: string): number {
  const A = new Set(tokens(a));
  const B = new Set(tokens(b));
  if (A.size === 0 || B.size === 0) return 0;
  let inter = 0;
  for (const t of A) if (B.has(t)) inter += 1;
  return inter / new Set([...A, ...B]).size;
}

export function findDuplicate(types: TypeId[], job: string, active: ActiveRef[] | undefined): ActiveRef | null {
  if (!active || active.length === 0) return null;
  const primary = types[0];
  let best: { ref: ActiveRef; score: number } | null = null;
  for (const ref of active) {
    if (primary && !ref.types.includes(primary)) continue;
    const score = overlapScore(job, ref.job + " " + ref.name);
    if (!best || score > best.score) best = { ref, score };
  }
  if (best && best.score >= 0.28) return best.ref;
  return null;
}

function rarityOf(input: {
  general: boolean;
  jobClear: boolean;
  neverCount: number;
  tools: number;
  approval: boolean;
  duration: boolean;
}): Rarity {
  if (input.general || !input.jobClear) return "common";
  const rare = input.jobClear && input.tools > 0 && input.neverCount > 0 && input.approval;
  if (rare && input.duration) return "legendary";
  if (input.jobClear && input.neverCount > 0 && (input.tools > 0 || input.approval)) return "rare";
  if (input.jobClear) return "uncommon";
  return "common";
}

function riskOf(opts: { outbound: boolean; spend: boolean; merge: boolean; costume: boolean; neverCount: number }): Risk {
  if (opts.costume || ((opts.outbound || opts.spend || opts.merge) && opts.neverCount === 0)) return "high";
  if (opts.outbound || opts.spend || opts.merge) return "mid";
  return "low";
}

function jobLine(text: string, types: TypeId[]): string {
  const trimmed = text.replace(/\s+/g, " ").trim();
  if (!/general helper/.test(normalize(trimmed))) {
    const parts = trimmed.split(/[.!?]/).map((s) => s.trim()).filter(Boolean);
    const line = parts.find((p) => p.length > 12) ?? parts.join(". ");
    if (line && line.length > 12) return line.slice(0, 180);
  }
  const labels = types.map((t) => TYPE_META[t].label).join("/");
  return `Unclear ${labels} job. Needs a one-liner.`;
}

function coinName(text: string, types: TypeId[], verdict: Verdict): string {
  const named = text.match(/\bname:\s*([A-Za-z][A-Za-z0-9 _-]{1,24})/i);
  if (named?.[1]) return named[1].trim();
  const stripped = text.replace(/^\s*kind:\s*[a-z-]+\s*$/im, "").trim();
  const head = stripped.split(/\n/).map((s) => s.trim()).filter(Boolean);
  if (head[0] && head[1] && head[0].length <= 36 && /^[A-Za-z][A-Za-z0-9._-]{1,35}$/.test(head[0])) {
    return head[0];
  }
  const url = text.match(/x\.ai\/bot\/([a-z0-9-]{2,40})/i);
  if (url?.[1]) return url[1].replace(/-/g, " ");
  const s = normalize(text);
  if (/inbound leads|dms inbound|dm inbound/.test(s)) return "Lead Sprayer";
  if (/account health/.test(s)) return "Health Watch";
  if (/expense/.test(s)) return "Ledger-W";
  if (/general helper/.test(s)) return "Pal";
  if (/ceo of my life/.test(s)) return "Overlord-W";
  if (/merge/.test(s)) return "Mergemancer-W";
  if (isCostume(text)) return "Costume";
  const prefix = verdict === "SKIP" ? "Skip-" : verdict === "WATCH" ? "Watch-" : "Spec-";
  const t = types[0] ?? "ops";
  return prefix + TYPE_META[t].label;
}

function titleFor(types: TypeId[], verdict: Verdict): string {
  const labels = types.map((t) => TYPE_META[t].label).join("/");
  if (verdict === "SKIP") return `Rejected ${labels}`;
  if (verdict === "WATCH") return `Uncertain ${labels}`;
  return `${labels} specimen`;
}

function firstTask(verdict: Verdict, types: TypeId[], job: string): string {
  if (verdict === "SKIP") return "Do not create it. Write a never-list and a single job, then identify again.";
  if (verdict === "WATCH") return "Compare against the Active six. If it overlaps, box it. If it stays, add a never-list before any tool.";
  const label = TYPE_META[types[0] ?? "ops"].label;
  return `One bounded ${label} task only: prove it can "${job.slice(0, 80)}" and write the output to a file. No extra tools.`;
}

export interface ClassifyOptions {
  active?: ActiveRef[];
  activeCount?: number;
}

export function classify(raw: string, options: ClassifyOptions = {}): IdentifyResult {
  const text = raw.trim();
  const id = idFromText(text || "empty");
  if (!text) {
    return {
      id,
      name: "Empty",
      title: "No specimen",
      types: ["ops"],
      job_one_liner: "Nothing pasted.",
      tools_guess: [],
      never_list: [],
      risk: "mid",
      rarity: "common",
      verdict: "SKIP",
      why: ["Empty paste. Not a job.", "Type a wish, a blurb, or an x.ai/bot URL."],
      first_training_task: "Paste a real job.",
      slot_advice: "do-not-create",
      kind: "grok-bot",
    };
  }

  const never = extractNeverList(text);
  const tools = guessTools(text);
  const types = pickTypes(text);
  const job = jobLine(text, types);
  const general = isGeneralHelper(text);
  const blob = isCeoBlob(text);
  const costume = isCostume(text);
  const outbound = wantsOutbound(text);
  const spend = wantsSpend(text);
  const merge = isMergeHappy(text);
  const approval = hasApproval(text);
  const schedule = hasSchedule(text);
  const jobClear = !general && !blob && !costume && job.length > 12 && !/unclear/i.test(job);
  const dup = findDuplicate(types, job + " " + text, options.active);
  const cute = /\bcute\b|\buwu\b|unclear owner/.test(normalize(text)) && !jobClear;

  const rarity = rarityOf({
    general: general || blob || costume,
    jobClear,
    neverCount: never.length,
    tools: tools.length,
    approval,
    duration: hasDuration(text),
  });
  const risk = riskOf({ outbound, spend, merge, costume, neverCount: never.length });

  let verdict: Verdict = "WATCH";
  const why: string[] = [];

  if (costume) {
    verdict = "SKIP";
    why.push("Avatar, no owner, no job. Stamp Skip.");
  } else if (blob || (general && never.length === 0)) {
    verdict = "SKIP";
    why.push("One blob job that tries to do everything. Stamp Skip.");
    why.push("Give it a single type: Scout, Scribe, Ops, Forge, Sense, Voice, Keep, or Chief. Identify again.");
  } else if ((outbound || spend) && never.length === 0) {
    verdict = "SKIP";
    why.push("Outbound or spend with no never-list. Stamp Skip.");
    why.push("Write the fence first: never contact, never pay, never send. Identify again.");
  } else if (merge) {
    verdict = "WATCH";
    why.push("Forge that wants to merge with no approval gate. Stamp Watch.");
  } else if (dup) {
    verdict = "WATCH";
    why.push(`You already have a ${TYPE_META[types[0] ?? "ops"].label}: ${dup.name}. Same job. Stamp Watch.`);
  } else if (cute || (!jobClear && never.length === 0)) {
    verdict = "WATCH";
    why.push("Cute name or unclear owner. Weak job, no fence. Stamp Watch.");
  } else if (jobClear && (never.length > 0 || schedule || tools.length > 0 || approval)) {
    verdict = "CATCH";
    why.push("One job plus a boundary, a schedule, or tools. Stamp Catch.");
  } else if (general) {
    verdict = "SKIP";
    why.push("Still a general helper. Stamp Skip.");
  } else {
    verdict = "WATCH";
    why.push("Job is thin. Add a never-list before Catch.");
  }

  if (outbound && never.length > 0) {
    why.push("Outbound instinct is present. The never-list is the fence.");
  }
  if (types[0] === "sense" && /account health/.test(normalize(text))) {
    why.push("Sense: reads the account. Leaves customers alone.");
  }
  if (why.length < 2) {
    why.push(schedule ? "Has a schedule. That is how you keep six small." : "One job, or Skip it.");
  }

  let slot_advice: SlotAdvice = "box";
  if (verdict === "SKIP") slot_advice = "do-not-create";
  else if (verdict === "CATCH" && (options.activeCount ?? 0) < 6 && !dup) slot_advice = "pin";
  else slot_advice = "box";

  if (verdict === "CATCH" && (options.activeCount ?? 0) >= 6) {
    why.push("Active six is full. Catch still writes the Index. Box it or replace a slot.");
  }

  const kind = detectKind(text);
  if (kind === "clock") {
    if ((options.activeCount ?? 0) >= 6) {
      verdict = "WATCH";
      slot_advice = "box";
      why.unshift("Six is full. A clock off the six is a WATCH. Kill it or replace a hole.");
    } else {
      why.unshift("This is a clock. It spends an attention hole. Only the six may tick.");
      if (verdict === "CATCH" && !dup) slot_advice = "pin";
    }
  }

  const name = coinName(text, types, verdict);
  return {
    id,
    name,
    title: titleFor(types, verdict),
    types,
    job_one_liner: job,
    tools_guess: tools,
    never_list: never,
    risk,
    rarity,
    verdict,
    why: why.slice(0, 4),
    first_training_task: firstTask(verdict, types, job),
    slot_advice,
    kind,
  };
}

export function resultToSpecimen(result: IdentifyResult, origin: "wild" | "duplicate" | "spawned" | "stub" = "wild") {
  const types: IdentifyResult["types"] extends TypeId[] ? [TypeId] | [TypeId, TypeId] : never = (
    result.types.length >= 2 && result.types[0] && result.types[1]
      ? [result.types[0], result.types[1]]
      : [result.types[0] ?? "ops"]
  ) as [TypeId] | [TypeId, TypeId];
  return {
    id: result.id,
    name: result.name,
    title: result.title,
    types,
    job: result.job_one_liner,
    never_list: result.never_list,
    tools: result.tools_guess,
    rarity: result.rarity,
    risk: result.risk,
    origin,
    flavor: result.why[0] ?? "Wild encounter.",
    kind: result.kind ?? "grok-bot",
    sourceUrl: result.sourceUrl,
  };
}

export function seedActiveRefs(): ActiveRef[] {
  return DEX.filter((s) => s.origin === "spawned").slice(0, 0);
}
