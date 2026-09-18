import { describe, expect, it } from "vitest";
import { looksLikeIndex } from "../lib/indexMarkdown";
import { detectKind } from "../lib/pasteKind";
import { accountUsed } from "../lib/roster";
import { addNameStubs } from "../lib/ingest";
import { ingestRows } from "../lib/ingest";
import { identifyDump } from "../lib/rosterDump";
import { blankSave } from "../lib/storage";
import { allowIdentifyHost, classifyPublicTemplate, extractShareUrl, identifyRequestUrl } from "../lib/wildLink";

const COSTUME_HTML = `<!doctype html><html><head><title>Basedpepe</title>
<meta property="og:title" content="Basedpepe" />
<meta property="og:description" content="Be a meme. No owner. No job. Costume." /></head>
<body><h1>Basedpepe</h1><p>Be a meme. No owner. No job.</p></body></html>`;

const FENCED_HTML = `<!doctype html><html><head><title>Pulse</title>
<meta property="og:title" content="Pulse" />
<meta property="og:description" content="Own weekly account health. Never contact a customer. Never publish numbers." /></head>
<body><h1>Pulse</h1><p>Own weekly account health. Never contact a customer.</p></body></html>`;

describe("wild link", () => {
  it("extracts x.ai share URLs only", () => {
    expect(extractShareUrl("see https://x.ai/bot/abc_DEF-123 later")).toBe("https://x.ai/bot/abc_DEF-123");
    expect(allowIdentifyHost("https://x.ai/bot/abc")).toBe(true);
    expect(allowIdentifyHost("https://example.com/bot/abc")).toBe(false);
  });

  it("skips a costume public template fixture", () => {
    const r = classifyPublicTemplate(COSTUME_HTML);
    expect(r.verdict).toBe("SKIP");
  });

  it("catches a fenced account-health template fixture", () => {
    const r = classifyPublicTemplate(FENCED_HTML);
    expect(r.verdict).toBe("CATCH");
    expect(r.types).toContain("sense");
  });
});

describe("index detect", () => {
  it("recognizes INDEX.md", () => {
    expect(looksLikeIndex("# INDEX\n\n## Active\n")).toBe(true);
    expect(looksLikeIndex("Spray\nDMs inbound leads")).toBe(false);
  });
});

describe("attention vs account cap", () => {
  it("does not count skills toward the 50", () => {
    const rows = identifyDump("kind: skill\nutf8-hygiene\nKeep public copy ASCII. Never publish secrets.");
    expect(rows[0]?.name).toBe("utf8-hygiene");
    expect(rows[0]?.result.kind).toBe("skill");
    const next = ingestRows(blankSave(), rows);
    expect(accountUsed(next.save.caught, 0)).toBe(0);
    expect(next.save.caught).toHaveLength(1);
  });

  it("counts grok-bot stubs toward 50", () => {
    const save = addNameStubs(blankSave(), ["Costume"], 1);
    expect(accountUsed(save.caught, save.declaredExisting)).toBe(1);
  });
});

describe("kind detect", () => {
  it("reads kind: clock", () => {
    expect(detectKind("kind: clock\nMonday gym")).toBe("clock");
  });
});

describe("identify request body", () => {
  it("rejects null, arrays, and primitives instead of reading .url", () => {
    expect(identifyRequestUrl(null)).toBeNull();
    expect(identifyRequestUrl([{"url": "https://x.ai/bot/a"}])).toBeNull();
    expect(identifyRequestUrl("https://x.ai/bot/a")).toBeNull();
    expect(identifyRequestUrl(42)).toBeNull();
  });

  it("reads a trimmed string url from an object body", () => {
    expect(identifyRequestUrl({ url: "  https://x.ai/bot/abc  " })).toBe("https://x.ai/bot/abc");
    expect(identifyRequestUrl({ url: "" })).toBeNull();
    expect(identifyRequestUrl({ url: 1 })).toBeNull();
  });
});
