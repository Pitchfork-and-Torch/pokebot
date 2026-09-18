import { useMemo, useState } from "react";
import { Screen } from "../components/Screen";
import { SpecimenCard } from "../components/SpecimenCard";
import { TypeChip } from "../components/TypeChip";
import { DEX } from "../data/dex";
import { TYPE_IDS, TYPE_META, plateVerdict, specimenToIdentify, type TypeId } from "../data/types";
import { fieldBook, wildBook, botdexCounts, type BotdexBook, type BotdexEntry } from "../lib/botdex";
import { useFableTip } from "../state/fableHover";
import { useSave } from "../state/save";

const MARK_STAMP: Record<BotdexEntry["mark"], string> = {
  unseen: "----",
  seen: "SEEN",
  caught: "CAUGHT",
  watch: "WATCH",
  skip: "SKIP",
};

export function Dex() {
  const api = useSave();
  const { tip, hot } = useFableTip();
  const [book, setBook] = useState<BotdexBook>("field");
  const [type, setType] = useState<TypeId | "all">("all");
  const [key, setKey] = useState(DEX[0] ? "field-" + DEX[0].id : "");

  const field = useMemo(() => fieldBook(api.save), [api.save]);
  const wild = useMemo(() => wildBook(api.save), [api.save]);
  const counts = useMemo(() => botdexCounts(api.save), [api.save]);
  const rows = (book === "field" ? field : wild).filter((e) => type === "all" || e.types.includes(type));
  const selected = rows.find((e) => e.key === key) ?? rows[0] ?? (book === "field" ? field[0] : wild[0]);
  const spec = selected?.specimen ?? DEX.find((s) => s.id === selected?.id);
  const owned = spec ? api.save.caught.some((c) => c.id === spec.id) : false;
  const canCatchSeed = Boolean(spec && book === "field" && !owned && plateVerdict(spec) === "CATCH");

  function catchSeed() {
    if (!spec) return;
    api.catchResult(specimenToIdentify(spec));
    api.markSeen(spec.id);
  }

  function pick(entry: BotdexEntry) {
    setKey(entry.key);
    api.markSeen(entry.id);
  }

  return (
    <Screen title="Botdex">
      <p className="botdex-meta">
        FIELD {counts.fieldSeen}/{counts.field} seen · {counts.fieldCaught} caught · WILD {counts.wild} · {counts.wildCaught} caught
      </p>
      <div className="botdex-tabs">
        <button
          type="button"
          className={book === "field" ? `primary${hot("botdexField")}` : hot("botdexField").trim()}
          onClick={() => {
            setBook("field");
            setKey(field[0]?.key ?? "");
          }}
          {...tip("botdexField")}
        >
          Field
        </button>
        <button
          type="button"
          className={book === "wild" ? `primary${hot("botdexWild")}` : hot("botdexWild").trim()}
          onClick={() => {
            setBook("wild");
            setKey(wild[0]?.key ?? "");
          }}
          {...tip("botdexWild")}
        >
          Wild
        </button>
      </div>
      <div className="botdex-types" role="group" aria-label="Filter by type">
        <button type="button" className={type === "all" ? "on" : ""} onClick={() => setType("all")}>
          All
        </button>
        {TYPE_IDS.map((id) => (
          <button key={id} type="button" className={type === id ? "on" : ""} onClick={() => setType(id)}>
            {TYPE_META[id].label}
          </button>
        ))}
      </div>
      <div className="pick-list" role="listbox" aria-label="Botdex">
        {rows.length === 0 && <p className="dim">{book === "wild" ? "No wilds yet. Stamp jobs on Encounter. They land here." : "No field plates in this type."}</p>}
        {rows.map((e) => (
          <button
            key={e.key}
            type="button"
            role="option"
            aria-selected={e.key === selected?.key}
            className={`${e.key === selected?.key ? "selected" : ""} ${e.mark === "unseen" ? "unseen" : ""}`.trim()}
            onClick={() => pick(e)}
            {...tip("dexPick")}
          >
            No.{e.no} {e.mark === "unseen" && e.book === "wild" ? "----" : e.name} · {e.types.join("/")} · {MARK_STAMP[e.mark]}
            {e.specimen?.kind && e.specimen.kind !== "grok-bot" ? ` · ${e.specimen.kind}` : ""}
          </button>
        ))}
      </div>
      {selected && spec && (
        <>
          <p className="dim">
            No.{selected.no} · {selected.mark.toUpperCase()}
            {selected.book === "wild" ? " · wild plate" : " · field plate"}
          </p>
          <div>
            {selected.types.map((t) => (
              <TypeChip key={t} id={t} />
            ))}
          </div>
          <SpecimenCard specimen={spec} />
          <div className="row">
            {canCatchSeed && (
              <button className={`primary${hot("catchSeed")}`} type="button" onClick={catchSeed} {...tip("catchSeed")}>
                Catch seed
              </button>
            )}
            {owned && <span className="dim">Already in Index</span>}
            {plateVerdict(spec) !== "CATCH" ? <span className="dim">Teaching specimen. Leave it off the six.</span> : null}
          </div>
        </>
      )}
      {selected && !spec && (
        <article className="card">
          <div className="specimen-name">{selected.name}</div>
          <div className="dim">{selected.title}</div>
          <div className={`stamp ${selected.mark === "skip" ? "SKIP" : selected.mark === "watch" ? "WATCH" : "CATCH"}`}>
            {MARK_STAMP[selected.mark]}
          </div>
          <p>{selected.job}</p>
          <p className="dim">Wild plate from a hearing. Open Index if you Caught it.</p>
        </article>
      )}
    </Screen>
  );
}
