import { NavLink, useLocation } from "react-router-dom";
import { FOOTER, NAV, PRODUCT } from "../data/copy";
import { useSave } from "../state/save";
import { useSkin } from "../state/skin";
import { IndexChrome } from "./IndexChrome";
import { SixRail } from "./SixRail";
import type { ReactNode } from "react";

export function Desk({ children }: { children: ReactNode }) {
  const loc = useLocation();
  const { stats } = useSave();
  const { setSkin } = useSkin();
  const split = loc.pathname === "/";
  const play = loc.pathname === "/guide" || loc.pathname === "/field";
  const showAttn = stats.attention > 0 || stats.caught > 0;

  return (
    <div className="desk">
      <header className="desk-top">
        <div className="desk-brand">
          <strong>{PRODUCT.name}</strong>
          <span className="dim">{PRODUCT.version}</span>
        </div>
        <p className="desk-job">{PRODUCT.fiveSeconds}</p>
        <div className="desk-meters" aria-label="Roster counters">
          <span>
            BOTS <b>{stats.cap}/50</b>
          </span>
          <span>
            SIX <b>{stats.attention}/6</b>
          </span>
          {showAttn ? (
            <span>
              INDEX <b>{stats.caught}</b>
            </span>
          ) : null}
        </div>
        <IndexChrome />
        <button type="button" className="ghost" onClick={() => setSkin("handheld")}>
          Handheld
        </button>
      </header>
      <nav className="desk-nav" aria-label="Primary">
        {NAV.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.to === "/"}>
            {item.title}
          </NavLink>
        ))}
      </nav>
      <div className={split ? "desk-split" : play ? "desk-play" : "desk-page"}>
        <main className="desk-main" id="screen" tabIndex={-1}>
          {children}
        </main>
        {split ? <SixRail /> : null}
      </div>
      <footer className="desk-foot">{FOOTER}</footer>
    </div>
  );
}
