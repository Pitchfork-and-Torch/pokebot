import { NavLink, useNavigate } from "react-router-dom";
import { Screen } from "../components/Screen";
import { MORE_LINKS, PRODUCT } from "../data/copy";
import { useSave } from "../state/save";

export function More() {
  const api = useSave();
  const nav = useNavigate();

  return (
    <Screen title="More">
      <p className="lede">{PRODUCT.fiveSeconds}</p>
      <p className="dim">Field is the walkable game. Pack, Monday, and the handheld toys live here. Paste, Six, and Box are the product.</p>
      <div className="more-list">
        {MORE_LINKS.map((item) => (
          <NavLink key={item.title} to={item.to}>
            {item.label}
            <span className="dim"> {item.title}</span>
          </NavLink>
        ))}
      </div>
      <div className="row">
        <button
          type="button"
          onClick={() => {
            api.startLane();
            nav("/");
          }}
        >
          Teach me (lane of hearings)
        </button>
        <button type="button" className="alert" onClick={() => api.reset()}>
          Reset local Index
        </button>
      </div>
    </Screen>
  );
}
