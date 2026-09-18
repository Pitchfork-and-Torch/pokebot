import { TYPE_IDS, type IdentifyResult, type Specimen, type TypeId } from "../data/types";

const RARITY = new Set(["common", "uncommon", "rare", "legendary"]);
const RISK = new Set(["low", "mid", "high"]);
const VERDICT = new Set(["CATCH", "WATCH", "SKIP"]);
const ORIGIN = new Set(["spawned", "wild", "duplicate", "stub"]);

export function assertSpecimen(value: unknown): Specimen {
  if (!value || typeof value !== "object") throw new Error("specimen: not an object");
  const s = value as Specimen;
  if (typeof s.id !== "string" || s.id.length < 1) throw new Error("specimen.id");
  if (typeof s.name !== "string" || s.name.length < 1) throw new Error("specimen.name");
  if (typeof s.title !== "string") throw new Error("specimen.title");
  if (!Array.isArray(s.types) || s.types.length < 1 || s.types.length > 2) throw new Error("specimen.types");
  for (const t of s.types) {
    if (!(TYPE_IDS as readonly string[]).includes(t)) throw new Error("specimen.type");
  }
  if (typeof s.job !== "string") throw new Error("specimen.job");
  if (!Array.isArray(s.never_list) || !Array.isArray(s.tools)) throw new Error("specimen lists");
  if (!RARITY.has(s.rarity) || !RISK.has(s.risk) || !ORIGIN.has(s.origin)) throw new Error("specimen enums");
  if (typeof s.flavor !== "string") throw new Error("specimen.flavor");
  return s;
}

export function assertIdentify(value: unknown): IdentifyResult {
  if (!value || typeof value !== "object") throw new Error("identify: not an object");
  const r = value as IdentifyResult;
  if (typeof r.id !== "string") throw new Error("identify.id");
  if (typeof r.name !== "string") throw new Error("identify.name");
  if (!Array.isArray(r.types) || r.types.length < 1) throw new Error("identify.types");
  for (const t of r.types) {
    if (!(TYPE_IDS as readonly TypeId[]).includes(t)) throw new Error("identify.type");
  }
  if (typeof r.job_one_liner !== "string") throw new Error("identify.job");
  if (!Array.isArray(r.tools_guess) || !Array.isArray(r.never_list) || !Array.isArray(r.why)) {
    throw new Error("identify lists");
  }
  if (r.why.length < 1 || r.why.length > 4) throw new Error("identify.why length");
  if (!RARITY.has(r.rarity) || !RISK.has(r.risk) || !VERDICT.has(r.verdict)) throw new Error("identify enums");
  if (!["pin", "box", "do-not-create"].includes(r.slot_advice)) throw new Error("identify.slot");
  if (typeof r.first_training_task !== "string") throw new Error("identify.task");
  return r;
}
