import { NavLink } from "react-router-dom";
import { KIND_LABEL } from "../data/types";
import { useSave } from "../state/save";
import { TypeChip } from "./TypeChip";

export function SixRail() {
  const api = useSave();
  return (
    <aside className="six-rail" aria-label="Active six">
      <div className="six-rail-head">
        <strong>Six</strong>
        <NavLink to="/six">edit</NavLink>
      </div>
      <ol className="six-rail-list">
        {api.save.activeIds.map((id, i) => {
          const spec = id ? api.caughtById(id) : undefined;
          return (
            <li key={i}>
              <button
                type="button"
                className={spec ? "filled" : "empty"}
                onClick={() => {
                  if (spec) api.box(spec.id);
                }}
                disabled={!spec}
              >
                <span className="dim">{i + 1}</span>
                {spec ? (
                  <>
                    <span>{spec.name}</span>
                    <TypeChip id={spec.types[0] ?? "ops"} />
                    {spec.kind && spec.kind !== "grok-bot" ? (
                      <span className="kind-chip">{KIND_LABEL[spec.kind]}</span>
                    ) : null}
                  </>
                ) : (
                  <span className="dim">empty</span>
                )}
              </button>
            </li>
          );
        })}
      </ol>
      <p className="dim">
        {api.stats.caught} in Index · {api.stats.box} boxed. Keep pins a hole. Skip does not.
      </p>
    </aside>
  );
}
