import { describe, expect, it } from "vitest";
import { DEMO_ROSTER_DUMP } from "../data/demoRoster";
import { LANE, LANE_MATCH_INDEX } from "../data/lane";
import { applyIndexFile, enqueue, ensureLane, laneInProgress, startLane, stampHearing } from "../lib/docket";
import { exportIndex } from "../lib/indexMarkdown";
import { accountUsed } from "../lib/roster";
import { identifyDump } from "../lib/rosterDump";
import { blankSave } from "../lib/storage";

describe("docket", () => {
  it("does not start the tutorial lane on a blank save", () => {
    const save = ensureLane(blankSave());
    expect(save.docket).toHaveLength(0);
    expect(laneInProgress(save)).toBe(false);
  });

  it("queues an import dump without writing the Index", () => {
    const rows = identifyDump(DEMO_ROSTER_DUMP);
    const save = enqueue(
      blankSave(),
      rows.map((row) => ({ result: row.result, input: row.raw, source: "import" as const })),
    );
    expect(save.docket).toHaveLength(8);
    expect(save.caught).toHaveLength(0);
    expect(accountUsed(save.caught, save.declaredExisting)).toBe(0);
  });

  it("Skip leaves the cap at 0 and Catch spends one BOTS slot", () => {
    const rows = identifyDump("Pulse\nOwn weekly account health. Never contact a customer.");
    const row = rows[0];
    if (!row) throw new Error("pulse");
    let save = enqueue(blankSave(), [{ result: row.result, input: row.raw, source: "import" }]);
    save = stampHearing(save, "skip").save;
    expect(save.caught).toHaveLength(0);
    expect(save.docket).toHaveLength(0);

    save = enqueue(save, [{ result: row.result, input: row.raw, source: "import" }]);
    const caught = stampHearing(save, "catch");
    expect(caught.blocked).toBeUndefined();
    expect(caught.save.caught).toHaveLength(1);
    expect(accountUsed(caught.save.caught, caught.save.declaredExisting)).toBe(1);
  });
});

describe("index file", () => {
  it("closes the lane when INDEX.md lands", () => {
    let save = startLane(blankSave());
    expect(save.docket[0]?.source).toBe("lane");
    const file = blankSave();
    file.trainerName = "Ada";
    file.caught = [
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
    ];
    file.activeIds[0] = "flick";
    save = applyIndexFile(save, exportIndex(file));
    expect(save.docket.filter((d) => d.source === "lane")).toHaveLength(0);
    expect(save.laneIndex).toBeGreaterThanOrEqual(LANE_MATCH_INDEX);
    expect(save.trainerName).toBe("Ada");
    expect(save.caught.map((c) => c.id)).toEqual(["flick"]);
  });
});

describe("lane", () => {
  it("walks seven hearings with the expected stamps, then waits on Gym", () => {
    let save = startLane(blankSave());
    for (let i = 0; i < LANE_MATCH_INDEX; i++) {
      save = ensureLane(save);
      const station = LANE[i];
      const item = save.docket[0];
      expect(item, `station ${i}`).toBeTruthy();
      expect(item?.result.verdict, station?.id).toBe(station?.expected);
      const action = (station?.expected === "CATCH" ? "catch" : station?.expected === "WATCH" ? "watch" : "skip") as
        | "catch"
        | "watch"
        | "skip";
      const step = stampHearing(save, action);
      expect(step.blocked, station?.id).toBeUndefined();
      save = step.save;
    }
    expect(save.laneIndex).toBe(LANE_MATCH_INDEX);
    expect(save.caught.length).toBe(2);
    expect(save.activeIds.filter(Boolean).length).toBe(2);
  });
});
