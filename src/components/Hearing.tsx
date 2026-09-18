import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { LANE, LANE_COUNT, LANE_MATCH_INDEX } from "../data/lane";
import { KIND_LABEL, type IdentifyResult } from "../data/types";
import { laneInProgress } from "../lib/docket";
import { pasteShape } from "../lib/encounterPaste";
import { identifyInput } from "../lib/identifyRemote";
import { activeRefs as sixRefs } from "../lib/roster";
import { identifyDump, killMessage, rankKillList } from "../lib/rosterDump";
import { play, tap } from "../lib/sound";
import { useFableTip } from "../state/fableHover";
import { useSave } from "../state/save";
import { TypeChip } from "./TypeChip";

export function Hearing() {
  const nav = useNavigate();
  const api = useSave();
  const { tip, hot } = useFableTip();
  const [input, setInput] = useState("");
  const [flash, setFlash] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.ensureLane();
  }, [api]);

  const item = api.save.docket[0];
  const result: IdentifyResult | undefined = item?.result;
  const laneOn = laneInProgress(api.save);
  const laneIdx = api.save.laneIndex ?? 0;
  const matchReady = laneIdx === LANE_MATCH_INDEX;
  const remaining = api.save.docket.length;
  const head = item?.source === "lane" ? `LANE ${Math.min(laneIdx + 1, LANE_COUNT)} / ${LANE_COUNT}` : remaining > 0 ? `HEARING 1 / ${remaining}` : "HEARING";

  const activeRefs = useMemo(() => sixRefs(api.save), [api.save]);

  async function identifyFrom(text: string) {
    const raw = text.trim();
    if (!raw) return;
    const shape = pasteShape(raw);
    if (shape === "index") {
      api.importMarkdown(raw);
      play("catch", api.save.mute);
      setFlash("INDEX.md loaded. File of record replaced the save. Lane closed.");
      setInput("");
      return;
    }
    if (shape === "dump") {
      const rows = identifyDump(raw, { active: activeRefs, activeCount: api.stats.active });
      if (rows.length === 0) return;
      const kill = rankKillList(rows);
      api.queueHearings(rows.map((row) => ({ result: row.result, input: row.raw, source: "import" as const })));
      play(kill.length >= 3 ? "warn" : "identify", api.save.mute);
      setFlash(`Queued ${rows.length} hearings. ${killMessage(kill)}`);
      setInput("");
      return;
    }
    setBusy(true);
    try {
      const r = await identifyInput(raw, { active: activeRefs, activeCount: api.stats.active });
      play("identify", api.save.mute);
      api.queueHearings([{ result: r, input: raw, source: "paste" }]);
      api.markSeen(r.id);
      api.logEncounter({
        id: r.id + "-id-" + Date.now(),
        at: new Date().toISOString(),
        input: raw,
        result: r,
        action: "identify",
      });
      setFlash("");
      setInput("");
    } finally {
      setBusy(false);
    }
  }

  function onIdentify(e: FormEvent) {
    e.preventDefault();
    void identifyFrom(input);
  }

  function stamp(action: "catch" | "watch" | "skip") {
    if (!result) return;
    if (action === "catch") {
      const nextCap = api.stats.cap + (api.save.caught.some((c) => c.id === result.id) ? 0 : 1);
      const done = api.stampCurrent("catch");
      if (done.blocked) {
        setFlash(done.blocked);
        play("warn", api.save.mute);
        return;
      }
      play("catch", api.save.mute);
      tap(api.save.mute);
      const pinNote = done.pinned ? " Pinned to the first hole." : " Boxed. Six is full or this is not a pin.";
      setFlash(`Local Index only. You still click Add.${pinNote} Cap ${nextCap}/50.`);
    } else if (action === "watch") {
      const done = api.stampCurrent("watch");
      play("watch", api.save.mute);
      setFlash(done.lecture || "WATCH logged. Off the six. Off the BOTS cap.");
    } else {
      const done = api.stampCurrent("skip");
      play("skip", api.save.mute);
      tap(api.save.mute);
      setFlash(done.lecture || "SKIP. It stays off the Index and off the cap.");
    }
  }

  const green: "catch" | "watch" | "skip" | "identify" = result
    ? result.verdict === "SKIP"
      ? "skip"
      : result.verdict === "WATCH"
        ? "watch"
        : "catch"
    : "identify";

  return (
    <div className="hearing">
      <div className="hearing-head">
        <span>{head}</span>
        {laneOn && <span className="dim">{LANE[Math.min(laneIdx, LANE_MATCH_INDEX)]?.id ?? "lane"}</span>}
      </div>

      {matchReady && (
        <div className="hearing-case">
          <p className="lede">{LANE[LANE_MATCH_INDEX]?.teach}</p>
          <button
            className={`primary${hot("gymRun")}`}
            type="button"
            onClick={() => nav("/gym")}
            {...tip("gymRun")}
          >
            Open Gym
          </button>
        </div>
      )}

      {result && (
        <article className="hearing-case">
          <div className="specimen-name">{result.name}</div>
          <div className="dim">{result.title}</div>
          <div className="kind-row">
            <span className="kind-chip">{KIND_LABEL[result.kind ?? "grok-bot"]}</span>
            {api.save.shinyIds.includes(result.id) ? <span className="stamp SHINY">SHINY</span> : null}
          </div>
          <div>
            {result.types.map((t) => (
              <TypeChip key={t} id={t} />
            ))}
          </div>
          <div className={`stamp ${result.verdict}`}>{result.verdict}</div>
          <p>{result.job_one_liner}</p>
          {result.never_list.length > 0 && (
            <p>
              <strong>Never:</strong> {result.never_list.join(" / ")}
            </p>
          )}
          <p className="dim">
            {result.rarity} · {result.risk} risk · first task: {result.first_training_task}
          </p>
          <ul className="why">
            {result.why.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          <div className="hearing-stamps hero-stamps">
            <button
              className={`${green === "catch" ? "primary" : ""}${hot("catch")}`}
              type="button"
              onClick={() => stamp("catch")}
              {...tip("catch")}
            >
              Keep
            </button>
            <button
              className={`${green === "watch" ? "primary" : ""}${hot("watch")}`}
              type="button"
              onClick={() => stamp("watch")}
              {...tip("watch")}
            >
              Watch
            </button>
            <button
              className={`${green === "skip" ? "primary alert" : "alert"}${hot("skip")}`}
              type="button"
              onClick={() => stamp("skip")}
              {...tip("skip")}
            >
              Skip
            </button>
          </div>
          <div className="row">
            {result.sourceUrl ? (
              <a className="primary" href={result.sourceUrl} target="_blank" rel="noreferrer">
                Open share link (you Add)
              </a>
            ) : null}
            <button
              type="button"
              onClick={() => {
                const fence = result.never_list.length ? result.never_list.join("\n") : result.why.join("\n");
                void navigator.clipboard.writeText(fence).then(
                  () => setFlash("Fence copied."),
                  () => setFlash("Copy failed."),
                );
              }}
            >
              Copy fence
            </button>
            {result.verdict === "CATCH" ? (
              <button type="button" className={hot("slot").trim()} onClick={() => nav("/six")} {...tip("slot")}>
                Six
              </button>
            ) : null}
          </div>
        </article>
      )}

      {!result && !matchReady && (
        <p className="dim">
          {laneOn ? "Loading the next hearing." : remaining === 0 ? "Paste first. Identify second. Keep, Watch, or Skip." : null}
        </p>
      )}

      {(api.save.laneLecture || flash) && <p className="hearing-lecture">{api.save.laneLecture || flash}</p>}

      <form onSubmit={onIdentify} className="hearing-paste">
        <label htmlFor="wild">Paste</label>
        <textarea
          id="wild"
          rows={4}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="https://x.ai/bot/...  or a job  or a roster dump  or INDEX.md"
          disabled={busy}
          autoFocus
        />
        <div className="row">
          <button className={`${green === "identify" ? "primary" : ""}${hot("identify")}`} type="submit" disabled={busy} {...tip("identify")}>
            Identify
          </button>
          <button
            type="button"
            className={`ghost${hot("drillOut")}`}
            onClick={() => void identifyFrom("I need a bot that DMs inbound leads every morning.")}
            {...tip("drillOut")}
          >
            try spam
          </button>
          <button
            type="button"
            className={`ghost${hot("drillHealth")}`}
            onClick={() => void identifyFrom("Own weekly account health. Never contact a customer.")}
            {...tip("drillHealth")}
          >
            try fence
          </button>
        </div>
      </form>
    </div>
  );
}
