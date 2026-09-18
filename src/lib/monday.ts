import { specimenToIdentify, type MondayReport, type MondaySlot, type SaveFile, type SlotAction, type Specimen } from "../data/types";
import { scoreSpecimen, total } from "./gym";
import { cheapestKill } from "./ingest";
import { capUsed, typeHoles } from "./pressure";
import { kindOf } from "./roster";

export function legendaryAgeDays(stamp: string | undefined, now = Date.now()): number | null {
  if (!stamp) return null;
  const iso = stamp.length === 10 ? stamp + "T00:00:00Z" : stamp;
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return null;
  const days = Math.floor((now - t) / 86_400_000);
  // Future stamps (clock skew / typo) must not report negative "Legendary stamp -Nd".
  if (days < 0) return null;
  return days;
}

function decide(spec: Specimen | undefined, sum: number, save: SaveFile): { action: SlotAction; note: string } {
  if (!spec) return { action: "empty", note: "Hole. Pin a Catch or stay at five." };
  if (spec.origin === "stub") return { action: "box", note: "Unidentified. Identify or release. Do not leave it Active." };
  if (spec.origin === "duplicate") return { action: "box", note: "Same animal as another slot. One Scout is enough." };
  if (kindOf(spec) === "clock" && sum < 11) {
    return { action: "box", note: "Kill the clock. It is on the six and losing the brief." };
  }
  if (spec.never_list.length === 0) return { action: "rewrite-never", note: "No fence. Rewrite the never-list before Monday send." };
  if (spec.risk === "high") return { action: "box", note: "High risk on the six. Box it." };
  if (sum < 11) return { action: "box", note: "Lost the brief. Box or retrain with one task." };
  const age = legendaryAgeDays(save.legendaryStamps[spec.id]);
  if (age == null) return { action: "keep", note: "Owns the brief. Keep." };
  if (age < 30) return { action: "keep", note: `Owns the brief. Legendary stamp ${age}d, not 30 yet.` };
  return { action: "keep", note: `Owns the brief. Legendary: ${age}d owned outcome holds.` };
}

export function mondayGym(save: SaveFile, brief: string): MondayReport {
  const slots: MondaySlot[] = save.activeIds.map((id, slot) => {
    const spec = id ? save.caught.find((s) => s.id === id) : undefined;
    const scores = spec ? scoreSpecimen(specimenToIdentify(spec), brief) : null;
    const sum = scores ? total(scores) : 0;
    const { action, note } = decide(spec, sum, save);
    return {
      slot: slot + 1,
      id,
      name: spec?.name ?? "empty",
      total: sum,
      scores,
      action,
      note,
    };
  });
  const kill = cheapestKill(save.caught);
  return {
    id: `mon-${Date.now()}`,
    at: new Date().toISOString(),
    brief,
    slots,
    cap: capUsed(save),
    holes: typeHoles(save),
    cheapestKill: kill?.name ?? null,
    keep: slots.filter((s) => s.action === "keep").length,
    box: slots.filter((s) => s.action === "box").length,
  };
}
