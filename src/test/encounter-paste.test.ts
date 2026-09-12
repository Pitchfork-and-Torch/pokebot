import { describe, expect, it } from "vitest";
import { looksLikeDump, pasteShape } from "../lib/encounterPaste";
import { DEMO_ROSTER_DUMP } from "../data/demoRoster";
import { exportIndex } from "../lib/indexMarkdown";
import { identifyDump } from "../lib/rosterDump";
import { blankSave } from "../lib/storage";

describe("encounter paste", () => {
  it("routes INDEX.md first", () => {
    const save = blankSave();
    save.trainerName = "Ada";
    const md = exportIndex(save);
    expect(pasteShape(md)).toBe("index");
  });

  it("routes the drill dump and not a two-paragraph wish", () => {
    expect(pasteShape(DEMO_ROSTER_DUMP)).toBe("dump");
    expect(looksLikeDump(DEMO_ROSTER_DUMP)).toBe(true);
    expect(
      pasteShape("Own weekly account health.\n\nNever contact a customer."),
    ).toBe("wish");
  });

  it("routes a share URL", () => {
    expect(pasteShape("https://x.ai/bot/abc_DEF-123")).toBe("url");
  });

  it("treats a single kind: skill block as a wish, not a dump", () => {
    const raw = "kind: skill\nutf8-hygiene\nKeep public copy ASCII. Never publish secrets.";
    expect(pasteShape(raw)).toBe("wish");
    const rows = identifyDump(raw);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.name).toBe("utf8-hygiene");
    expect(rows[0]?.result.kind).toBe("skill");
  });
});
