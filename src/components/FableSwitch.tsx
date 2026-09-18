import { play } from "../lib/sound";
import { useFableTip } from "../state/fableHover";
import { useSave } from "../state/save";

export function FableSwitch() {
  const { save, setTutorial } = useSave();
  const { tip, hot } = useFableTip();
  const on = save.tutorial !== false;
  return (
    <div className="fable-switch">
      <span className="fable-switch-kicker">Fable</span>
      <button
        type="button"
        className={(on ? "on" : "") + hot("fable")}
        role="switch"
        aria-checked={on}
        aria-label={on ? "Hide the how-to pages" : "Show the how-to pages"}
        {...tip("fable")}
        onClick={() => {
          play("click", save.mute);
          setTutorial(!on);
        }}
      >
        <i />
      </button>
      <span className="fable-switch-state" data-on={on ? "1" : "0"}>
        {on ? "On" : "Off"}
      </span>
    </div>
  );
}
