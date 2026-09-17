import { TYPE_IDS, specimenToIdentify, type IdentifyResult, type SaveFile, type Specimen, type TypeId } from "../data/types";

function isTypeId(value: string): value is TypeId {
  return (TYPE_IDS as readonly string[]).includes(value);
}

export function exportChallenge(save: SaveFile, brief: string): string {
  const lines = ["# CHALLENGE", `Trainer: ${save.trainerName || "Trainer"}`, `Brief: ${brief.trim() || "Write a weekly account-health file. Never contact a customer."}`, ""];
  save.activeIds.forEach((id, i) => {
    const spec = id ? save.caught.find((s) => s.id === id) : undefined;
    if (!spec) return;
    lines.push(`### ${i + 1}`);
    lines.push(`name: ${spec.name}`);
    lines.push(`types: ${spec.types.join("|")}`);
    lines.push(`job: ${spec.job}`);
    lines.push(`never_list: ${spec.never_list.join(" | ")}`);
    lines.push("");
  });
  return lines.join("\n").trim() + "\n";
}

export function looksLikeChallenge(text: string): boolean {
  return /^\s*#\s*CHALLENGE\b/im.test(text);
}

function specimenFromBlock(block: string, index: number): Specimen | null {
  const name = block.match(/^name:\s*(.+)$/im)?.[1]?.trim();
  if (!name) return null;
  const typesRaw = (block.match(/^types:\s*(.+)$/im)?.[1] ?? "ops").split(/[|,]/).map((t) => t.trim().toLowerCase());
  const types = typesRaw.filter(isTypeId);
  const job = block.match(/^job:\s*(.+)$/im)?.[1]?.trim() || name;
  const never = (block.match(/^never_list:\s*(.+)$/im)?.[1] ?? "")
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean);
  const t0 = types[0] ?? "ops";
  const typed: [TypeId] | [TypeId, TypeId] = types[1] ? [t0, types[1]] : [t0];
  return {
    id: `chal-${index}-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 24)}`,
    name,
    title: name,
    types: typed,
    job,
    never_list: never,
    tools: [],
    rarity: never.length ? "rare" : "common",
    risk: never.length ? "low" : "mid",
    origin: "wild",
    flavor: job,
  };
}

export function parseChallenge(md: string): { trainer: string; brief: string; side: IdentifyResult[] } {
  const trainer = md.match(/^Trainer:\s*(.+)$/im)?.[1]?.trim() || "Trainer";
  const brief = md.match(/^Brief:\s*(.+)$/im)?.[1]?.trim() || "";
  const chunks = md.split(/^###\s+/m).slice(1);
  const side: IdentifyResult[] = [];
  chunks.forEach((chunk, i) => {
    const spec = specimenFromBlock(chunk, i);
    if (spec) side.push(specimenToIdentify(spec));
  });
  return { trainer, brief, side };
}
