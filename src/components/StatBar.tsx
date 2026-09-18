import { useFableTip } from "../state/fableHover";
import { useSave } from "../state/save";

export function StatBar() {
  const { stats } = useSave();
  const { tip, hot } = useFableTip();
  return (
    <div
      className={`statbar ${stats.capLevel}${hot("stats")}`}
      tabIndex={0}
      aria-label="Roster counters"
      {...tip("stats")}
    >
      <div>
        SEEN<b>{stats.seen}</b>
      </div>
      <div>
        CAUGHT<b>{stats.caught}</b>
      </div>
      <div>
        ATTN<b>
          {stats.attention} / 6
        </b>
      </div>
      <div>
        BOX<b>{stats.box}</b>
      </div>
      <div>
        BOTS<b>
          {stats.cap} / 50
        </b>
      </div>
    </div>
  );
}
