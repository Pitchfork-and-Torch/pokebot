import { Screen } from "../components/Screen";
import { TYPE_IDS, TYPE_META } from "../data/types";
import { TypeChip } from "../components/TypeChip";
import { CAP_HARD, CAP_MAX, CAP_WARN, ACTIVE_MAX } from "../lib/roster";

export function Lab() {
  return (
    <Screen title="Lab">
      <h2>Types</h2>
      <div>
        {TYPE_IDS.map((id) => (
          <p key={id}>
            <TypeChip id={id} /> {TYPE_META[id].job}
          </p>
        ))}
      </div>
      <h2>Rarity</h2>
      <ul className="why">
        <li>common: vague job, general helper, no never-list</li>
        <li>uncommon: one clear job, weak fence</li>
        <li>rare: one job + tools + never-list + approval surface</li>
        <li>legendary: rare + recurring outcome owned for a stated duration (you stamp it; we do not fake dates)</li>
      </ul>
      <h2>Cap math</h2>
      <p>
        Active {ACTIVE_MAX}. Account cap {CAP_MAX}. Warn at {CAP_WARN}. Hard-warn at {CAP_HARD}.
        Chip tape: boot, identify, catch, skip, watch, mode, cap warn. Mute with Tape off. Reduced motion silences the score except A/B.
        Catching a stub upgrades it and does not add a 51st. Skills, MCP, clocks, and Telegram sit on ATTN 6, not BOTS 50.
        Cheapest kill is named at 40+. A clock off the six is a WATCH. Released does not count.
      </p>
    </Screen>
  );
}
