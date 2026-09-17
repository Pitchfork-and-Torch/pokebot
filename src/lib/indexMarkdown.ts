import { isTypeId, type Origin, type SaveFile, type Specimen, type TypeId } from "../data/types";
import { accountUsed, emptyActive } from "./roster";

function listLine(items: string[]): string {
  return items.join(" | ");
}

function specBlock(s: Specimen): string {
  const types = s.types.join(", ");
  return [
    `### ${s.name}`,
    `- id: ${s.id}`,
    `- title: ${s.title}`,
    `- types: ${types}`,
    `- job: ${s.job}`,
    `- never_list: ${listLine(s.never_list)}`,
    `- tools: ${listLine(s.tools)}`,
    `- rarity: ${s.rarity}`,
    `- risk: ${s.risk}`,
    `- origin: ${s.origin}`,
    `- kind: ${s.kind ?? "grok-bot"}`,
    `- flavor: ${s.flavor}`,
    "",
  ].join("\n");
}

export function looksLikeIndex(text: string): boolean {
  return /^\s*# INDEX\b/m.test(text) && /## Active/.test(text);
}

export function exportIndex(save: SaveFile): string {
  const active = save.activeIds
    .map((id) => (id ? save.caught.find((s) => s.id === id) : undefined))
    .filter((s): s is Specimen => Boolean(s));
  const boxed = save.caught.filter((s) => save.boxedIds.includes(s.id) && !save.activeIds.includes(s.id));
  const stubs = save.caught.filter((s) => s.origin === "stub");
  const used = accountUsed(save.caught, save.declaredExisting ?? 0);
  const activeCount = save.activeIds.filter(Boolean).length;
  return [
    "# INDEX",
    "",
    `Trainer: ${save.trainerName}`,
    `Cap used: ${used} / 50`,
    `Attention: ${activeCount} / 6`,
    `Active: ${activeCount} / 6`,
    `Declared unnamed: ${save.declaredExisting ?? 0}`,
    "",
    "## Active",
    "",
    active.length ? active.map(specBlock).join("") : "_none_\n",
    "## Boxed",
    "",
    boxed.length ? boxed.map(specBlock).join("") : "_none_\n",
    "## Stubs",
    "",
    stubs.length ? stubs.map(specBlock).join("") : "_none_\n",
    "## Released",
    "",
    save.releasedIds.length ? save.releasedIds.map((id) => `- ${id}`).join("\n") + "\n" : "_none_\n",
  ].join("\n");
}

function parseList(value: string): string[] {
  if (!value || value === "_none_") return [];
  return value.split("|").map((s) => s.trim()).filter(Boolean);
}

function parseSpec(block: string): Specimen | null {
  const name = block.match(/^###\s+(.+)$/m)?.[1]?.trim();
  if (!name) return null;
  const field = (key: string) => block.match(new RegExp(`^- ${key}:\\s*(.*)$`, "m"))?.[1]?.trim() ?? "";
  const typeRaw = parseList(field("types").replace(/,/g, "|"));
  const types = typeRaw.filter(isTypeId) as TypeId[];
  const originRaw = field("origin") as Origin;
  const origin: Origin = ["spawned", "wild", "duplicate", "stub"].includes(originRaw) ? originRaw : "wild";
  const rarity = field("rarity");
  const risk = field("risk");
  return {
    id: field("id") || name.toLowerCase().replace(/\s+/g, "-"),
    name,
    title: field("title") || name,
    types: types.length >= 2 && types[0] && types[1] ? [types[0], types[1]] : [types[0] ?? "ops"],
    job: field("job"),
    never_list: parseList(field("never_list")),
    tools: parseList(field("tools")),
    rarity: rarity === "uncommon" || rarity === "rare" || rarity === "legendary" ? rarity : "common",
    risk: risk === "high" || risk === "mid" ? risk : "low",
    origin,
    flavor: field("flavor"),
    kind: (["grok-bot", "skill", "mcp", "clock", "telegram", "other"].includes(field("kind"))
      ? field("kind")
      : "grok-bot") as Specimen["kind"],
  };
}

function sectionSpecs(md: string, heading: string): Specimen[] {
  const re = new RegExp(`## ${heading}\\s*([\\s\\S]*?)(?=\\n## |$)`);
  const body = md.match(re)?.[1] ?? "";
  if (body.includes("_none_")) return [];
  const parts = body.split(/^### /m).slice(1);
  const out: Specimen[] = [];
  for (const part of parts) {
    const spec = parseSpec("### " + part);
    if (spec) out.push(spec);
  }
  return out;
}

export function importIndex(raw: string, base: SaveFile): SaveFile {
  // pack/templates/INDEX.md ends with a schema comment whose "- id:" lines would otherwise read as released ids.
  const markdown = raw.replace(/<!--[\s\S]*?-->/g, "");
  const trainer = markdown.match(/^Trainer:\s*(.+)$/m)?.[1]?.trim() || base.trainerName;
  const unnamed = Number(markdown.match(/^Declared unnamed:\s*(\d+)/m)?.[1] ?? base.declaredExisting ?? 0);
  const activeSpecs = sectionSpecs(markdown, "Active");
  const boxedSpecs = sectionSpecs(markdown, "Boxed");
  const stubSpecs = sectionSpecs(markdown, "Stubs");
  const byId = new Map<string, Specimen>();
  for (const s of [...boxedSpecs, ...stubSpecs, ...activeSpecs]) byId.set(s.id, s);
  const caught = [...byId.values()];
  const activeIds = emptyActive();
  activeSpecs.slice(0, 6).forEach((s, i) => {
    activeIds[i] = s.id;
  });
  const activeSet = new Set(activeSpecs.map((s) => s.id));
  const boxedIds = [...new Set([...boxedSpecs, ...stubSpecs].map((s) => s.id))].filter((id) => !activeSet.has(id));
  const relBody = markdown.match(/(?:^|\n)## Released\s*([\s\S]*?)(?=\n## |$)/)?.[1] ?? "";
  const releasedIds: string[] = [];
  for (const m of relBody.matchAll(/^- (\S+)/gm)) {
    if (m[1] && m[1] !== "_none_" && !releasedIds.includes(m[1])) releasedIds.push(m[1]);
  }
  return {
    ...base,
    trainerName: trainer,
    declaredExisting: Math.max(0, Math.min(50, unnamed)),
    censusDone: true,
    caught,
    boxedIds,
    activeIds,
    releasedIds,
  };
}
