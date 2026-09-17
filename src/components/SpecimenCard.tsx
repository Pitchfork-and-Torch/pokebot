import { KIND_LABEL, type IdentifyResult, type Specimen } from "../data/types";
import { specimenToIdentify } from "../data/types";
import { TypeChip } from "./TypeChip";

export function SpecimenCard({
  specimen,
  result,
  compact,
  shiny,
  legendary,
}: {
  specimen?: Specimen;
  result?: IdentifyResult;
  compact?: boolean;
  shiny?: boolean;
  legendary?: boolean;
}) {
  const card = result ?? (specimen ? specimenToIdentify(specimen) : null);
  if (!card) return null;
  const kind = card.kind ?? "grok-bot";
  return (
    <article className="card">
      <div className="specimen-name">{card.name}</div>
      <div className="dim">{card.title}</div>
      <div className="kind-row">
        <span className="kind-chip">{KIND_LABEL[kind]}</span>
        {shiny ? <span className="stamp SHINY">SHINY</span> : null}
        {legendary ? <span className="stamp LEGENDARY">LEGENDARY</span> : null}
      </div>
      <div>
        {card.types.map((t) => (
          <TypeChip key={t} id={t} />
        ))}
      </div>
      <div className={`stamp ${card.verdict}`}>{card.verdict}</div>
      <p className="clamp">{card.job_one_liner}</p>
      {!compact && (
        <>
          {card.never_list.length > 0 && (
            <p>
              <strong>Never:</strong> {card.never_list.join(" / ")}
            </p>
          )}
          {card.tools_guess.length > 0 && (
            <p>
              <strong>Tools:</strong> {card.tools_guess.join(", ")}
            </p>
          )}
          <p className="dim">
            {card.rarity} · {card.risk} risk · slot {card.slot_advice}
          </p>
          <ul className="why">
            {card.why.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          <p>
            <strong>First task:</strong> {card.first_training_task}
          </p>
        </>
      )}
    </article>
  );
}
