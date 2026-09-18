import { useEffect, useRef, useState } from "react";
import { LANE_MATCH_BRIEF, LANE_MATCH_INDEX } from "../data/lane";
import { TYPE_META } from "../data/types";
import { mondayGym } from "../lib/monday";
import { downloadCanvas, drawMondayReport } from "../lib/shareCard";
import { play } from "../lib/sound";
import { useFableTip } from "../state/fableHover";
import { useSave } from "../state/save";

export function GymArena() {
  const api = useSave();
  const { tip, hot } = useFableTip();
  const laneMatch = (api.save.laneIndex ?? 0) === LANE_MATCH_INDEX;
  const [brief, setBrief] = useState(LANE_MATCH_BRIEF);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const report = api.save.monday;
  const lockedBrief = laneMatch ? LANE_MATCH_BRIEF : brief;

  function run() {
    const next = mondayGym(api.save, lockedBrief);
    play(next.box > 0 ? "warn" : "identify", api.save.mute);
    api.setMonday(next);
    if (laneMatch) api.finishLane();
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !report) return;
    drawMondayReport(canvas, report, api.save.trainerName);
  }, [report, api.save.trainerName]);

  function download() {
    const canvas = canvasRef.current;
    if (!canvas || !report) return;
    drawMondayReport(canvas, report, api.save.trainerName);
    downloadCanvas(canvas, "pokebot-weekly-gym-1080x1350.png");
  }

  return (
    <div>
      <p className="lede">Monday match. One brief. Score the Active six. A runs. KEEP / BOX is the stamp. Then download the PNG.</p>
      <label htmlFor="brief">Brief</label>
      <textarea
        id="brief"
        rows={3}
        value={lockedBrief}
        onChange={(e) => setBrief(e.target.value)}
        disabled={laneMatch}
      />
      <div className="row">
        <button className={`primary${hot("gymRun")}`} type="button" onClick={run} {...tip("gymRun")}>
          Run Monday gym
        </button>
        <button type="button" className={hot("gymPng").trim()} onClick={download} disabled={!report} {...tip("gymPng")}>
          Download PNG
        </button>
      </div>
      {report && (
        <>
          <p className="pressure">
            KEEP {report.keep} · BOX {report.box} · CAP {report.cap}/50 · ATTN {report.slots.filter((s) => s.id).length}/6
            {report.cheapestKill ? ` · cheapest kill ${report.cheapestKill}` : ""}
          </p>
          {report.holes.length > 0 && (
            <p className="dim">Holes: {report.holes.map((h) => TYPE_META[h].label).join(", ")}</p>
          )}
          <div className="pick-list">
            {report.slots.map((slot) => (
              <div key={slot.slot} className="card">
                <strong>
                  {slot.slot} {slot.name}
                </strong>{" "}
                <span className={`stamp ${slot.action === "keep" ? "CATCH" : slot.action === "empty" ? "WATCH" : "SKIP"}`}>
                  {slot.action.toUpperCase()}
                </span>
                <p className="dim clamp">{slot.note}</p>
                {slot.id && (
                  <div className="row">
                    <button type="button" className={hot("box").trim()} onClick={() => api.box(slot.id!)} {...tip("box")}>
                      Box
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
          <canvas ref={canvasRef} className="share-preview" />
        </>
      )}
    </div>
  );
}
