import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Screen } from "../components/Screen";
import { DEMO_ROSTER_DUMP } from "../data/demoRoster";
import { looksLikeIndex } from "../lib/indexMarkdown";
import { activeRefs as sixRefs } from "../lib/roster";
import { identifyDump, killMessage, rankKillList } from "../lib/rosterDump";
import { play } from "../lib/sound";
import { useFableTip } from "../state/fableHover";
import { useSave } from "../state/save";

export function ImportPage() {
  const api = useSave();
  const nav = useNavigate();
  const { tip, hot } = useFableTip();
  const [dump, setDump] = useState("");
  const [note, setNote] = useState("");
  const activeRefs = useMemo(() => sixRefs(api.save), [api.save]);
  const rows = dump.trim() ? identifyDump(dump, { active: activeRefs, activeCount: api.stats.active }) : [];
  const kill = rankKillList(rows);

  function ingest() {
    if (looksLikeIndex(dump)) {
      api.importMarkdown(dump);
      play("catch", api.save.mute);
      setNote("INDEX.md imported. File of record loaded.");
      return;
    }
    if (rows.length === 0) return;
    api.queueHearings(rows.map((row) => ({ result: row.result, input: row.raw, source: "import" as const })));
    play(kill.length >= 3 ? "warn" : "catch", api.save.mute);
    setNote(`Queued ${rows.length} hearings. Enc stamps them one at a time. Cap only moves on Catch.`);
    nav("/");
  }

  return (
    <Screen title="Import">
      <p className="lede">Paste the real roster, a fleet dump with kind: lines, or INDEX.md. Ingest fills the docket. Stamp them on Enc. Encounter paste does the same job.</p>
      <label htmlFor="dump">Roster dump</label>
      <textarea id="dump" rows={8} value={dump} onChange={(e) => setDump(e.target.value)} placeholder={"Name\nOne-liner. Never ..."} />
      <div className="row">
        <button className={`primary${hot("ingest")}`} type="button" onClick={ingest} disabled={!looksLikeIndex(dump) && rows.length === 0} {...tip("ingest")}>
          Ingest
        </button>
        <button type="button" className={hot("loadDrill").trim()} onClick={() => setDump(DEMO_ROSTER_DUMP)} {...tip("loadDrill")}>
          Load drill
        </button>
      </div>
      {rows.length > 0 && (
        <>
          <p className="pressure">{killMessage(kill)}</p>
          <div className="pick-list">
            {rows.map((row) => (
              <div key={row.result.id} className="card">
                <strong>{row.name}</strong>{" "}
                <span className={`stamp ${row.result.verdict}`}>{row.result.verdict}</span>
                <p className="clamp dim">{row.result.why[0]}</p>
              </div>
            ))}
          </div>
        </>
      )}
      {note && <p>{note}</p>}
    </Screen>
  );
}
