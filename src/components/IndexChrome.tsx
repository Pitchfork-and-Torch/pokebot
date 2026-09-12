import { exportIndex } from "../lib/indexMarkdown";
import { play } from "../lib/sound";
import { useFableTip } from "../state/fableHover";
import { useSave } from "../state/save";
import { useState } from "react";

export function IndexChrome() {
  const api = useSave();
  const { tip, hot } = useFableTip();
  const [note, setNote] = useState("");
  const md = exportIndex(api.save);

  async function copyMd() {
    try {
      await navigator.clipboard.writeText(md);
      play("catch", api.save.mute);
      setNote("INDEX.md copied.");
    } catch {
      setNote("Copy failed.");
    }
  }

  function downloadMd() {
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "INDEX.md";
    a.click();
    URL.revokeObjectURL(a.href);
    play("catch", api.save.mute);
    setNote("INDEX.md downloaded.");
  }

  return (
    <div className="index-chrome">
      <label className="sr-only" htmlFor="trainer-chrome">
        Trainer
      </label>
      <input
        id="trainer-chrome"
        value={api.save.trainerName}
        onChange={(e) => api.setTrainerName(e.target.value)}
        maxLength={24}
        aria-label="Trainer name"
      />
      <button className={`primary${hot("copyIndex")}`} type="button" onClick={() => void copyMd()} {...tip("copyIndex")}>
        INDEX.md
      </button>
      <button type="button" className={hot("downloadIndex").trim()} onClick={downloadMd} {...tip("downloadIndex")}>
        Save file
      </button>
      {note ? <span className="dim">{note}</span> : null}
    </div>
  );
}
