import { NavLink } from "react-router-dom";
import { Hearing } from "../components/Hearing";
import { Screen } from "../components/Screen";
import { PRODUCT } from "../data/copy";
import { cheapestKill } from "../lib/ingest";
import { useSave } from "../state/save";

export function Home() {
  const api = useSave();
  const kill = cheapestKill(api.save.caught);

  return (
    <Screen title="Paste">
      <p className="lede">{PRODUCT.fiveSeconds}</p>
      <p>
        <NavLink to="/guide">Field</NavLink>
        <span className="dim"> is the front door. Paste is for a wish or a share URL. Same Index. No HP.</span>
      </p>
      {kill && api.stats.cap >= 40 && (
        <p className="pressure">Cheapest kill: {kill.name}. Release it before Keep.</p>
      )}
      <Hearing />
    </Screen>
  );
}
