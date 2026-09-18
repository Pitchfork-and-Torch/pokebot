import { describe, expect, it } from "vitest";
import { BANNED_MARKS } from "../data/copy";
import { FIELD_ROWS, SIGNS, SPAWNS } from "../data/fieldMap";
import { FIELD_NEW, FIELD_POOL, MARKET_WILDS, HOUSE_WILDS } from "../data/fieldWilds";
import { plateVerdict } from "../data/types";
import {
  LAB_DUMP_LECTURE,
  MAP_H,
  MAP_W,
  afterStamp,
  cancel,
  createField,
  fieldAriaLabel,
  identifyPlate,
  interact,
  isCancelKey,
  isConfirmKey,
  mulberry32,
  seenIdOnTransition,
  stampKey,
  stampRoast,
  tileAt,
  tryMove,
  walkable,
} from "../lib/field";
import { pasteShape } from "../lib/encounterPaste";
import { DEMO_ROSTER_DUMP } from "../data/demoRoster";
import { fitFieldView } from "../lib/fieldDraw";
import { accountUsed } from "../lib/roster";
import { blankSave } from "../lib/storage";

const LIVE_MARKS = [
  "haggle",
  "researchy",
  "tinkabot",
  "skippy",
  "imogen",
  "eggbot",
  "critiquito",
  "lingxi",
  "x.ai/bot",
  "pikachu",
  "pokeball",
  "pokedex",
];

describe("field view fit", () => {
  it("fills a tall CRT instead of letterboxing a wide 18x11 view", () => {
    const view = fitFieldView(360, 480);
    expect(view.viewH).toBe(MAP_H);
    expect(view.viewW).toBeGreaterThanOrEqual(10);
    expect(view.viewW).toBeLessThanOrEqual(MAP_W);
    expect(view.cell * view.viewH).toBeGreaterThan(480 - view.cell);
    expect(view.cell * view.viewH).toBeLessThanOrEqual(480);
  });
});

describe("field map", () => {
  it("is rectangular and closed", () => {
    expect(MAP_W).toBe(28);
    expect(MAP_H).toBe(FIELD_ROWS.length);
    for (const row of FIELD_ROWS) {
      expect(row.length, row).toBe(MAP_W);
      expect(row.startsWith("#")).toBe(true);
      expect(row.endsWith("#")).toBe(true);
    }
  });

  it("has a walkable spawn and walkable signs and spawns", () => {
    const field = createField({ intro: false, seed: 3 });
    expect(walkable(field.x, field.y)).toBe(true);
    expect(tileAt(field.x, field.y)).toBe("@");
    for (const s of SIGNS) {
      expect(walkable(s.x, s.y), `${s.x},${s.y}`).toBe(true);
    }
    for (const s of SPAWNS) {
      expect(walkable(s.x, s.y), s.id).toBe(true);
    }
    expect(field.actors.some((a) => a.npc && a.id === "pokebot")).toBe(true);
    expect(field.actors.some((a) => a.id === "spray")).toBe(true);
    expect(field.actors.some((a) => a.id === "shiftchief")).toBe(true);
    expect(field.actors.some((a) => a.id === "vendorsave")).toBe(true);
    const costume = field.actors.find((a) => a.id === "basedpepe");
    const fenced = field.actors.find((a) => a.id === "vendorsave");
    expect(costume).toMatchObject({ x: 13, y: 10, wander: false });
    expect(fenced).toMatchObject({ x: 16, y: 13, wander: false });
  });

  it("opens lab paste on A with nothing in front", () => {
    let s = createField({ intro: false, seed: 1 });
    s = { ...s, x: 13, y: 13, dir: 0, mode: "walk" };
    const next = interact(s);
    expect(next.mode).toBe("paste");
  });
});

describe("field motion", () => {
  it("blocks walls and water", () => {
    const rng = mulberry32(1);
    let s = createField({ intro: false, seed: 1 });
    s = { ...s, x: 1, y: 1 };
    const blocked = tryMove(s, 0, -1, rng);
    expect(blocked.y).toBe(1);
    expect(blocked.dir).toBe(2);
    s = { ...s, x: 5, y: 5 };
    const water = tryMove(s, 0, 0, rng);
    expect(water.x).toBe(5);
    const intoWater = tryMove({ ...s, x: 5, y: 4 }, 0, 1, rng);
    expect(intoWater.y).toBe(4);
  });

  it("opens the professor talk and a wild encounter", () => {
    let s = createField({ intro: false, seed: 1 });
    s = { ...s, x: 13, y: 13, dir: 3 };
    const talk = interact(s);
    expect(talk.mode).toBe("talk");
    expect(talk.talk ?? "").toMatch(/never click Add/i);
    const spray = s.actors.find((a) => a.id === "spray");
    expect(spray).toBeTruthy();
    if (!spray) return;
    const bump = tryMove({ ...s, x: spray.x - 1, y: spray.y, mode: "walk" }, 1, 0, mulberry32(2));
    expect(bump.mode).toBe("encounter");
    expect(bump.encounterId).toBe("spray");
  });

  it("can roll a tall-grass encounter", () => {
    const rng = () => 0;
    const s = createField({ intro: false, seed: 1 });
    const grass = tryMove({ ...s, x: 15, y: 3, mode: "walk" }, 0, 1, rng);
    expect(grass.mode).toBe("encounter");
    expect(grass.encounterId).toBeTruthy();
    expect(grass.grassSeen).toBe(1);
  });
});

