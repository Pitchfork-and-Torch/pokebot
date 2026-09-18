export const PRODUCT = {
  name: "PokeBot",
  title: "Field Guide",
  version: "v4.0",
  oneLiner: "Walk the field. Keep six. Never Add.",
  fiveSeconds: "Walk. Identify. Keep, Watch, or Skip. We never click Add.",
} as const;

export const NAV = [
  { to: "/guide", label: "FIELD", title: "FIELD" },
  { to: "/", label: "PASTE", title: "PASTE" },
  { to: "/six", label: "SIX", title: "SIX" },
  { to: "/box", label: "BOX", title: "BOX" },
  { to: "/more", label: "MORE", title: "MORE" },
] as const;

export const MORE_LINKS = [
  { to: "/pack", label: "Pack", title: "Install pack" },
  { to: "/gym", label: "Monday", title: "Monday gym" },
  { to: "/share", label: "Card", title: "Trainer card" },
  { to: "/guide", label: "Field", title: "Walk the field" },
  { to: "/dex", label: "Botdex", title: "Field plates (handheld toy)" },
  { to: "/gym", label: "Match", title: "Brief match (handheld toy)" },
  { to: "/lab", label: "Lab", title: "Types and cap math" },
  { to: "/encounters", label: "Log", title: "Encounter log" },
] as const;

export const FOOTER =
  "Original work. Not affiliated with SpaceXAI, xAI, or Nintendo. Third-party Grok Bot templates are untrusted. Adding one accepts x.ai third-party bot terms. PokeBot never clicks Add for you.";

export const ADD_REMINDER =
  "Catch writes to your local Index only. Open the share link yourself if you actually add the bot. PokeBot never clicks Add.";

export const BANNED_MARKS = [
  "pikachu",
  "pokeball",
  "poke ball",
  "pokedex",
  "pokédex",
  "poké ball",
  "pokemon",
  "pokémon",
] as const;
