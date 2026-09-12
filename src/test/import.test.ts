import { describe, expect, it } from "vitest";
import { DEMO_ROSTER_DUMP } from "../data/demoRoster";
import { addNameStubs, cheapestKill, ingestRows, makeStub } from "../lib/ingest";
import { identifyDump, killMessage, parseRosterDump, rankKillList } from "../lib/rosterDump";
import { capUsed } from "../lib/pressure";
import { blankSave } from "../lib/storage";

describe("roster dump", () => {
  it("parses eight drill blurbs", () => {
    expect(parseRosterDump(DEMO_ROSTER_DUMP)).toHaveLength(8);
  });

  it("builds a kill list of at least three SKIP/WATCH", () => {
    const rows = identifyDump(DEMO_ROSTER_DUMP);
    expect(rows).toHaveLength(8);
    const kill = rankKillList(rows);
    expect(kill.length).toBeGreaterThanOrEqual(3);
    expect(killMessage(kill)).toMatch(/Release these \d or you do not Catch anything new/);
    const pulse = rows.find((r) => /pulse/i.test(r.name));
    expect(pulse?.result.verdict).toBe("CATCH");
    expect(pulse?.result.types).toContain("sense");
  });

  it("ingests eight names against a 41 census without growing past 41", () => {
    const base = { ...blankSave(), declaredExisting: 41, censusDone: true };
    const rows = identifyDump(DEMO_ROSTER_DUMP);
    const { save, added } = ingestRows(base, rows);
    expect(added).toBe(8);
    expect(save.caught).toHaveLength(8);
    expect(save.declaredExisting).toBe(33);
    expect(capUsed(save)).toBe(41);
  });

  it("upgrades a stub instead of adding a 51st", () => {
    let save = addNameStubs(blankSave(), ["Pulse"], 1);
    expect(save.caught[0]?.origin).toBe("stub");
    expect(capUsed(save)).toBe(1);
    const rows = identifyDump("Pulse\nOwn weekly account health. Never contact a customer.");
    const next = ingestRows(save, rows);
    expect(next.upgraded).toBe(1);
    expect(next.added).toBe(0);
    expect(next.save.caught).toHaveLength(1);
    expect(next.save.caught[0]?.origin).toBe("wild");
    expect(capUsed(next.save)).toBe(1);
  });

  it("names a clock on the kill list", () => {
    const rows = identifyDump(
      "kind: clock\nAM-Shift\nEvery Monday. No owner. No job.\n\nkind: skill\nutf8-hygiene\nKeep public copy ASCII. Never publish secrets.",
    );
    expect(rows).toHaveLength(2);
    expect(rows[0]?.name).toBe("AM-Shift");
    expect(rows[0]?.result.kind).toBe("clock");
    const kill = rankKillList(rows);
    expect(killMessage(kill)).toMatch(/Kill the clock: AM-Shift/);
  });

  it("names a stub as cheapest kill", () => {
    const save = {
      ...blankSave(),
      caught: [
        makeStub("Costume"),
        {
          id: "pulse",
          name: "Pulse",
          title: "Sense",
          types: ["sense"] as ["sense"],
          job: "account health",
          never_list: ["Never contact a customer"],
          tools: ["file"],
          rarity: "rare" as const,
          risk: "low" as const,
          origin: "wild" as const,
          flavor: "ok",
        },
      ],
    };
    expect(cheapestKill(save.caught)?.name).toBe("Costume");
  });
});
