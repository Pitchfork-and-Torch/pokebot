import { describe, expect, it } from "vitest";
import { ACTIVE_MAX, CAP_HARD, CAP_MAX, CAP_WARN, activeCount, assignSlot, canCatch, capCount, capState, emptyActive } from "../lib/roster";
import { typeHoles } from "../lib/pressure";
import { blankSave } from "../lib/storage";

describe("roster", () => {
  it("caps active at 6", () => {
    expect(ACTIVE_MAX).toBe(6);
    expect(emptyActive().length).toBe(6);
    expect(activeCount(emptyActive())).toBe(0);
  });

  it("assigns and does not duplicate a specimen across slots", () => {
    let active = emptyActive();
    let boxed: string[] = [];
    ({ activeIds: active, boxedIds: boxed } = assignSlot(active, boxed, 0, "a"));
    ({ activeIds: active, boxedIds: boxed } = assignSlot(active, boxed, 1, "a"));
    expect(active.filter((id) => id === "a").length).toBe(1);
    expect(active[1]).toBe("a");
    expect(active[0]).toBeNull();
  });

  it("warns at 40 and hard-warns at 48", () => {
    expect(capState(0).level).toBe("ok");
    expect(capState(CAP_WARN).level).toBe("warn");
    expect(capState(CAP_HARD).level).toBe("hard");
    expect(capState(CAP_MAX).level).toBe("full");
    expect(canCatch(49)).toBe(true);
    expect(canCatch(50)).toBe(false);
  });

  it("boxes the previous occupant when replacing a slot", () => {
    let active = emptyActive();
    let boxed: string[] = [];
    ({ activeIds: active, boxedIds: boxed } = assignSlot(active, boxed, 2, "old"));
    ({ activeIds: active, boxedIds: boxed } = assignSlot(active, boxed, 2, "new"));
    expect(active[2]).toBe("new");
    expect(boxed).toContain("old");
  });

  it("adds census bots to cap used", () => {
    expect(capCount([], 41)).toBe(41);
    expect(canCatch(capCount([], 50))).toBe(false);
  });

  it("starts with the fable off", () => {
    expect(blankSave().tutorial).toBe(false);
  });

  it("reports Sense as a hole when the six has no Sense", () => {
    const save = blankSave();
    save.caught = [
      {
        id: "flick",
        name: "Flick",
        title: "Scout",
        types: ["scout"],
        job: "research",
        never_list: [],
        tools: [],
        rarity: "rare",
        risk: "low",
        origin: "spawned",
        flavor: "x",
      },
    ];
    save.activeIds[0] = "flick";
    expect(typeHoles(save)).toContain("sense");
  });
});
