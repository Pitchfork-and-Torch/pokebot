import { useEffect, useRef, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { FOOTER, NAV, PRODUCT } from "../data/copy";
import { armAudio, play } from "../lib/sound";
import { FableHoverProvider, useFableTip } from "../state/fableHover";
import { useFieldPad } from "../state/fieldPad";
import { useSave } from "../state/save";
import { useSkin } from "../state/skin";
import { FableEast, FableWest } from "./FableRails";
import { FableSwitch } from "./FableSwitch";
import { StatBar } from "./StatBar";

function isTypingTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable;
}

function HousingShell({ children }: { children: ReactNode }) {
  const { save, setMute, stats } = useSave();
  const { setSkin } = useSkin();
  const { tip, hot } = useFableTip();
  const field = useFieldPad();
  const loc = useLocation();
  const nav = useNavigate();
  const bodyRef = useRef<HTMLDivElement>(null);
  const idx = Math.max(0, NAV.findIndex((item) => item.to === loc.pathname));
  const mode = NAV[idx] ?? NAV[0];
  const capPct = Math.min(100, (stats.cap / 50) * 100);
  const fable = save.tutorial !== false;

  function cycle(dir: -1 | 1) {
    const next = NAV[(idx + dir + NAV.length) % NAV.length];
    if (next) {
      play("mode", save.mute);
      nav(next.to);
    }
  }

  function scrollBody(dir: -1 | 1) {
    bodyRef.current?.scrollBy({ top: dir * 96, behavior: "smooth" });
  }

  function pressA() {
    if (field.active) {
      field.a();
      return;
    }
    play("a", save.mute);
    const btn = bodyRef.current?.querySelector("button.primary") as HTMLButtonElement | null;
    btn?.click();
  }

  function pressB() {
    if (field.active) {
      field.b();
      return;
    }
    play("b", save.mute);
    if (loc.pathname !== "/") nav("/");
    else bodyRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (isTypingTarget(e.target) && e.key !== "Escape") return;
      if (field.active) return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        cycle(-1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        cycle(1);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        scrollBody(-1);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        scrollBody(1);
      } else if (e.key === "Enter" && !isTypingTarget(e.target)) {
        e.preventDefault();
        pressA();
      } else if (e.key === "Escape") {
        e.preventDefault();
        pressB();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [idx, loc.pathname, nav, save.mute, field.active]);

  function swallow(e: ReactKeyboardEvent) {
    e.stopPropagation();
  }

  return (
    <div className={`stage ${fable ? "fable" : ""}`}>
      <div className="dust" aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
      </div>
      <div className="housing-tools">
        <button type="button" className="ghost" onClick={() => setSkin("desk")}>
          Desk
        </button>
        <FableSwitch />
      </div>
      {fable && <FableWest />}
      <div className="housing">
        <header className="brand-lock">
          Field Guide System
          <strong>POKEBOT</strong>
          {PRODUCT.version} handheld
        </header>
        <div className="bezel">
          <div className="screen">
            <main className="screen-main" id="screen" tabIndex={-1}>
              <div className="screen-hud">
                <div className="top-row">
                  <div>
                    {PRODUCT.name} {PRODUCT.version}
                  </div>
                  <button
                    type="button"
                    className={`mute${hot("tape")}`}
                    {...tip("tape")}
                    onClick={() => {
                      const next = !save.mute;
                      if (!next) armAudio();
                      play("click", next);
                      setMute(next);
                    }}
                    aria-pressed={save.mute}
                  >
                    {save.mute ? "Tape off" : "Tape on"}
                  </button>
                </div>
                <StatBar />
                <div
                  className={`cap-meter ${stats.capLevel}${hot("cap")}`}
                  role="meter"
                  tabIndex={0}
                  aria-label="Account cap"
                  aria-valuemin={0}
                  aria-valuemax={50}
                  aria-valuenow={stats.cap}
                  aria-valuetext={`bots ${stats.cap} of 50, attention ${stats.attention} of 6`}
                  {...tip("cap")}
                >
                  <span style={{ width: `${capPct}%` }} />
                </div>
                <div className="mode-row">
                  <button
                    type="button"
                    className={`ghost mode-btn${hot("left")}`}
                    onClick={() => cycle(-1)}
                    aria-label="Previous mode"
                    {...tip("left")}
                  >
                    LEFT
                  </button>
                  <div className="mode-name">
                    <span className="dim">
                      {idx + 1}/{NAV.length}
                    </span>
                    <strong>{mode?.title}</strong>
                  </div>
                  <button
                    type="button"
                    className={`ghost mode-btn${hot("right")}`}
                    onClick={() => cycle(1)}
                    aria-label="Next mode"
                    {...tip("right")}
                  >
                    RIGHT
                  </button>
                </div>
              </div>
              <div className="screen-body" id="screen-body" ref={bodyRef} tabIndex={0} onKeyDown={swallow}>
                <div className="screen-pane" key={loc.pathname}>
                  {children}
                </div>
              </div>
            </main>
            <footer className="screen-status">{FOOTER}</footer>
          </div>
        </div>
        <div className="controls">
          <div className="dpad" role="group" aria-label={field.active ? "Walk the field" : "D-pad"}>
            <span />
            <button
              type="button"
              aria-label={field.active ? "Walk north" : "Scroll up"}
              className={hot("dpadU").trim()}
              onClick={() => (field.active ? field.move(0, -1) : scrollBody(-1))}
              {...tip("dpadU")}
            >
              U
            </button>
            <span />
            <button
              type="button"
              aria-label={field.active ? "Walk west" : "Previous mode"}
              className={hot("dpadL").trim()}
              onClick={() => (field.active ? field.move(-1, 0) : cycle(-1))}
              {...tip("dpadL")}
            >
              L
            </button>
            <span className="dpad-core" />
            <button
              type="button"
              aria-label={field.active ? "Walk east" : "Next mode"}
              className={hot("dpadR").trim()}
              onClick={() => (field.active ? field.move(1, 0) : cycle(1))}
              {...tip("dpadR")}
            >
              R
            </button>
            <span />
            <button
              type="button"
              aria-label={field.active ? "Walk south" : "Scroll down"}
              className={hot("dpadD").trim()}
              onClick={() => (field.active ? field.move(0, 1) : scrollBody(1))}
              {...tip("dpadD")}
            >
              D
            </button>
            <span />
          </div>
          <nav className="type-pads" aria-label="Shortcuts">
            <NavLink to="/" end className={({ isActive }) => `${isActive ? "active" : ""}${hot("enc")}`} {...tip("enc")}>
              Enc
            </NavLink>
            <NavLink to="/dex" className={({ isActive }) => `${isActive ? "active" : ""}${hot("dex")}`} {...tip("dex")}>
              Bdx
            </NavLink>
            <NavLink to="/six" className={({ isActive }) => `${isActive ? "active" : ""}${hot("team")}`} {...tip("team")}>
              Six
            </NavLink>
          </nav>
          <div className="ab">
            <button
              type="button"
              className={`ab-btn${hot("b")}`}
              onClick={pressB}
              aria-label={field.active ? "B, back" : "B, back to encounter"}
              {...tip("b")}
            >
              B
            </button>
            <button
              type="button"
              className={`ab-btn a${hot("a")}`}
              onClick={pressA}
              aria-label={field.active ? "A, talk" : "A, primary action"}
              {...tip("a")}
            >
              A
            </button>
          </div>
        </div>
        <div className="ports">
          <span>Power on</span>
          <span>A identify · B back</span>
        </div>
      </div>
      {fable && <FableEast />}
    </div>
  );
}

export function Housing({ children }: { children: ReactNode }) {
  return (
    <FableHoverProvider>
      <HousingShell>{children}</HousingShell>
    </FableHoverProvider>
  );
}
