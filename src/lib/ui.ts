export type Skin = "desk" | "handheld";

export const SKIN_KEY = "pokebot.skin";

export function loadSkin(): Skin {
  if (typeof localStorage === "undefined") return "handheld";
  try {
    const raw = localStorage.getItem(SKIN_KEY);
    if (raw === "desk") return "desk";
    return "handheld";
  } catch {
    return "handheld";
  }
}

export function persistSkin(skin: Skin): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(SKIN_KEY, skin);
  } catch {
    /* ignore */
  }
}
