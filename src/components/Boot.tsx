import { useFableTip } from "../state/fableHover";

export function Boot({ onPower }: { onPower: () => void }) {
  const { tip, hot } = useFableTip();
  return (
    <div className="boot" role="dialog" aria-label="Power on">
      <p className="boot-sys">FIELD GUIDE SYSTEM</p>
      <p className="boot-mark">POKEBOT</p>
      <p className="boot-ver">handheld v4.0</p>
      <button className={`primary boot-a${hot("a")}`} type="button" onClick={onPower} {...tip("a")}>
        Press A
      </button>
      <p className="dim boot-hint">Press A. Walk the field. Keep six. Never Add.</p>
    </div>
  );
}
