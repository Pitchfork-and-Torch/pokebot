export type FableId =
  | "tape"
  | "left"
  | "right"
  | "dpadU"
  | "dpadD"
  | "dpadL"
  | "dpadR"
  | "enc"
  | "dex"
  | "team"
  | "a"
  | "b"
  | "stats"
  | "cap"
  | "fable"
  | "identify"
  | "catch"
  | "watch"
  | "skip"
  | "drillOut"
  | "drillHealth"
  | "slot"
  | "censusSet"
  | "censusNone"
  | "copyIndex"
  | "downloadIndex"
  | "importMd"
  | "indexPick"
  | "box"
  | "release"
  | "dexPick"
  | "botdexField"
  | "botdexWild"
  | "catchSeed"
  | "ingest"
  | "loadDrill"
  | "teamSlot"
  | "benchPick"
  | "pin"
  | "gymRun"
  | "gymPng"
  | "mondayTab"
  | "matchTab"
  | "matchRun"
  | "matchA"
  | "matchB"
  | "challenger"
  | "copyChallenge"
  | "packCopy"
  | "cardPortrait"
  | "cardLandscape"
  | "loadIndex"
  | "stampShiny"
  | "stampLegendary";

export type FableKind = "button" | "readout" | "ready";

export type FableHint = {
  title: string;
  kind: FableKind;
  press: string;
  use: string;
  skip: string;
};

export const FABLE_WEST = {
  kicker: "How to use it",
  title: "Paste. Identify. Keep six.",
  body: "Paste a share URL or a job. Identify, then Keep, Watch, or Skip. Keep pins a hole. You still click Add. Copy INDEX.md from the header.",
  footIdle: "Hover a button. The right page says what it does.",
} as const;

export const FABLE_IDLE: FableHint = {
  title: "Hover a button",
  kind: "ready",
  press: "This page names the control, what a press does, when to use it, and when to leave it.",
  use: "You want the answer before you click.",
  skip: "You already know the layout. Turn Fable off at the top right.",
};

