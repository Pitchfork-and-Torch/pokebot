import { TYPE_IDS, TYPE_META, type SaveFile, type TypeId } from "../data/types";
import { cheapestKill } from "./ingest";
import { accountUsed, kindOf } from "./roster";

export function activeTypes(save: SaveFile): TypeId[] {
  const found: TypeId[] = [];
  for (const id of save.activeIds) {
    if (!id) continue;
    const spec = save.caught.find((s) => s.id === id);
    if (!spec) continue;
    for (const t of spec.types) {
      if (!found.includes(t)) found.push(t);
    }
  }
  return found;
}

export function typeHoles(save: SaveFile): TypeId[] {
  const have = new Set(activeTypes(save));
  return TYPE_IDS.filter((t) => !have.has(t));
}

export function capUsed(save: SaveFile): number {
  return accountUsed(save.caught, save.declaredExisting ?? 0);
}

export function pressureLines(save: SaveFile): string[] {
  const lines: string[] = [];
  const used = capUsed(save);
  const declared = save.declaredExisting ?? 0;
  const emptySlots = save.activeIds.filter((id) => id === null).length;

  const botsIndexed = save.caught.filter((s) => kindOf(s) === "grok-bot").length;
  const otherKinds = save.caught.length - botsIndexed;

  if (!save.censusDone) {
    lines.push("Census missing. How many bots already live on the account?");
  } else if (declared > 0) {
    lines.push(`${declared} already on the account, plus ${botsIndexed} bots in this Index = ${used}/50.`);
  } else if (otherKinds > 0) {
    lines.push(`${otherKinds} non-bot specimen${otherKinds === 1 ? "" : "s"} sit on ATTN, not BOTS 50.`);
  }

  if (used >= 48) {
    const kill = cheapestKill(save.caught);
    lines.push(kill ? `Hard-warn. Cheapest kill: ${kill.name}.` : "Hard-warn. The next Catch is how accounts die.");
  } else if (used >= 40) {
    const kill = cheapestKill(save.caught);
    lines.push(kill ? `Forty. Release ${kill.name} before Catch.` : "Forty. Every Catch now needs a Release.");
  }
  else if (used >= 24) lines.push("Halfway to the wall. Box costumes before they fossilize.");

  if (emptySlots > 0 && save.caught.length > 0) {
    lines.push(`${emptySlots} Active hole${emptySlots === 1 ? "" : "s"}. Six is the team. Box is storage.`);
  }

  const holes = typeHoles(save);
  if (save.activeIds.some(Boolean) && holes.includes("sense")) {
    lines.push("No Sense on the six. Account health is nobody's job.");
  } else if (save.activeIds.some(Boolean) && holes.includes("forge")) {
    lines.push("No Forge on the six. Patches will come from a costume.");
  } else if (save.activeIds.filter(Boolean).length >= 2 && holes.length >= 6) {
    const labels = holes.slice(0, 3).map((t) => TYPE_META[t].label).join(", ");
    lines.push(`Coverage holes: ${labels}.`);
  }

  return lines.slice(0, 2);
}
