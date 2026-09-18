import { describe, expect, it } from "vitest";
import { DEX } from "../data/dex";
import { fieldBook, markOf, wildBook } from "../lib/botdex";
import { classify } from "../lib/classify";
import { stampHearing, startLane } from "../lib/docket";
import { blankSave } from "../lib/storage";

describe("botdex", () => {
  it("numbers every field plate from 001", () => {
    const field = fieldBook(blankSave());
    expect(field).toHaveLength(DEX.length);
    expect(field[0]?.no).toBe("001");
    expect(field[0]?.name).toBe("PokeBot");
    expect(field.every((e) => e.mark === "unseen")).toBe(true);
  });

  it("marks a caught field plate", () => {
    const flick = DEX.find((s) => s.id === "flick");
    if (!flick) throw new Error("flick");
    const save = { ...blankSave(), caught: [flick], seenIds: [flick.id] };
    expect(markOf(save, "flick", "Flick")).toBe("caught");
    expect(fieldBook(save).find((e) => e.id === "flick")?.mark).toBe("caught");
  });

  it("adds a wild plate for a hearing that is not a field name", () => {
    const result = classify("Own weekly account health. Never contact a customer.");
    const save = {
      ...blankSave(),
      seenIds: [result.id],
      encounters: [
        {
          id: "e1",
          at: new Date().toISOString(),
          input: "Own weekly account health. Never contact a customer.",
          result,
          action: "catch" as const,
        },
      ],
    };
    const wild = wildBook(save);
    expect(wild.length).toBeGreaterThan(0);
    expect(wild[0]?.no).toBe("W01");
    expect(wild.some((e) => e.name === "Flick")).toBe(false);
  });

  it("keeps lane catches that are not seed names on the wild book", () => {
    let save = startLane(blankSave());
    save = stampHearing(save, "skip").save;
    save = stampHearing(save, "catch").save;
    const wild = wildBook(save);
    expect(wild.length).toBeGreaterThan(0);
    expect(fieldBook(save).every((e) => e.id !== wild[0]?.id)).toBe(true);
  });

  it("does not use Nintendo catalog nouns", () => {
    const blob = `${fieldBook(blankSave())
      .map((e) => e.name)
      .join(" ")} botdex field wild`.toLowerCase();
    expect(blob.includes("pokedex")).toBe(false);
    expect(blob.includes("pokémon")).toBe(false);
    expect(blob.includes("pokemon")).toBe(false);
  });
});
