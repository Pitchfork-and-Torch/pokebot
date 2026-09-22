import { Screen } from "../components/Screen";
import { useSave } from "../state/save";

export function Encounters() {
  const { save } = useSave();
  return (
    <Screen title="Encounter log">
      {save.encounters.length === 0 && <p>No encounters yet.</p>}
      {save.encounters.map((e) => (
        <article className="card" key={e.id}>
          <div className={`stamp ${e.result.verdict}`}>
            {e.action.toUpperCase()} · {e.result.verdict}
          </div>
          <p>{e.result.name}</p>
          <p className="dim">{e.input}</p>
        </article>
      ))}
    </Screen>
  );
}
