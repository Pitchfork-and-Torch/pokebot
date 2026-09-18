import { describe, expect, it } from "vitest";
import { mondayGym } from "../lib/monday";
import { blankSave } from "../lib/storage";

describe("monday gym", () => {
  it("scores six slots and files keep/box/empty", () => {
    const save = blankSave();
    save.caught = [
      {
        id: "pulse",
        name: "Pulse",
        title: "Sense",
        types: ["sense"],
        job: "Own weekly account health",
        never_list: ["Never contact a customer"],
        tools: ["analytics"],
        rarity: "rare",
        risk: "low",
        origin: "wild",
        flavor: "Looks at the patient",
      },
      {
        id: "spray",
        name: "Spray",
        title: "Sprayer",
        types: ["voice"],
        job: "DM inbound leads every morning",
        never_list: [],
        tools: ["DMs"],
        rarity: "common",
        risk: "high",
        origin: "wild",
        flavor: "Leak",
      },
    ];
    save.activeIds[0] = "pulse";
    save.activeIds[1] = "spray";
    const report = mondayGym(save, "Write a weekly account-health file. Never contact a customer.");
    expect(report.slots).toHaveLength(6);
    expect(report.slots.filter((s) => s.action === "empty")).toHaveLength(4);
    const pulse = report.slots[0];
    const spray = report.slots[1];
    expect(pulse?.action).toBe("keep");
    expect(spray?.action === "box" || spray?.action === "rewrite-never").toBe(true);
    expect(report.cheapestKill).toBe("Spray");
  });

  it("reads a legendary stamp age on keep", () => {
    const save = blankSave();
    save.caught = [
      {
        id: "pulse",
        name: "Pulse",
        title: "Sense",
        types: ["sense"],
        job: "Own weekly account health",
        never_list: ["Never contact a customer"],
        tools: ["analytics"],
        rarity: "legendary",
        risk: "low",
        origin: "wild",
        flavor: "Looks at the patient",
      },
    ];
    save.activeIds[0] = "pulse";
    save.legendaryStamps = { pulse: "2026-08-08" };
    const report = mondayGym(save, "Write a weekly account-health file. Never contact a customer.");
    expect(report.slots[0]?.action).toBe("keep");
    expect(report.slots[0]?.note).toMatch(/Legendary/);
  });
});
