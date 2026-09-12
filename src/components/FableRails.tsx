import { FABLE_HINTS, FABLE_IDLE, FABLE_LABELS, FABLE_QUESTS, FABLE_WEST, type FableHint } from "../data/fable";
import { LANE, LANE_COUNT, LANE_MATCH_INDEX } from "../data/lane";
import { laneInProgress } from "../lib/docket";
import { useFableTip } from "../state/fableHover";
import { useSave } from "../state/save";
import { Crossfade } from "./Crossfade";

function usePlaque(): FableHint & { kicker: string } {
  const { hover } = useFableTip();
  if (!hover) return { ...FABLE_IDLE, kicker: FABLE_LABELS.ready.kicker };
  const hint = FABLE_HINTS[hover];
  if (!hint) return { ...FABLE_IDLE, kicker: FABLE_LABELS.ready.kicker };
  return { ...hint, kicker: FABLE_LABELS[hint.kind].kicker };
}

export function FableWest() {
  const { hover } = useFableTip();
  const { save } = useSave();
  const skip = save.encounters.some((e) => e.result.verdict === "SKIP");
  const catchOk = save.encounters.some((e) => e.result.verdict === "CATCH");
  const file = save.caught.length > 0;
  const done: Record<string, boolean> = { skip, catch: catchOk, index: file };
  const laneOn = laneInProgress(save);
  const laneIdx = save.laneIndex ?? 0;
  const station = LANE[Math.min(laneIdx, LANE_MATCH_INDEX)];

  return (
    <aside className="fable-rail west" aria-label="How to use this">
      <p className="fable-kicker">{laneOn ? `Lane ${Math.min(laneIdx + 1, LANE_COUNT)} / ${LANE_COUNT}` : FABLE_WEST.kicker}</p>
      <h2 className="fable-title">{laneOn && station ? station.teach : FABLE_WEST.title}</h2>
      <p className="fable-body">{laneOn ? "Stamp the one on the glass. A presses the green stamp. Wrong stamp still advances, with one line saying what the job is." : FABLE_WEST.body}</p>
      <ol className="fable-quests">
        {FABLE_QUESTS.map((q) => (
          <li key={q.id} className={done[q.id] ? "done" : ""}>
            <span className="mark">{done[q.id] ? "Done" : "To do"}</span>
            <span>
              <strong>{q.label}</strong>
              <em>{q.hint}</em>
            </span>
          </li>
        ))}
      </ol>
      <Crossfade k={hover ?? "idle"} slim>
        <p className="fable-foot">{hover ? (FABLE_HINTS[hover]?.title ?? FABLE_WEST.footIdle) : FABLE_WEST.footIdle}</p>
      </Crossfade>
    </aside>
  );
}

export function FableEast() {
  const card = usePlaque();
  const labels = FABLE_LABELS[card.kind];
  const { hover } = useFableTip();
  return (
    <aside className="fable-rail east" aria-live="polite">
      <Crossfade k={hover ?? "idle"}>
        <div className="fable-card">
          <p className="fable-kicker">{card.kicker}</p>
          <h2 className="fable-title">{card.title}</h2>
          <div className="fable-fact">
            <strong>{labels.press}</strong>
            <p>{card.press}</p>
          </div>
          <div className="fable-fact">
            <strong>{labels.use}</strong>
            <p>{card.use}</p>
          </div>
          <div className="fable-fact">
            <strong>{labels.skip}</strong>
            <p>{card.skip}</p>
          </div>
        </div>
      </Crossfade>
    </aside>
  );
}