describe("field stamps", () => {
  it("roasts a Keep on a SKIP plate", () => {
    expect(stampRoast("catch", "SKIP")).toMatch(/fence/);
    expect(stampRoast("skip", "CATCH")).toMatch(/skipped/);
  });

  it("identifyPlate SKIPs high-risk mouths and WATCH already-caught", () => {
    const spray = FIELD_POOL.find((p) => p.id === "spray");
    expect(spray).toBeTruthy();
    if (!spray) return;
    const save = blankSave();
    expect(identifyPlate(spray, save).verdict).toBe("SKIP");
    const kept = { ...save, caught: [spray] };
    expect(identifyPlate(spray, kept).verdict).toBe("WATCH");
  });

  it("WATCHes an empty never-list instead of Catch", () => {
    const uwu = FIELD_POOL.find((p) => p.id === "uwubot");
    const egg = FIELD_POOL.find((p) => p.id === "egghat");
    expect(uwu).toBeTruthy();
    expect(egg).toBeTruthy();
    if (!uwu || !egg) return;
    expect(plateVerdict(uwu)).toBe("WATCH");
    expect(identifyPlate(uwu, blankSave()).verdict).toBe("WATCH");
    expect(identifyPlate(egg, blankSave()).verdict).toBe("WATCH");
    expect(identifyPlate(egg, blankSave()).slot_advice).toBe("box");
  });

  it("still CATCHES Vendorsave on an empty six", () => {
    const vendor = FIELD_POOL.find((p) => p.id === "vendorsave");
    expect(vendor).toBeTruthy();
    if (!vendor) return;
    expect(identifyPlate(vendor, blankSave()).verdict).toBe("CATCH");
  });

  it("WATCHes a same-type hat when the six already holds that type", () => {
    const vendor = FIELD_POOL.find((p) => p.id === "vendorsave");
    const ledger = FIELD_POOL.find((p) => p.id === "ledger");
    expect(vendor).toBeTruthy();
    expect(ledger).toBeTruthy();
    if (!vendor || !ledger) return;
    const save = {
      ...blankSave(),
      caught: [vendor],
      activeIds: [vendor.id, null, null, null, null, null] as ReturnType<typeof blankSave>["activeIds"],
    };
    const r = identifyPlate(ledger, save);
    expect(r.verdict).toBe("WATCH");
    expect(r.why.join(" ")).toMatch(/Vendorsave/);
    expect(r.slot_advice).toBe("box");
  });

  it("matches authored risk to stamp: high Skip, empty never Watch, fenced Catch", () => {
    for (const spec of FIELD_POOL) {
      const v = identifyPlate(spec, blankSave()).verdict;
      if (spec.risk === "high") expect(v, spec.id).toBe("SKIP");
      else if (spec.never_list.length === 0 || spec.origin === "duplicate" || spec.origin === "stub") {
        expect(v, spec.id).toBe("WATCH");
      } else {
        expect(v, spec.id).toBe("CATCH");
      }
    }
  });

  it("Skip on Basedpepe does not eat the BOTS 50 cap", () => {
    const spec = FIELD_POOL.find((p) => p.id === "basedpepe");
    expect(spec).toBeTruthy();
    if (!spec) return;
    const save = blankSave();
    const result = identifyPlate(spec, save);
    expect(result.verdict).toBe("SKIP");
    expect(accountUsed(save.caught, 0)).toBe(0);
    let s = createField({ intro: false, seed: 1 });
    const actor = s.actors.find((a) => a.id === "basedpepe");
    expect(actor).toBeTruthy();
    if (!actor) return;
    s = { ...s, mode: "encounter", encounterId: actor.id, encounterUid: actor.uid };
    s = afterStamp(s, "skip", "Skip. The toy thanks you.");
    expect(s.mode).toBe("walk");
    expect(s.actors.some((a) => a.uid === actor.uid)).toBe(true);
    expect(accountUsed(save.caught, 0)).toBe(0);
  });

  it("after Keep, the wanderer leaves the field", () => {
    let s = createField({ intro: false, seed: 1 });
    const spray = s.actors.find((a) => a.id === "spray");
    expect(spray).toBeTruthy();
    if (!spray) return;
    s = { ...s, mode: "encounter", encounterId: spray.id, encounterUid: spray.uid };
    s = afterStamp(s, "catch", "ok");
    expect(s.mode).toBe("walk");
    expect(s.actors.some((a) => a.uid === spray.uid)).toBe(false);
  });

  it("cancel from walk opens help, not a home exit", () => {
    const s = cancel(createField({ intro: false }));
    expect(s.mode).toBe("help");
  });

  it("B from grass says it slipped, B from a standing wild leaves it", () => {
    let s = createField({ intro: false, seed: 1 });
    s = { ...s, mode: "encounter", encounterId: "spray", encounterUid: null };
    expect(cancel(s).toast).toMatch(/grass/i);
    const spray = s.actors.find((a) => a.id === "spray");
    expect(spray).toBeTruthy();
    if (!spray) return;
    s = { ...s, mode: "encounter", encounterId: spray.id, encounterUid: spray.uid };
    expect(cancel(s).toast).toMatch(/standing/i);
  });
});

