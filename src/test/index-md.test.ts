import { describe, expect, it } from "vitest";
import { exportIndex, importIndex } from "../lib/indexMarkdown";
import { blankSave } from "../lib/storage";

describe("INDEX.md", () => {
  it("round-trips trainer, stubs, and active six", () => {
    const save = blankSave();
    save.trainerName = "Ada";
    save.declaredExisting = 12;
    save.censusDone = true;
    save.caught = [
      {
        id: "flick",
        name: "Flick",
        title: "Source Scout",
        types: ["scout"],
        job: "Research people",
        never_list: ["Never contact a subject"],
        tools: ["web search"],
        rarity: "rare",
        risk: "low",
        origin: "spawned",
        flavor: "Clear job",
      },
      {
        id: "stub-glimmer",
        name: "Glimmer",
        title: "Unidentified",
        types: ["ops"],
        job: "Unknown",
        never_list: [],
        tools: [],
        rarity: "common",
        risk: "mid",
        origin: "stub",
        flavor: "A name",
      },
    ];
    save.activeIds[0] = "flick";
    save.boxedIds = ["stub-glimmer"];
    const md = exportIndex(save);
    expect(md).toMatch(/Trainer: Ada/);
    expect(md).toMatch(/### Flick/);
    const back = importIndex(md, blankSave());
    expect(back.trainerName).toBe("Ada");
    expect(back.caught.map((c) => c.id).sort()).toEqual(["flick", "stub-glimmer"]);
    expect(back.activeIds[0]).toBe("flick");
    expect(back.boxedIds).toContain("stub-glimmer");
    expect(back.declaredExisting).toBe(12);
  });

  it("round-trips kind, attention, and a live-shaped six", () => {
    const save = blankSave();
    save.trainerName = "Ada";
    save.declaredExisting = 8;
    save.caught = [
      {
        id: "flick",
        name: "Flick",
        title: "Source Scout",
        types: ["scout"],
        job: "Research people",
        never_list: ["Never contact a subject"],
        tools: ["web search"],
        rarity: "rare",
        risk: "low",
        origin: "spawned",
        flavor: "Clear job",
        kind: "grok-bot",
      },
      {
        id: "hygiene",
        name: "utf8-hygiene",
        title: "ASCII fence",
        types: ["scribe"],
        job: "Keep public copy ASCII",
        never_list: ["Never publish secrets"],
        tools: ["file"],
        rarity: "uncommon",
        risk: "low",
        origin: "wild",
        flavor: "Skill, not a bot",
        kind: "skill",
      },
      {
        id: "am-shift",
        name: "AM Shift",
        title: "Clock",
        types: ["ops"],
        job: "Monday gym reminder",
        never_list: ["Never install a PC task"],
        tools: [],
        rarity: "common",
        risk: "mid",
        origin: "wild",
        flavor: "A clock",
        kind: "clock",
      },
    ];
    save.activeIds[0] = "flick";
    save.activeIds[1] = "am-shift";
    save.boxedIds = ["hygiene"];
    const md = exportIndex(save);
    expect(md).toMatch(/Trainer: Ada/);
    expect(md).toMatch(/Attention: 2 \/ 6/);
    expect(md).toMatch(/kind: skill/);
    expect(md).toMatch(/kind: clock/);
    const back = importIndex(md, blankSave());
    expect(back.caught.find((c) => c.id === "hygiene")?.kind).toBe("skill");
    expect(back.caught.find((c) => c.id === "am-shift")?.kind).toBe("clock");
    expect(back.activeIds.slice(0, 2)).toEqual(["flick", "am-shift"]);
    expect(back.boxedIds).toContain("hygiene");
  });
});
