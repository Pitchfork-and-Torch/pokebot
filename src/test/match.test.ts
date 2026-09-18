import { describe, expect, it } from "vitest";
import { parseChallenge, exportChallenge, looksLikeChallenge } from "../lib/challenge";
import { playMatch } from "../lib/gym";
import { classifyPublicTemplate } from "../lib/wildLink";
import { blankSave } from "../lib/storage";
import dewey from "./fixtures/share-dewey.html?raw";
import { classify } from "../lib/classify";
import { specimenToIdentify } from "../data/types";

describe("brief match", () => {
  it("gives Pulse the health brief over Spray", () => {
    const brief = "Write a weekly account-health file. Never contact a customer.";
    const pulse = classify("Own weekly account health. Never contact a customer.");
    const spray = classify("I need a bot that DMs inbound leads every morning.");
    const played = playMatch(brief, pulse, spray);
    expect(played.slams).toHaveLength(3);
    expect(played.slams.map((s) => s.id)).toEqual(["job", "fence", "hold"]);
    expect(played.record.winner).toBe("a");
    expect(played.slams.find((s) => s.id === "fence")?.winner).toBe("a");
  });

  it("classifies a Dewey-shaped public template", () => {
    const r = classifyPublicTemplate(dewey);
    expect(r.name).toMatch(/Dewey/i);
    expect(r.never_list.length).toBeGreaterThan(0);
    expect(r.verdict).not.toBe("SKIP");
  });
});

describe("challenge slip", () => {
  it("round-trips the Active six", () => {
    const save = blankSave();
    save.trainerName = "Ada";
    save.caught = [
      {
        id: "pulse",
        name: "Pulse",
        title: "Sense",
        types: ["sense"],
        job: "Own weekly account health",
        never_list: ["Never contact a customer"],
        tools: ["file"],
        rarity: "rare",
        risk: "low",
        origin: "wild",
        flavor: "ok",
      },
    ];
    save.activeIds[0] = "pulse";
    const md = exportChallenge(save, "Write a weekly account-health file. Never contact a customer.");
    expect(looksLikeChallenge(md)).toBe(true);
    const parsed = parseChallenge(md);
    expect(parsed.trainer).toBe("Ada");
    expect(parsed.side[0]?.name).toBe("Pulse");
    expect(parsed.side[0]?.never_list.join(" ")).toMatch(/Never contact/);
    const ident = specimenToIdentify(save.caught[0]!);
    expect(ident.name).toBe("Pulse");
  });
});
