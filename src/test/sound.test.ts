import { describe, expect, it } from "vitest";
import { CHIP, type ChipKind } from "../lib/sound";

const KINDS: ChipKind[] = ["boot", "click", "mode", "identify", "catch", "skip", "watch", "warn", "a", "b", "power"];

describe("chip table", () => {
  it("has a square-led palette for every kind", () => {
    for (const kind of KINDS) {
      expect(CHIP[kind].freqs.length).toBeGreaterThan(0);
      expect(CHIP[kind].dur).toBeGreaterThan(0);
      expect(CHIP[kind].gain).toBeLessThan(0.1);
    }
  });

  it("keeps catch above skip (major vs drop)", () => {
    const catchMax = Math.max(...CHIP.catch.freqs);
    const skipMin = Math.min(...CHIP.skip.freqs);
    expect(catchMax).toBeGreaterThan(skipMin);
  });
});
