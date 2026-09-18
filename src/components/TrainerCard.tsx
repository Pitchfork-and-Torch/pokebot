import { useEffect, useRef } from "react";
import { downloadCanvas, drawShareCard, modelFromSave } from "../lib/shareCard";
import { useFableTip } from "../state/fableHover";
import { useSave } from "../state/save";

export function TrainerCard() {
  const api = useSave();
  const { tip, hot } = useFableTip();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const last = api.save.encounters.find((e) => e.action === "identify" || e.action === "catch");

  function paint(kind: "portrait" | "landscape") {
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawShareCard(canvas, modelFromSave(api.save, last?.result), kind);
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawShareCard(canvas, modelFromSave(api.save, last?.result), "portrait");
  }, [api.save, last]);

  function download(kind: "portrait" | "landscape") {
    paint(kind);
    const canvas = canvasRef.current;
    if (!canvas) return;
    downloadCanvas(canvas, kind === "portrait" ? "pokebot-card-1080x1350.png" : "pokebot-card-1600x900.png");
  }

  return (
    <div>
      <p className="lede">Attach the PNG. Link unfurls flake. A downloads portrait.</p>
      <label htmlFor="trainer">Trainer name</label>
      <input
        id="trainer"
        value={api.save.trainerName}
        onChange={(e) => api.setTrainerName(e.target.value)}
      />
      <div className="row">
        <button className={`primary${hot("cardPortrait")}`} type="button" onClick={() => download("portrait")} {...tip("cardPortrait")}>
          Download portrait
        </button>
        <button type="button" className={hot("cardLandscape").trim()} onClick={() => download("landscape")} {...tip("cardLandscape")}>
          Landscape
        </button>
      </div>
      <canvas ref={canvasRef} className="share-preview" role="img" aria-label="Trainer card preview" />
    </div>
  );
}
