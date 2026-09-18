import { useState } from "react";
import { GymArena } from "../components/GymArena";
import { Match } from "../components/Match";
import { Screen } from "../components/Screen";
import { LANE_MATCH_INDEX } from "../data/lane";
import { useFableTip } from "../state/fableHover";
import { useSave } from "../state/save";

export function Gym() {
  const { save } = useSave();
  const { tip, hot } = useFableTip();
  const laneMatch = (save.laneIndex ?? 0) === LANE_MATCH_INDEX;
  const [tab, setTab] = useState<"monday" | "match">(laneMatch ? "monday" : "match");
  return (
    <Screen title="Gym">
      <div className="botdex-tabs">
        <button
          type="button"
          className={tab === "monday" ? `primary${hot("mondayTab")}` : hot("mondayTab").trim()}
          onClick={() => setTab("monday")}
          {...tip("mondayTab")}
        >
          Monday
        </button>
        <button
          type="button"
          className={tab === "match" ? `primary${hot("matchTab")}` : hot("matchTab").trim()}
          onClick={() => setTab("match")}
          {...tip("matchTab")}
        >
          Match
        </button>
      </div>
      {tab === "monday" ? <GymArena /> : <Match />}
    </Screen>
  );
}
