import { describe, expect, it } from "vitest";
import { FABLE_HINTS, FABLE_IDLE, FABLE_QUESTS, FABLE_WEST, type FableId } from "../data/fable";
import boot from "../components/Boot.tsx?raw";
import encounter from "../components/Hearing.tsx?raw";
import gym from "../components/GymArena.tsx?raw";
import match from "../components/Match.tsx?raw";
import gymPage from "../pages/Gym.tsx?raw";
import housing from "../components/Housing.tsx?raw";
import pack from "../components/PackViewer.tsx?raw";
import statbar from "../components/StatBar.tsx?raw";
import fableSwitch from "../components/FableSwitch.tsx?raw";
import team from "../components/TeamGrid.tsx?raw";
import trainer from "../components/TrainerCard.tsx?raw";
import dex from "../pages/Dex.tsx?raw";
import home from "../pages/Home.tsx?raw";
import idx from "../pages/IndexPage.tsx?raw";
import imp from "../pages/Import.tsx?raw";

const IDS = Object.keys(FABLE_HINTS) as FableId[];
const WIRED = [boot, encounter, gym, match, gymPage, housing, pack, statbar, fableSwitch, team, trainer, dex, home, idx, imp].join("\n");

function blob(): string {
  return [JSON.stringify(FABLE_HINTS), JSON.stringify(FABLE_IDLE), JSON.stringify(FABLE_WEST), JSON.stringify(FABLE_QUESTS)].join("\n");
}

describe("fable copy", () => {
  it("covers every control with press, use, and skip", () => {
    expect(IDS.length).toBeGreaterThanOrEqual(30);
    for (const id of IDS) {
      const hint = FABLE_HINTS[id];
      expect(hint.title.length, id).toBeGreaterThan(0);
      expect(hint.press.length, id).toBeGreaterThan(12);
      expect(hint.use.length, id).toBeGreaterThan(8);
      expect(hint.skip.length, id).toBeGreaterThan(8);
    }
    expect(FABLE_IDLE.press.length).toBeGreaterThan(12);
    expect(FABLE_IDLE.use.length).toBeGreaterThan(8);
    expect(FABLE_IDLE.skip.length).toBeGreaterThan(8);
  });

  it("speaks in the affirmative", () => {
    const text = blob().toLowerCase();
    expect(text.includes("this is not")).toBe(false);
    expect(text.includes("isn't a")).toBe(false);
    expect(text.includes("is not a fighter")).toBe(false);
    expect(text.includes("save battery")).toBe(false);
    expect(text.includes("green glass")).toBe(false);
    expect(text.includes("only game")).toBe(false);
    expect(text.includes("skip a costume")).toBe(false);
    expect(text.includes("catch a fence")).toBe(false);
  });

  it("wires every hint id onto a clickable", () => {
    for (const id of IDS) {
      expect(WIRED.includes(`"${id}"`), id).toBe(true);
    }
  });
});
