import { useState, type ChangeEvent } from "react";
import { Screen } from "../components/Screen";
import { SpecimenCard } from "../components/SpecimenCard";
import { KIND_LABEL } from "../data/types";
import { looksLikeIndex, exportIndex } from "../lib/indexMarkdown";
import { play } from "../lib/sound";
import { useFableTip } from "../state/fableHover";
import { useSave } from "../state/save";

export function IndexPage() {
  const api = useSave();
  const { tip, hot } = useFableTip();
  const [id, setId] = useState(api.save.caught[0]?.id ?? "");
  const [incoming, setIncoming] = useState("");
  const [copied, setCopied] = useState("");
  const [showFile, setShowFile] = useState(false);
  const [n, setN] = useState(String(api.save.declaredExisting || "0"));
  const [names, setNames] = useState("");
  const spec = api.save.caught.find((s) => s.id === id) ?? api.save.caught[0];
  const active = new Set(api.save.activeIds.filter(Boolean));
  const md = exportIndex(api.save);
  const shiny = spec ? api.save.shinyIds.includes(spec.id) : false;
  const legendary = spec ? Boolean(api.save.legendaryStamps[spec.id]) : false;

  async function copyMd() {
    try {
      await navigator.clipboard.writeText(md);
      play("catch", api.save.mute);
      setCopied("INDEX.md copied. Same schema the Grok Bot writes.");
    } catch {
      setCopied("Copy failed. Select the text in IMPORT or here.");
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
  }

  function loadFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    void file.text().then((text) => {
      setIncoming(text);
      setCopied(looksLikeIndex(text) ? "File loaded. Import markdown to replace the save." : "That file is not INDEX.md.");
    });
    e.target.value = "";
  }

  return (
    <Screen title="Box">
      <p className="dim">Caught, stubs, boxed. INDEX.md is also in the header. Paste dumps on Paste.</p>
      {!api.save.censusDone && (
        <form
          className="pressure"
          onSubmit={(e) => {
            e.preventDefault();
            const list = names.split(/\n/).map((s) => s.trim()).filter(Boolean);
            api.setCensus(Number(n) || 0, list.length ? list : undefined);
          }}
        >
          <label htmlFor="census">How many Grok Bots already live on the account? Optional. Names become stubs.</label>
          <div className="row">
            <input id="census" type="number" min={0} max={50} value={n} onChange={(e) => setN(e.target.value)} />
            <button className={`primary${hot("censusSet")}`} type="submit" {...tip("censusSet")}>
              Set census
            </button>
            <button type="button" className={hot("censusNone").trim()} onClick={() => api.setCensus(0)} {...tip("censusNone")}>
              None yet
            </button>
          </div>
          <label htmlFor="census-names">Names on the account (optional)</label>
          <textarea id="census-names" rows={3} value={names} onChange={(e) => setNames(e.target.value)} placeholder="Flick&#10;Root&#10;Costume-bot" />
        </form>
      )}
      <label htmlFor="trainer-idx">Trainer</label>
      <input
        id="trainer-idx"
        value={api.save.trainerName}
        onChange={(e) => api.setTrainerName(e.target.value)}
        maxLength={24}
      />
      <div className="row">
        <button className={`primary${hot("copyIndex")}`} type="button" onClick={() => void copyMd()} {...tip("copyIndex")}>
          Copy INDEX.md
        </button>
        <button type="button" className={hot("downloadIndex").trim()} onClick={downloadMd} {...tip("downloadIndex")}>
          Download
        </button>
        <label className={`file-btn${hot("loadIndex")}`} {...tip("loadIndex")}>
          Load file
          <input type="file" accept=".md,.txt,text/markdown,text/plain" onChange={loadFile} />
        </label>
        <span className="dim">{copied}</span>
      </div>
      <label htmlFor="idx-in">Paste INDEX.md from the Grok Bot, or from ENC</label>
      <textarea id="idx-in" rows={3} value={incoming} onChange={(e) => setIncoming(e.target.value)} />
      <div className="row">
        <button
          type="button"
          className={hot("importMd").trim()}
          disabled={!looksLikeIndex(incoming)}
          onClick={() => {
            api.importMarkdown(incoming);
            play("catch", api.save.mute);
            setCopied("INDEX.md imported. File of record loaded.");
          }}
          {...tip("importMd")}
        >
          Import markdown
        </button>
        <button type="button" onClick={() => setShowFile((v) => !v)}>
          {showFile ? "Hide file" : "Show file"}
        </button>
      </div>
      {showFile && <pre className="index-preview">{md}</pre>}
      {api.save.caught.length === 0 && <p>Empty. Identify on ENC or ingest a dump on IN.</p>}
      <div className="pick-list">
        {api.save.caught.map((s) => (
          <button
            key={s.id}
            type="button"
            className={spec?.id === s.id ? "selected" : ""}
            onClick={() => setId(s.id)}
            {...tip("indexPick")}
          >
            {s.name} · {KIND_LABEL[s.kind ?? "grok-bot"]} ·{" "}
            {s.origin === "stub" ? "STUB" : active.has(s.id) ? "ACTIVE" : api.save.boxedIds.includes(s.id) ? "BOX" : "INDEX"}
          </button>
        ))}
      </div>
      {spec && (
        <>
          <SpecimenCard specimen={spec} compact shiny={shiny} legendary={legendary} />
          <div className="row">
            {active.has(spec.id) ? (
              <span className="dim">On the six</span>
            ) : (
              <button type="button" className={hot("box").trim()} onClick={() => api.box(spec.id)} {...tip("box")}>
                Box
              </button>
            )}
            <button className={`alert${hot("release")}`} type="button" onClick={() => api.release(spec.id)} {...tip("release")}>
              Release
            </button>
            <button
              type="button"
              className={hot("stampShiny").trim()}
              disabled={shiny}
              onClick={() => api.markShiny(spec.id)}
              {...tip("stampShiny")}
            >
              {shiny ? "Shiny" : "Stamp shiny"}
            </button>
            <button
              type="button"
              className={hot("stampLegendary").trim()}
              disabled={legendary}
              onClick={() => api.stampLegendary(spec.id)}
              {...tip("stampLegendary")}
            >
              {legendary ? "Legendary" : "Stamp legendary"}
            </button>
          </div>
        </>
      )}
    </Screen>
  );
}
