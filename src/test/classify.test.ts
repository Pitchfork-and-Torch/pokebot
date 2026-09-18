import { describe, expect, it } from "vitest";
import { classify, extractNeverList, wantsOutbound } from "../lib/classify";
import type { ActiveRef } from "../data/types";

const flick: ActiveRef = {
  id: "flick",
  name: "Flick",
  types: ["scout"],
  job: "Research people, news, and competitive intel. Return sources, not vibes.",
};

describe("classify", () => {
  it("skips a general helper", () => {
    const r = classify("I want a general helper that does everything");
    expect(r.verdict).toBe("SKIP");
    expect(r.slot_advice).toBe("do-not-create");
  });

  it("skips or watches DM inbound leads and lectures about never-list", () => {
    const r = classify("I need a bot that DMs inbound leads every morning.");
    expect(["SKIP", "WATCH"]).toContain(r.verdict);
    expect(r.verdict).toBe("SKIP");
    expect(r.why.join(" ").toLowerCase()).toMatch(/never-list|never list|fence/);
    expect(wantsOutbound("I need a bot that DMs inbound leads every morning.")).toBe(true);
  });

  it("catches weekly account health with never contact as Sense", () => {
    const r = classify("Own weekly account health. Never contact a customer.");
    expect(r.verdict).toBe("CATCH");
    expect(r.types).toContain("sense");
    expect(r.never_list.length).toBeGreaterThan(0);
    expect(wantsOutbound("Own weekly account health. Never contact a customer.")).toBe(false);
  });

  it("catches an expense manager with a hard never-list", () => {
    const r = classify(
      "Own company expenses in a spreadsheet. Never pay a vendor. Never store card numbers. Never email a merchant.",
    );
    expect(r.verdict).toBe("CATCH");
    expect(r.types.some((t) => t === "ops" || t === "sense")).toBe(true);
    expect(extractNeverList("Never pay a vendor. Never store card numbers.").length).toBeGreaterThan(1);
  });

  it("skips a costume meme with no job", () => {
    const r = classify("Basedpepe. Be a meme. No owner. No job.");
    expect(r.verdict).toBe("SKIP");
  });

  it("watches a duplicate of Flick", () => {
    const r = classify(
      "Glimmer: research people, news, and competitive intel. Return sources, not vibes.",
      { active: [flick], activeCount: 1 },
    );
    expect(r.verdict).toBe("WATCH");
    expect(r.why.join(" ")).toMatch(/Flick/);
  });

  it("skips a CEO of my life blob", () => {
    const r = classify("Be the CEO of my life. Run my life. Do everything.");
    expect(r.verdict).toBe("SKIP");
  });

  it("catches a nightly digest that only writes a file", () => {
    const r = classify(
      "Nightly digest. Once a night, write a digest file. Never email the digest. Never post. Never contact anyone.",
    );
    expect(r.verdict).toBe("CATCH");
    expect(r.types.some((t) => t === "ops" || t === "scout")).toBe(true);
  });

  it("watches or skips a merge-happy coding bot", () => {
    const r = classify("Write code and merge it to main. Auto-merge. Keep main green by force.");
    expect(["WATCH", "SKIP"]).toContain(r.verdict);
    expect(r.verdict).not.toBe("CATCH");
  });

  it("skips outbound plus spend with no never-list", () => {
    const r = classify("Find deals and purchase them with the saved card. Also DM strangers.");
    expect(r.verdict).toBe("SKIP");
  });

  it("names a skill from the line under kind:", () => {
    const r = classify("kind: skill\nutf8-hygiene\nKeep public copy ASCII. Never publish secrets.");
    expect(r.kind).toBe("skill");
    expect(r.name).toBe("utf8-hygiene");
  });

  it("watches a clock when the six is full", () => {
    const r = classify("kind: clock\nAM-Shift\nEvery Monday gym. Never install a PC task.", { activeCount: 6 });
    expect(r.kind).toBe("clock");
    expect(r.verdict).toBe("WATCH");
    expect(r.why.join(" ").toLowerCase()).toMatch(/clock/);
  });

  it("writes rulings in the affirmative", () => {
    const blob = [
      classify("I need a bot that DMs inbound leads every morning."),
      classify("Own weekly account health. Never contact a customer."),
      classify("Basedpepe. Be a meme. No owner. No job."),
      classify("Be the CEO of my life. Run my life. Do everything."),
      classify("Glimmer: research people, news, and competitive intel. Return sources, not vibes.", {
        active: [flick],
        activeCount: 1,
      }),
    ]
      .map((r) => r.why.join(" "))
      .join("\n")
      .toLowerCase();
    expect(blob.includes("this is not")).toBe(false);
    expect(blob.includes("fighter")).toBe(false);
    expect(blob.includes("zoo")).toBe(false);
    expect(blob.includes("new hat")).toBe(false);
  });

  it("catches a roster chief with cap math", () => {
    const r = classify(
      "Own the Grok Bot roster. Weekly review of the Active six. Cap 50. Never spawn a new bot without a Catch card. Never contact anyone.",
    );
    expect(r.verdict).toBe("CATCH");
    expect(r.types).toContain("chief");
  });

  it("watches a cute unclear owner", () => {
    const r = classify("Uwubot. Cute. Unclear owner. Be supportive and cute.");
    expect(["WATCH", "SKIP"]).toContain(r.verdict);
    expect(r.verdict).not.toBe("CATCH");
  });
});
