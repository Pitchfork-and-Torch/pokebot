import { useEffect, useRef, useState } from "react";
import { LANE_MATCH_BRIEF } from "../data/lane";
import type { IdentifyResult } from "../data/types";
import { specimenToIdentify } from "../data/types";
import { exportChallenge, looksLikeChallenge, parseChallenge } from "../lib/challenge";
import { playMatch, type Slam } from "../lib/gym";
import { identifyInput } from "../lib/identifyRemote";
import { downloadCanvas, drawMatchCard } from "../lib/shareCard";
import { play } from "../lib/sound";
import { useFableTip } from "../state/fableHover";
import { useSave } from "../state/save";

export function Match() {
  const api = useSave();
  const { tip, hot } = useFableTip();
  const six = api.save.activeIds
    .map((id) => (id ? api.caughtById(id) : undefined))
    .filter((s): s is NonNullable<typeof s> => Boolean(s));
  const [aId, setAId] = useState(six[0]?.id ?? "");
  const [bId, setBId] = useState(six[1]?.id ?? "");
  const [brief, setBrief] = useState(LANE_MATCH_BRIEF);
  const [paste, setPaste] = useState("");
  const [challenger, setChallenger] = useState<IdentifyResult | null>(null);
  const [challengeName, setChallengeName] = useState("");
  const [note, setNote] = useState("");
  const [slams, setSlams] = useState<Slam[]>([]);
  const [shown, setShown] = useState(0);
  const [winner, setWinner] = useState<"a" | "b" | "tie" | "">("");
  const [aName, setAName] = useState("");
  const [bName, setBName] = useState("");
  const [copied, setCopied] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const specA = six.find((s) => s.id === aId) ?? six[0];
  const specB = challenger ? null : six.find((s) => s.id === bId) ?? six[1];

  useEffect(() => {
    const ids = api.save.activeIds.filter((id): id is string => Boolean(id));
    if (!aId && ids[0]) setAId(ids[0]);
    if (!bId && ids[1]) setBId(ids[1]);
  }, [api.save.activeIds, aId, bId]);

  useEffect(() => {
    if (shown >= slams.length || slams.length === 0) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setShown(slams.length);
      return;
    }
    const t = window.setTimeout(() => {
      const slam = slams[shown];
      play(slam?.winner === "tie" ? "watch" : slam?.winner === "a" ? "catch" : "skip", api.save.mute);
      setShown((n) => n + 1);
    }, 420);
    return () => window.clearTimeout(t);
  }, [shown, slams, api.save.mute]);

  async function loadChallenger() {
    const raw = paste.trim();
    if (!raw) return;
    if (looksLikeChallenge(raw)) {
      const slip = parseChallenge(raw);
      const first = slip.side[0];
      if (!first) {
        setNote("Challenge slip had no roster.");
        return;
      }
      setChallenger(first);
      setChallengeName(slip.trainer);
      if (slip.brief) setBrief(slip.brief);
      setNote(`Side B is ${first.name} from ${slip.trainer}.`);
      play("identify", api.save.mute);
      return;
    }
    const result = await identifyInput(raw, { activeCount: api.stats.active });
    setChallenger(result);
    setChallengeName(result.sourceUrl ? "wild template" : "");
    if (result.job_one_liner && !result.why[0]?.startsWith("Preview had no job text")) {
      setBrief(result.job_one_liner);
    }
    setNote(result.why[0] ?? `${result.name} is side B.`);
    api.markSeen(result.id);
    play("identify", api.save.mute);
  }

  function run() {
    if (!specA) {
      setNote("Pin two to the six, or paste a challenger for side B.");
      return;
    }
    const a = specimenToIdentify(specA);
    const b = challenger ?? (specB ? specimenToIdentify(specB) : null);
    if (!b) {
      setNote("Pick side B from the six, or paste a share URL / challenge slip.");
      return;
    }
    const played = playMatch(brief, a, b);
    api.addGym(played.record);
    setAName(a.name);
    setBName(b.name);
    setSlams(played.slams);
    setWinner(played.record.winner);
    setShown(0);
    setNote("");
    const canvas = canvasRef.current;
    if (canvas) {
      drawMatchCard(canvas, {
        trainer: api.save.trainerName,
        brief,
        aName: a.name,
        bName: b.name,
        winner: played.record.winner,
        slams: played.slams,
        challengeName,
      });
    }
  }

  async function copySlip() {
    const md = exportChallenge(api.save, brief);
    try {
      await navigator.clipboard.writeText(md);
      play("catch", api.save.mute);
      setCopied("CHALLENGE.md copied.");
    } catch {
      setCopied("Copy failed. Select the text from Card or here.");
    }
  }

  function download() {
    const canvas = canvasRef.current;
    if (!canvas || !winner) return;
    downloadCanvas(canvas, "pokebot-brief-match-1080x1350.png");
  }

  const done = shown >= slams.length && slams.length > 0;
  const loserId = winner === "a" ? specB?.id : winner === "b" ? specA?.id : undefined;

  return (
    <div className="match">
      <p className="lede">Two bots. One brief. Three stamps: Job, Fence, Hold. A runs the match.</p>
      <label htmlFor="match-brief">Brief</label>
      <textarea id="match-brief" rows={2} value={brief} onChange={(e) => setBrief(e.target.value)} />
      <div className="row">
        <label>
          Side A
          <select aria-label="Side A" value={specA?.id ?? ""} onChange={(e) => setAId(e.target.value)} {...tip("matchA")}>
            {six.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Side B
          <select
            aria-label="Side B"
            value={challenger ? "__chal__" : (specB?.id ?? "")}
            onChange={(e) => {
              if (e.target.value === "__chal__") return;
              setChallenger(null);
              setChallengeName("");
              setBId(e.target.value);
            }}
            {...tip("matchB")}
          >
            {challenger && <option value="__chal__">{challenger.name}</option>}
            {six.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label htmlFor="challenger">Paste an x.ai/bot URL, a blurb, or a CHALLENGE.md slip</label>
      <textarea id="challenger" rows={3} value={paste} onChange={(e) => setPaste(e.target.value)} {...tip("challenger")} />
      <div className="row">
        <button type="button" className={hot("challenger").trim()} onClick={() => void loadChallenger()} {...tip("challenger")}>
          Load side B
        </button>
        <button type="button" className={hot("copyChallenge").trim()} onClick={() => void copySlip()} {...tip("copyChallenge")}>
          Copy CHALLENGE.md
        </button>
        <span className="dim">{copied}</span>
      </div>
      <div className="row">
        <button className={`primary${hot("matchRun")}`} type="button" onClick={run} {...tip("matchRun")}>
          Run match
        </button>
        <button type="button" className={hot("gymPng").trim()} onClick={download} disabled={!done} {...tip("gymPng")}>
          Download PNG
        </button>
      </div>
      {note && <p className="hearing-lecture">{note}</p>}
      {slams.length > 0 && (
        <div className="match-glass">
          <div className="match-names">
            <strong>{aName}</strong>
            <span className="dim">vs</span>
            <strong>{bName}</strong>
          </div>
          {slams.slice(0, shown).map((slam) => (
            <p key={slam.id} className="match-slam">
              <span className="stamp CATCH">{slam.label}</span> {aName} {slam.a} · {bName} {slam.b} · {slam.winner === "tie" ? "TIE" : slam.winner === "a" ? aName : bName}
            </p>
          ))}
          {done && (
            <p className={`match-winner stamp ${winner === "tie" ? "WATCH" : "CATCH"}`}>
              {winner === "tie" ? "TIE" : `${winner === "a" ? aName : bName} keeps the brief`}
            </p>
          )}
          {done && loserId && (
            <button type="button" className={`alert${hot("box")}`} onClick={() => api.box(loserId)} {...tip("box")}>
              Box loser
            </button>
          )}
        </div>
      )}
      <canvas ref={canvasRef} className="share-preview" role="img" aria-label="Match share card preview" hidden={!done} />
    </div>
  );
}
