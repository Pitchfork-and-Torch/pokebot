# PokeBot

Public MIT Field Guide for Grok Bots. Vite 5 + React 18 + TypeScript. localStorage save. No backend.

```
npm install
npm test
npm run build
npm run dev
```

Do not run `npm run dev` as a Grok Build command. It hangs the TUI Job Object. Use `scripts/start-preview.ps1` (detach) and `scripts/probe-preview.ps1`.

Rules:
- Original names. No Nintendo marks. No live x.ai/bot IDs.
- Classifier is real code in `src/lib/classify.ts`. If a paste is theater, fix the rules and tests.
- ASCII hyphens in public copy. No em dashes.
- No analytics, no tracking, no secrets.
- Footer disclaimer stays.
- The housing is hardware: fixed size, CRT-only scroll, D-pad modes. Do not let page content resize the bezel.
- Next product pass is `NEXT-PASS.md`. v4.0 The Wilds: Field-first on handheld, Desk is trainer paste. Field is walk / identify / stamp. No HP. Pages may ship the playable Field without live Bot INDEX.md. Do not tweet that the Bot writes the Index until that file exists with the trainer name.
