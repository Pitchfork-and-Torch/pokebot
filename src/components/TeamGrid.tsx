import { useState } from "react";
import { TYPE_META } from "../data/types";
import { pressureLines, typeHoles } from "../lib/pressure";
import { useFableTip } from "../state/fableHover";
import { useSave } from "../state/save";
import { TypeChip } from "./TypeChip";

export function TeamGrid() {
  const api = useSave();
  const { tip, hot } = useFableTip();
  const [selected, setSelected] = useState<string | null>(null);
  const bench = api.save.caught.filter((s) => !api.save.activeIds.includes(s.id));
  const holes = typeHoles(api.save);
  const pressure = pressureLines(api.save);

  function onSlot(index: number) {
    const current = api.save.activeIds[index];
    if (selected) {
      api.pin(index, selected);
      setSelected(null);
      return;
    }
    if (current) api.unpin(index);
  }

  return (
    <div>
      <p className="dim">Tap a boxed name, then a slot. A pins the selection into the first empty hole. Tap a filled slot to box it.</p>
      {pressure[0] && <p className="pressure">{pressure[0]}</p>}
      {holes.length > 0 && api.save.activeIds.some(Boolean) && (
        <p className="dim">Holes: {holes.map((t) => TYPE_META[t].label).join(", ")}</p>
      )}
      <div className="team-grid" role="list">
        {api.save.activeIds.map((id, i) => {
          const spec = id ? api.caughtById(id) : undefined;
          return (
            <button
              key={i}
              type="button"
              className={`slot ${spec ? "filled" : ""}`}
              onClick={() => onSlot(i)}
              aria-label={spec ? `Slot ${i + 1} ${spec.name}` : `Empty slot ${i + 1}`}
              {...tip("teamSlot")}
            >
              <div className="dim">SLOT {i + 1}</div>
              {spec ? (
                <>
                  <strong>{spec.name}</strong>
                  <div>
                    {spec.types.map((t) => (
                      <TypeChip key={t} id={t} />
                    ))}
                  </div>
                </>
              ) : (
                <span>empty</span>
              )}
            </button>
          );
        })}
      </div>
      <h2>Box</h2>
      <div className="bench">
        {bench.length === 0 && <p className="dim">Keep from Paste, then pin here.</p>}
        {bench.map((s) => (
          <button
            key={s.id}
            type="button"
            className={selected === s.id ? "selected" : ""}
            onClick={() => setSelected(s.id === selected ? null : s.id)}
            {...tip("benchPick")}
          >
            {s.name}
          </button>
        ))}
      </div>
      {selected && (
        <div className="row">
          <button
            className={`primary${hot("pin")}`}
            type="button"
            {...tip("pin")}
            onClick={() => {
              const hole = api.save.activeIds.findIndex((slot) => slot === null);
              if (hole >= 0) {
                api.pin(hole, selected);
                setSelected(null);
              }
            }}
          >
            Pin to first hole
          </button>
        </div>
      )}
    </div>
  );
}
