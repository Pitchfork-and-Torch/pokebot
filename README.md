# PokeBot Field Guide

Walk the field. Keep six. Never Add.

Paste a share URL or a job. Skip, Watch, or Keep. We never click Add. Keep six. Cap 50.

Field (`#/guide`) is the front door: WASD or tap, identify wilds, stamp Keep / Watch / Skip. No HP. Desk is the trainer paste + six. Handheld is the public skin. Same Index.

The website is the trailer. The creature is a Grok Bot you paste from `pack/`.

## Run

```bash
npm install
npm run dev
```

Open the URL Vite prints (http://127.0.0.1:5173).

Desk opens on paste. Identify, then Keep / Watch / Skip. The six sit on the right. INDEX.md is in the header.

Handheld skin: Press A to power on. Tape for chip sounds. LEFT/RIGHT cycles Paste / Six / Box / More. The plastic does not resize.

Need loop:

1. Census (how many already on the account; optional names become stubs).
2. IMPORT: paste a roster dump. Ingest. Read the kill list.
3. TEAM: pin six. Box the rest.
4. GYM: Monday brief, or Match (two bots, Job / Fence / Hold). Paste an x.ai/bot URL as side B. Copy CHALLENGE.md for a friend.
5. INDEX: copy INDEX.md into the PokeBot Grok Bot, or paste the bot's file on Encounter / IDX. Same schema. Trainer name is the weld.
6. PACK: copy PROFILE.md. You still click Add.
7. BOTDEX: Bdx pad. Field plates plus wilds you stamped.

```bash
npm test
npm run build
```

Windows double-click: `Start-PokeBot.cmd` in this folder (or the Desktop copy).

Save file is `localStorage` key `pokebot.v2`. No account. Identify of live `x.ai/bot` URLs needs the preview with `/api/identify` (`scripts/start_preview.py`), not a bare static folder.

## 60-second demo

1. Power on. Press A. Field.
2. Walk north of the lab. Stamp 3 Skip on the costume.
3. Walk east of the lab. Stamp 1 Keep on the fenced spend bot.
4. Save card.
5. Desk paste still works for a wish or an `x.ai/bot` URL. We never click Add.

## Grok Bot pack

1. Create a new Grok Bot named **PokeBot**.
2. Paste `pack/PROFILE.md` into its description.
3. In the first chat, follow `pack/FIRST_RUN.md`.
4. Copy skills from `pack/skills/` onto the shared computer if you use them.
5. You click Add on third-party bots. PokeBot never clicks Add for you.

Share links are public. Adding a third-party bot accepts x.ai third-party terms.

## Legal

Original work. MIT. Not affiliated with SpaceXAI, xAI, or Nintendo. Product nouns: Field Guide, Index, Specimen, Encounter, Catch, Train, Slot, Box, Release, Gym, Type, Shiny, Legendary.

## Stack

Vite 5, React 18, TypeScript strict, hash routes, one CSS file. Classifier and roster math are unit-tested.