export const FABLE_HINTS: Record<FableId, FableHint> = {
  tape: {
    title: "Tape on / off",
    kind: "button",
    press: "Turns click sounds on or off. Saves the choice.",
    use: "You want audio feedback while you Identify and Catch.",
    skip: "Quiet room, or you already know the controls by feel. Sound starts after you press A on the boot screen.",
  },
  left: {
    title: "LEFT",
    kind: "button",
    press: "Opens the previous page. Same as D-pad L and the Left Arrow key.",
    use: "Step backward through Encounter, Import, Index, Dex, Team, Gym, Pack, Card, Lab, Guide, Log.",
    skip: "You want a named shortcut instead: Enc, Dex, or Team.",
  },
  right: {
    title: "RIGHT",
    kind: "button",
    press: "Opens the next page. Same as D-pad R and the Right Arrow key.",
    use: "Step forward through the eleven pages.",
    skip: "You want Enc, Dex, or Team, which jump straight there.",
  },
  dpadU: {
    title: "D-pad up",
    kind: "button",
    press: "Scrolls the screen up. Same as the Up Arrow key.",
    use: "The list is cut off at the top.",
    skip: "The whole page already fits.",
  },
  dpadD: {
    title: "D-pad down",
    kind: "button",
    press: "Scrolls the screen down. Same as the Down Arrow key.",
    use: "Identify results or lists run past the bottom.",
    skip: "The whole page already fits.",
  },
  dpadL: {
    title: "D-pad left",
    kind: "button",
    press: "Opens the previous page. Same as LEFT and the Left Arrow key.",
    use: "Your hand is on the D-pad and you want the previous page.",
    skip: "LEFT on the screen is easier to hit.",
  },
  dpadR: {
    title: "D-pad right",
    kind: "button",
    press: "Opens the next page. Same as RIGHT and the Right Arrow key.",
    use: "Your hand is on the D-pad and you want the next page.",
    skip: "RIGHT on the screen is easier to hit.",
  },
  enc: {
    title: "Enc",
    kind: "button",
    press: "Opens Encounter. One agent on the glass. Stamp Catch, Watch, or Skip.",
    use: "Start here, run the lane, or cull a dump one name at a time.",
    skip: "You already stamped this hearing and want Index or Team.",
  },
  dex: {
    title: "Botdex",
    kind: "button",
    press: "Opens Botdex. Numbered field plates, then wilds you have stamped.",
    use: "Look up a type, a stamp, or a wild you already heard.",
    skip: "You are in the middle of a hearing and just need to stamp.",
  },
  team: {
    title: "Team",
    kind: "button",
    press: "Opens the six team slots.",
    use: "Pin daily bots here after you Catch them.",
    skip: "Your Index is still empty, or you only need to copy INDEX.md.",
  },
  a: {
    title: "A",
    kind: "button",
    press: "Runs the green action: boot power, Identify, the recommended stamp, Ingest, Copy INDEX.md, Catch seed, Pin, Run gym, or Run match. Enter does the same.",
    use: "Confirm the main action you already set up.",
    skip: "The paste box is empty, or you want B to leave this page.",
  },
  b: {
    title: "B",
    kind: "button",
    press: "Returns to Encounter. Escape does the same. On Encounter, jumps to the top of the screen.",
    use: "Leave Index, Dex, Team, or Gym and go back to paste.",
    skip: "You still need the current page.",
  },
  stats: {
    title: "Roster meters",
    kind: "readout",
    press: "SEEN, CAUGHT, ATTN / 6, BOX, and BOTS / 50. Numbers update when you Identify, Catch, Skip, Pin, or Release.",
    use: "Check ATTN before you Pin. Check BOTS before you Catch.",
    skip: "You just looked at them.",
  },
  cap: {
    title: "Cap bar",
    kind: "readout",
    press: "Fill for BOTS / 50. Turns gold near the limit, red at the limit.",
    use: "You are about to Catch or ingest a dump.",
    skip: "You are only reading, not adding.",
  },
  fable: {
    title: "Fable switch",
    kind: "button",
    press: "Shows or hides these two gold pages. Saves the choice.",
    use: "Keep it on while you learn the buttons.",
    skip: "You already know the layout and want the handheld alone.",
  },
  identify: {
    title: "Identify",
    kind: "button",
    press: "Classifies the paste: type, job, never-list, risk, and CATCH / WATCH / SKIP. A does the same.",
    use: "The paste box has a job, a roster dump, or an x.ai/bot link.",
    skip: "The box is empty. Fill it first, or use the outbound / sense drills.",
  },
  catch: {
    title: "Keep",
    kind: "button",
    press: "Writes this bot to your local Index and pins an empty hole. You still click Add on x.ai.",
    use: "Identify said CATCH and you want it on the roster.",
    skip: "Identify said SKIP, the cap is full, or you only want to Watch it.",
  },
  watch: {
    title: "Watch",
    kind: "button",
    press: "Logs the result without putting it on the team or the BOTS cap.",
    use: "Useful later, not daily. Clocks and extras belong here until you Pin them.",
    skip: "You are ready to Catch it, or you want it gone with Skip.",
  },
  skip: {
    title: "Skip",
    kind: "button",
    press: "Rejects the bot. Does not create it. Does not spend the cap.",
    use: "Spam, outbound DM machines, or anything Identify marked SKIP.",
    skip: "Identify said CATCH and the job is one you actually want.",
  },
  drillOut: {
    title: "outbound drill",
    kind: "button",
    press: "Pastes a spam job (inbound-lead DMs every morning) and Identifies it. Quest 1 expects Skip.",
    use: "Practice Skip on a bad job.",
    skip: "You already finished quest 1, or you have a real paste.",
  },
  drillHealth: {
    title: "sense drill",
    kind: "button",
    press: "Pastes a bounded job (weekly account health, never contact a customer) and Identifies it. Quest 2 expects Catch.",
    use: "Practice Catch on a job with a never-list.",
    skip: "You already finished quest 2, or you have a real paste.",
  },
  slot: {
    title: "Slot",
    kind: "button",
    press: "Opens Team so you can pin this Caught bot into one of six slots.",
    use: "Catch succeeded and you want it on the daily six.",
    skip: "Leave it in the Index for now. Pin later from Team.",
  },
  censusSet: {
    title: "Set census",
    kind: "button",
    press: "Records how many Grok Bots already live on the account. Named lines become stubs that count toward 50.",
    use: "First run, before you Catch more.",
    skip: "The account is empty. Press None yet instead.",
  },
  censusNone: {
    title: "None yet",
    kind: "button",
    press: "Sets the census to zero. Cap starts at 0/50.",
    use: "No Grok Bots on the account yet.",
    skip: "Bots already exist. Type the count and press Set census.",
  },
  copyIndex: {
    title: "Copy INDEX.md",
    kind: "button",
    press: "Copies the Index file to the clipboard. Same schema the PokeBot Grok Bot writes. A does this on Index.",
    use: "You want the live Grok Bot to match this save. Quest 3.",
    skip: "The Index is empty, or you want a file on disk instead (Download).",
  },
  downloadIndex: {
    title: "Download INDEX.md",
    kind: "button",
    press: "Saves INDEX.md to your downloads folder.",
    use: "You want a file you can archive or paste later.",
    skip: "Clipboard copy is enough.",
  },
  importMd: {
    title: "Import markdown",
    kind: "button",
    press: "Replaces the local Index with the pasted INDEX.md from the Grok Bot.",
    use: "The Grok Bot has a newer file than this handheld.",
    skip: "The paste is empty or is not an INDEX.md.",
  },
  indexPick: {
    title: "Index row",
    kind: "button",
    press: "Selects that Caught bot so you can read it, Box it, or Release it.",
    use: "You want one specific bot in the list.",
    skip: "You only needed Copy INDEX.md.",
  },
  box: {
    title: "Box",
    kind: "button",
    press: "Takes the bot off the six. It stays in the Index and still counts toward 50.",
    use: "Free a team slot without deleting the bot.",
    skip: "You want it gone from the cap. Use Release.",
  },
  release: {
    title: "Release",
    kind: "button",
    press: "Removes the bot from the Index and frees one BOTS slot.",
    use: "You will not run it. Cap is tight.",
    skip: "You still want it indexed. Box it instead.",
  },
  dexPick: {
    title: "Botdex row",
    kind: "button",
    press: "Selects that plate so you can read type, job, and never-list.",
    use: "Look up one specimen in the catalog.",
    skip: "You only needed the counts at the top.",
  },
  botdexField: {
    title: "Field book",
    kind: "button",
    press: "Shows the published field plates, numbered 001 up.",
    use: "Learn the eight types. These plates stay in the book even if you never Catch them.",
    skip: "You want the wilds you stamped instead.",
  },
  botdexWild: {
    title: "Wild book",
    kind: "button",
    press: "Shows specimens you stamped on Encounter that are not field plates.",
    use: "After a hearing or a dump cull, find what you already judged.",
    skip: "The wild book is empty, or you want the field plates.",
  },
  catchSeed: {
    title: "Catch seed",
    kind: "button",
    press: "Adds this example to your Index if it is safe. Counts toward 50. A does the same on Dex.",
    use: "You want a teaching bot in the Index.",
    skip: "High-risk or duplicate seeds. Use Encounter for real jobs.",
  },
  ingest: {
    title: "Ingest",
    kind: "button",
    press: "Reads the pasted roster or INDEX.md and writes stubs and IDs into the Index. A does this on Import.",
    use: "You pasted the real account list, names and one-liners.",
    skip: "The box is empty. Load drill if you want a practice dump.",
  },
  loadDrill: {
    title: "Load drill",
    kind: "button",
    press: "Fills the box with a practice roster so you can Ingest without a live dump.",
    use: "Practice Import before you paste the real list.",
    skip: "You already have the real roster in the box.",
  },
  teamSlot: {
    title: "Team slot",
    kind: "button",
    press: "Empty slot: pins the boxed name you selected. Filled slot: boxes that bot and frees the hole.",
    use: "Build or edit the daily six.",
    skip: "Nothing selected and the slot is empty. Pick a name under Box first.",
  },
  benchPick: {
    title: "Box name",
    kind: "button",
    press: "Selects that indexed bot so the next empty slot, or Pin to first hole, can take it.",
    use: "You Caught something and want it on the six.",
    skip: "It already sits in a slot, or you want it left in the Index.",
  },
  pin: {
    title: "Pin to first hole",
    kind: "button",
    press: "Puts the selected boxed bot into the first empty slot. A does this on Team.",
    use: "A name is selected and a slot is empty.",
    skip: "The six are full. Box someone first.",
  },
  gymRun: {
    title: "Run Monday gym",
    kind: "button",
    press: "Scores the Active six against the brief. Keep / Box / Cap. A does this on Gym.",
    use: "You have a team and a brief (default: weekly account health).",
    skip: "The six are empty. Pin first.",
  },
  gymPng: {
    title: "Download PNG",
    kind: "button",
    press: "Saves the Monday report or the Brief Match card, 1080 by 1350.",
    use: "The gym or match has already run and you want the file.",
    skip: "Run Monday or Match first. The button stays off until then.",
  },
  mondayTab: {
    title: "Monday",
    kind: "button",
    press: "Shows the weekly scorecard for the Active six.",
    use: "End of the lane, or a real Monday brief.",
    skip: "You want a two-bot match instead.",
  },
  matchTab: {
    title: "Match",
    kind: "button",
    press: "Shows Brief Match. Two bots, one brief, three stamps.",
    use: "You have two on the six, or a share URL / challenge slip for side B.",
    skip: "You only needed the Monday scorecard.",
  },
  matchRun: {
    title: "Run match",
    kind: "button",
    press: "Plays Job, Fence, and Hold. The higher total keeps the brief. A does this on Match.",
    use: "Side A and side B are set.",
    skip: "The six are empty and you have no challenger.",
  },
  matchA: {
    title: "Side A",
    kind: "button",
    press: "Picks who from your six defends.",
    use: "You have someone pinned.",
    skip: "You still need to pin.",
  },
  matchB: {
    title: "Side B",
    kind: "button",
    press: "Picks the other of your six, unless a challenger is loaded.",
    use: "A vs B from the same roster.",
    skip: "You pasted a wild template or a challenge slip instead.",
  },
  challenger: {
    title: "Load side B",
    kind: "button",
    press: "Reads a pasted x.ai/bot URL, a job blurb, or a CHALLENGE.md slip into side B.",
    use: "You want a published template or a friend's six to walk in.",
    skip: "You are matching two of your own.",
  },
  copyChallenge: {
    title: "Copy CHALLENGE.md",
    kind: "button",
    press: "Copies your Active six as a challenge slip. No secrets. No Add.",
    use: "Send it to a friend so they can paste it as side B.",
    skip: "The six are empty.",
  },
  packCopy: {
    title: "Copy pack file",
    kind: "button",
    press: "Copies the selected install file to the clipboard. A does this on Pack.",
    use: "You are installing the PokeBot Grok Bot and need that file.",
    skip: "You already copied it, or you are still indexing.",
  },
  cardPortrait: {
    title: "Download portrait",
    kind: "button",
    press: "Saves a tall trainer-card PNG. A does this on Card.",
    use: "You want a share image to attach.",
    skip: "You only needed the Index file.",
  },
  cardLandscape: {
    title: "Download landscape",
    kind: "button",
    press: "Saves a wide trainer-card PNG.",
    use: "You want a 1200 by 630 style attach.",
    skip: "Portrait is enough, or you only needed the Index file.",
  },
  loadIndex: {
    title: "Load file",
    kind: "button",
    press: "Opens a local INDEX.md and fills the paste box. Import markdown still commits it.",
    use: "The Grok Bot wrote a file on disk, or you archived last week's Index.",
    skip: "Clipboard paste is enough.",
  },
  stampShiny: {
    title: "Stamp shiny",
    kind: "button",
    press: "Marks this specimen shiny: first task landed with zero edits. You stamp it. We do not fake it.",
    use: "The first bounded task shipped without a rewrite.",
    skip: "The task needed edits, or this is still a stub.",
  },
  stampLegendary: {
    title: "Stamp legendary",
    kind: "button",
    press: "Stamps today's date as the start of a 30-day owned outcome. Monday gym reads the age.",
    use: "This bot has been owning a recurring outcome and you want the date on the card.",
    skip: "It has not earned 30 days. Do not stamp early.",
  },
};

export const FABLE_QUESTS = [
  {
    id: "skip",
    label: "1. Skip a spam bot",
    hint: "On Paste, press try spam. Identify runs. Press Skip.",
  },
  {
    id: "catch",
    label: "2. Keep a job with a never-list",
    hint: "Press try fence. Identify runs. Press Keep.",
  },
  {
    id: "index",
    label: "3. Copy your Index",
    hint: "Open Index. Press Copy INDEX.md. Paste that file into the PokeBot Grok Bot.",
  },
] as const;

export const FABLE_LABELS: Record<FableKind, { press: string; use: string; skip: string; kicker: string }> = {
  button: { kicker: "Button", press: "Press.", use: "Use.", skip: "Skip." },
  readout: { kicker: "Readout", press: "Shows.", use: "Read when.", skip: "Ignore when." },
  ready: { kicker: "Ready", press: "This page.", use: "Read when.", skip: "Hide when." },
};
