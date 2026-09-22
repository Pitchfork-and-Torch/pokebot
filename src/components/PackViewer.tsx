import { useState } from "react";
import { play } from "../lib/sound";
import { useFableTip } from "../state/fableHover";
import { useSave } from "../state/save";
import firstRun from "../../pack/FIRST_RUN.md?raw";
import profile from "../../pack/PROFILE.md?raw";
import routines from "../../pack/ROUTINES.md?raw";
import shareSanity from "../../pack/SHARE_SANITY.md?raw";
import grill from "../../pack/skills/grill-the-trainer.md?raw";
import identify from "../../pack/skills/identify-specimen.md?raw";
import induct from "../../pack/skills/induct.md?raw";
import team from "../../pack/skills/team-of-six.md?raw";
import weekly from "../../pack/skills/weekly-gym.md?raw";
import sanitizer from "../../pack/skills/share-sanitizer.md?raw";
import indexTpl from "../../pack/templates/INDEX.md?raw";
import encountersTpl from "../../pack/templates/ENCOUNTERS.md?raw";
import cardTpl from "../../pack/templates/CARD.md?raw";
import shareUrlFile from "../../pack/SHARE_URL.txt?raw";

function liveShareUrl(raw: string): string | null {
  const line = raw
    .split(/\n/)
    .map((s) => s.trim())
    .find((s) => /^https:\/\//i.test(s));
  return line ?? null;
}

const FILES: { id: string; label: string; body: string }[] = [
  { id: "profile", label: "PROFILE.md", body: profile },
  { id: "first", label: "FIRST_RUN.md", body: firstRun },
  { id: "grill", label: "grill-the-trainer", body: grill },
  { id: "identify", label: "identify-specimen", body: identify },
  { id: "induct", label: "induct", body: induct },
  { id: "team", label: "team-of-six", body: team },
  { id: "weekly", label: "weekly-gym", body: weekly },
  { id: "sanitizer", label: "share-sanitizer", body: sanitizer },
  { id: "index", label: "INDEX.md", body: indexTpl },
  { id: "enc", label: "ENCOUNTERS.md", body: encountersTpl },
  { id: "card", label: "CARD.md", body: cardTpl },
  { id: "routines", label: "ROUTINES.md", body: routines },
  { id: "share", label: "SHARE_SANITY.md", body: shareSanity },
];

export function PackViewer() {
  const { save } = useSave();
  const { tip, hot } = useFableTip();
  const [id, setId] = useState("profile");
  const [copied, setCopied] = useState("");
  const current = FILES.find((f) => f.id === id) ?? FILES[0];
  const share = liveShareUrl(shareUrlFile);

  async function copy() {
    if (!current) return;
    try {
      await navigator.clipboard.writeText(current.body);
      play("catch", save.mute);
      setCopied("Copied. PokeBot already exists in Grok Bot desktop. Paste only if you are seeding another machine.");
    } catch {
      setCopied("Copy failed. Select the text.");
    }
  }

  return (
    <div className="pack">
      <p className="lede">The site is the trailer. This pack is the creature. Site Index is local. Bot INDEX.md weld is trainer-mode. You still click Add on x.ai.</p>
      <p className="dim">
        {share
          ? `Live share URL on disk: ${share}`
          : "Bot exists on this desktop. Share link not copied yet. Paste it into pack/SHARE_URL.txt when you have it."}
      </p>
      <label htmlFor="packfile">File</label>
      <select id="packfile" value={id} onChange={(e) => setId(e.target.value)}>
        {FILES.map((f) => (
          <option key={f.id} value={f.id}>
            {f.label}
          </option>
        ))}
      </select>
      <div className="row">
        <button className={`primary${hot("packCopy")}`} type="button" onClick={() => void copy()} {...tip("packCopy")}>
          Copy {current?.label}
        </button>
        <span className="dim">{copied}</span>
      </div>
      <pre>{current?.body}</pre>
    </div>
  );
}