describe("field keys", () => {
  it("maps keyboard without Nintendo nouns", () => {
    expect(isConfirmKey("Enter")).toBe(true);
    expect(isConfirmKey("z")).toBe(true);
    expect(isCancelKey("Escape")).toBe(true);
    expect(stampKey("1")).toBe("catch");
    expect(stampKey("2")).toBe("watch");
    expect(stampKey("3")).toBe("skip");
    expect(stampKey("s")).toBe("skip");
    expect(stampKey("S")).toBe("skip");
    expect(stampKey("a")).toBe(null);
  });
});

describe("field identify side effects", () => {
  it("marks SEEN when a walk becomes an encounter", () => {
    const prev = createField({ intro: false, seed: 1 });
    const next = { ...prev, mode: "encounter" as const, encounterId: "basedpepe" };
    expect(seenIdOnTransition(prev, next)).toBe("basedpepe");
    expect(seenIdOnTransition(next, next)).toBeNull();
  });

  it("names the overlay for a screen reader", () => {
    const walk = createField({ intro: false, seed: 1 });
    expect(fieldAriaLabel(walk)).toMatch(/WASD/i);
    expect(fieldAriaLabel({ ...walk, mode: "intro" })).toMatch(/Title/i);
    expect(fieldAriaLabel({ ...walk, mode: "encounter", encounterId: "basedpepe" })).toMatch(/Basedpepe/);
  });

  it("keeps lab dumps off the one-wish identify path", () => {
    expect(pasteShape(DEMO_ROSTER_DUMP)).toBe("dump");
    expect(LAB_DUMP_LECTURE.toLowerCase()).toMatch(/desk paste/);
  });
});

describe("field plates legal", () => {
  it("uses original names and no live marketplace or Nintendo marks", () => {
    const blob = [...FIELD_NEW, ...FIELD_POOL]
      .map((s) => `${s.id} ${s.name} ${s.title} ${s.job} ${s.flavor}`)
      .join(" ")
      .toLowerCase();
    for (const mark of BANNED_MARKS) {
      expect(blob.includes(mark)).toBe(false);
    }
    for (const mark of LIVE_MARKS) {
      expect(blob.includes(mark), mark).toBe(false);
    }
    expect(MARKET_WILDS.length).toBeGreaterThanOrEqual(20);
    expect(HOUSE_WILDS.length).toBeGreaterThanOrEqual(8);
    expect(FIELD_POOL.some((s) => s.id === "vendorsave")).toBe(true);
    expect(FIELD_POOL.some((s) => s.id === "shiftchief")).toBe(true);
    expect(FIELD_POOL.some((s) => s.id === "spray")).toBe(true);
  });

  it("high-risk plates have empty or weak fences, fenced plates have never-lists", () => {
    const skippy = FIELD_NEW.filter((s) => s.risk === "high");
    expect(skippy.length).toBeGreaterThan(0);
    for (const s of skippy) {
      expect(s.never_list.length, s.name).toBe(0);
    }
    const fenced = FIELD_NEW.filter((s) => s.risk === "low");
    for (const s of fenced) {
      expect(s.never_list.length, s.name).toBeGreaterThan(0);
    }
  });
});
