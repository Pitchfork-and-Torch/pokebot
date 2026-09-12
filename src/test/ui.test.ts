import { describe, expect, it } from "vitest";
import { loadSkin } from "../lib/ui";
import { ensureLane, laneInProgress, startLane } from "../lib/docket";
import { blankSave } from "../lib/storage";

describe("desk defaults", () => {
  it("defaults skin to handheld for first visit", () => {
    expect(loadSkin()).toBe("handheld");
  });

  it("starts the lane only when asked", () => {
    expect(laneInProgress(blankSave())).toBe(false);
    expect(ensureLane(blankSave()).docket).toHaveLength(0);
    expect(startLane(blankSave()).docket[0]?.source).toBe("lane");
  });
});
