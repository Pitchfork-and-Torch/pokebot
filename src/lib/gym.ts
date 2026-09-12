import type { GymRecord, GymScores, IdentifyResult } from "../data/types";
import { overlapScore, wantsOutbound, wantsSpend } from "./classify";

function clampScore(n: number): number {
  if (n < 0) return 0;
  if (n > 5) return 5;
  return Math.round(n);
}

export function scoreSpecimen(spec: IdentifyResult, brief: string): GymScores {
  const overlap = overlapScore(spec.job_one_liner + " " + spec.types.join(" "), brief);
  const correctness = clampScore(1 + overlap * 8);
  const toolDiscipline = clampScore(spec.tools_guess.length === 0 ? 2 : Math.min(5, 2 + spec.tools_guess.length));
  const dangerous = wantsOutbound(brief) || wantsSpend(brief);
  const neverList = spec.never_list.length === 0 ? (dangerous ? 0 : 2) : clampScore(3 + spec.never_list.length);
  const babysit =
    spec.risk === "high" ? 1 : spec.risk === "mid" ? 3 : spec.verdict === "CATCH" ? 5 : 4;
  return { correctness, toolDiscipline, neverList, babysit };
}

export function total(scores: GymScores): number {
  return scores.correctness + scores.toolDiscipline + scores.neverList + scores.babysit;
}

export function runGym(brief: string, a: IdentifyResult, b: IdentifyResult): GymRecord {
  const aScores = scoreSpecimen(a, brief);
  const bScores = scoreSpecimen(b, brief);
  const at = total(aScores);
  const bt = total(bScores);
  const winner: GymRecord["winner"] = at === bt ? "tie" : at > bt ? "a" : "b";
  return {
    id: `g-${Date.now()}`,
    at: new Date().toISOString(),
    brief,
    aName: a.name,
    bName: b.name,
    a: aScores,
    b: bScores,
    winner,
  };
}

export type SlamId = "job" | "fence" | "hold";

export interface Slam {
  id: SlamId;
  label: string;
  a: number;
  b: number;
  winner: "a" | "b" | "tie";
}

function holdScore(scores: GymScores): number {
  return clampScore((scores.toolDiscipline + scores.babysit) / 2);
}

export function slamsOf(record: GymRecord): Slam[] {
  const rows: { id: SlamId; label: string; a: number; b: number }[] = [
    { id: "job", label: "JOB", a: record.a.correctness, b: record.b.correctness },
    { id: "fence", label: "FENCE", a: record.a.neverList, b: record.b.neverList },
    { id: "hold", label: "HOLD", a: holdScore(record.a), b: holdScore(record.b) },
  ];
  return rows.map((row) => ({
    ...row,
    winner: row.a === row.b ? "tie" : row.a > row.b ? "a" : "b",
  }));
}

export function playMatch(brief: string, a: IdentifyResult, b: IdentifyResult): { record: GymRecord; slams: Slam[] } {
  const record = runGym(brief, a, b);
  return { record, slams: slamsOf(record) };
}
