export const TILE = {
  wall: "#",
  grass: ".",
  tall: "g",
  water: "~",
  lab: "L",
  tower: "T",
  archive: "A",
  market: "M",
  hearth: "H",
  forge: "F",
  ops: "C",
  spawn: "@",
} as const;

export type TileCh = (typeof TILE)[keyof typeof TILE];

export const FIELD_ROWS = [
  "############################",
  "#TTT....AAAAA.....MMMMMMMM##",
  "#T.T....A...A.....M......M##",
  "#TTT....AAAAA.....MMMMMMMM##",
  "#..............gg.........##",
  "#....~~~~.....gg....HHHHH###",
  "#....~~~~.....gg....H...H###",
  "#...................HHHHH###",
  "#........ggggg.......FFFF###",
  "#........ggggg.......F..F###",
  "#~~~~................FFFF###",
  "#~~~~......LLLLL....CCCCC###",
  "#..........L...L....C...C###",
  "#..........L.@.L....CCCCC###",
  "#..........LLLLL..........##",
  "############################",
] as const;

export type RegionId = "lab" | "tower" | "archive" | "market" | "hearth" | "forge" | "ops" | "grass" | "path";

export interface Sign {
  x: number;
  y: number;
  text: string;
}

export interface SpawnPoint {
  id: string;
  x: number;
  y: number;
  wander: boolean;
  npc?: boolean;
}

export const SIGNS: Sign[] = [
  { x: 4, y: 2, text: "TOWER. Two chiefs is a zoo. Identify, then stamp." },
  { x: 10, y: 2, text: "ARCHIVE. Sources, not vibes." },
  { x: 22, y: 2, text: "MARKET ROW. Voice without a never-list is a mouth. Skip." },
  { x: 21, y: 6, text: "HEARTH PATH. Keep, not concierge." },
  { x: 22, y: 9, text: "FORGE YARD. Heat is allowed. Merge is not." },
  { x: 20, y: 12, text: "OPS ROW. Files over inboxes." },
  { x: 12, y: 9, text: "TALL GRASS. Costumes hide here. Read the job before Keep." },
  { x: 13, y: 12, text: "LAB. A on empty lab pastes a wish or share URL. 1 Keep, 2 Watch, 3 Skip. We never click Add." },
];

export const SPAWNS: SpawnPoint[] = [
  { id: "pokebot", x: 12, y: 13, wander: false, npc: true },
  { id: "spray", x: 20, y: 2, wander: true },
  { id: "blaster", x: 23, y: 2, wander: true },
  { id: "callbox", x: 21, y: 1, wander: true },
  { id: "firstdraft", x: 19, y: 3, wander: true },
  { id: "egghat", x: 3, y: 2, wander: true },
  { id: "overlord", x: 2, y: 1, wander: true },
  { id: "hivekeep", x: 1, y: 3, wander: false },
  { id: "datedcite", x: 9, y: 2, wander: true },
  { id: "monthcut", x: 11, y: 1, wander: true },
  { id: "querybrief", x: 10, y: 3, wander: true },
  { id: "vendorsave", x: 16, y: 13, wander: false },
  { id: "ledger", x: 22, y: 13, wander: true },
  { id: "billwatch", x: 21, y: 11, wander: true },
  { id: "mergemancer", x: 21, y: 8, wander: true },
  { id: "patchlock", x: 23, y: 9, wander: true },
  { id: "boardwatch", x: 22, y: 8, wander: true },
  { id: "kitbag", x: 20, y: 5, wander: true },
  { id: "leafbook", x: 22, y: 6, wander: true },
  { id: "dockhand", x: 21, y: 7, wander: true },
  { id: "shiftchief", x: 2, y: 3, wander: false },
  { id: "donegate", x: 4, y: 1, wander: false },
  { id: "uwubot", x: 15, y: 8, wander: true },
  { id: "basedpepe", x: 13, y: 10, wander: false },
];

export const GRASS_RATE = 0.3;

export const INTRO = [
  "FIELD GUIDE",
  "Walk the field. Identify wilds. Keep six.",
  "WASD or arrows move. Z or Enter talks.",
  "On a wild: 1 Keep, 2 Watch, 3 Skip.",
  "Lab A pastes a URL. We never click Add.",
].join("\n");
