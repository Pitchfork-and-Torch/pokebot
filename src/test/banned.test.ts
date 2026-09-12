import { describe, expect, it } from "vitest";
import { BANNED_MARKS, MORE_LINKS, NAV, PRODUCT } from "../data/copy";
import { DEX } from "../data/dex";
import { FIELD_NEW } from "../data/fieldWilds";

describe("legal posture", () => {
  it("does not use Nintendo product nouns on seed cards", () => {
    const blob = [...DEX, ...FIELD_NEW].map((s) => `${s.name} ${s.title} ${s.job} ${s.flavor}`).join(" ").toLowerCase();
    for (const mark of BANNED_MARKS) {
      expect(blob.includes(mark)).toBe(false);
    }
  });

  it("names the catalog Botdex, not a Nintendo mark", () => {
    const blob = `${PRODUCT.title} ${NAV.map((n) => n.title + n.label).join(" ")} ${MORE_LINKS.map((n) => n.title + n.label).join(" ")}`.toLowerCase();
    expect(blob.includes("botdex")).toBe(true);
    expect(blob.includes("pokedex")).toBe(false);
  });
});
