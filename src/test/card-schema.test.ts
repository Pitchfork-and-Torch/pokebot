import { describe, expect, it } from "vitest";
import { DEX } from "../data/dex";
import { classify } from "../lib/classify";
import { assertIdentify, assertSpecimen } from "../lib/cardSchema";
import { modelFromSave } from "../lib/shareCard";
import { blankSave } from "../lib/storage";

describe("card schema", () => {
  it("validates every seed specimen", () => {
    expect(DEX.length).toBeGreaterThanOrEqual(24);
    for (const s of DEX) {
      expect(assertSpecimen(s).id).toBe(s.id);
    }
  });

  it("validates classifier output shape", () => {
    const r = classify("Own weekly account health. Never contact a customer.");
    expect(assertIdentify(r).verdict).toBe("CATCH");
  });

  it("builds a share model from save", () => {
    const save = blankSave();
    save.trainerName = "Ada";
    const model = modelFromSave(save);
    expect(model.trainerName).toBe("Ada");
    expect(model.stamp).toBe("TEAM");
    expect(model.attention).toBe(0);
    expect(model.bots).toBe(0);
  });
});
