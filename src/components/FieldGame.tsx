import { useCallback, useEffect, useRef, useState, type FormEvent, type PointerEvent as ReactPointerEvent } from "react";
import { INTRO } from "../data/fieldMap";
import type { IdentifyResult, Specimen } from "../data/types";
import {
  KEY_MOVE,
  afterStamp,
  cancel,
  createField,
  identifyPlate,
  interact,
  isCancelKey,
  isConfirmKey,
  plateFor,
  stampKey,
  stampRoast,
  tick,
  tryMove,
  type FieldState,
} from "../lib/field";
import { TILE_PX, drawFrame, fitFieldView, type FieldView } from "../lib/fieldDraw";
import { identifyInput } from "../lib/identifyRemote";
import { downloadCanvas, drawShareCard, modelFromSave } from "../lib/shareCard";
import { play } from "../lib/sound";
import { useSetFieldPad } from "../state/fieldPad";
import { useSave } from "../state/save";
import { TypeChip } from "./TypeChip";

const STEP_MS = 110;

function isTyping(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable;
}

export function FieldGame() {
  const api = useSave();
  const setPad = useSetFieldPad();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<FieldView>(fitFieldView(288, 176));
  const sim = useRef<FieldState>(createField({ intro: true, seed: 7 }));
  const lastStep = useRef(0);
  const hold = useRef<{ dx: number; dy: number } | null>(null);
  const rng = useRef(() => Math.random());
  const [, bump] = useState(0);
  const overlay = () => bump((n) => n + 1);
  const [pasteText, setPasteText] = useState("");
  const [pasteBusy, setPasteBusy] = useState(false);
  const [pasteResult, setPasteResult] = useState<IdentifyResult | null>(null);
  const [lastStamp, setLastStamp] = useState<IdentifyResult | null>(null);

  const mute = api.save.mute;
  const stats = api.stats;

  const applyView = useCallback(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const next = fitFieldView(wrap.clientWidth, wrap.clientHeight);
    viewRef.current = next;
    canvas.width = next.viewW * TILE_PX;
    canvas.height = next.viewH * TILE_PX;
    canvas.style.width = `${next.viewW * next.cell}px`;
    canvas.style.height = `${next.viewH * next.cell}px`;
  }, []);

  const paint = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    drawFrame(ctx, sim.current, sim.current.frame, reduce, (id) => plateFor(id)?.types[0] ?? "ops", viewRef.current);
  }, []);

  const move = useCallback(
    (dx: number, dy: number) => {
      const now = performance.now();
      if (now - lastStep.current < STEP_MS) return;
      const prev = sim.current;
      const next = tryMove(prev, dx, dy, rng.current);
      if (next === prev) return;
      lastStep.current = now;
      sim.current = next;
      if (next.mode === "encounter" && prev.mode !== "encounter") play("identify", mute);
      else if (next.x !== prev.x || next.y !== prev.y) play("click", mute);
      if (next.mode !== prev.mode) overlay();
    },
    [mute],
  );

  const pressA = useCallback(() => {
    const prev = sim.current;
    const next = interact(prev);
    sim.current = next;
    play("a", mute);
    if (next.mode === "paste" && prev.mode !== "paste") {
      setPasteText("");
      setPasteResult(null);
    }
    if (next.mode !== prev.mode || next.toast !== prev.toast) overlay();
  }, [mute]);

  const pressB = useCallback(() => {
    const prev = sim.current;
    const next = cancel(prev);
    sim.current = next;
    if (prev.mode === "paste") {
      setPasteText("");
      setPasteResult(null);
    }
    play("b", mute);
    overlay();
  }, [mute]);

  function saveCard(result: IdentifyResult) {
    const canvas = document.createElement("canvas");
    drawShareCard(canvas, modelFromSave(api.save, result), "portrait");
    downloadCanvas(canvas, `pokebot-${result.name.replace(/[^A-Za-z0-9]+/g, "")}-${result.verdict}.png`);
  }

  const stamp = useCallback(
    (action: "catch" | "watch" | "skip", fromPaste?: IdentifyResult) => {
      const s = sim.current;
      const pasted = fromPaste ?? (s.mode === "paste" ? pasteResult : null);
      if (pasted) {
        if (action === "catch") {
          const done = api.catchResult(pasted, { pin: true });
          if (!done.ok) {
            sim.current = { ...s, toast: done.reason ?? "Cap 50. Release before Keep." };
            play("warn", mute);
            overlay();
            return;
          }
          play("catch", mute);
          sim.current = afterStamp(s, "catch", stampRoast("catch", pasted.verdict));
        } else if (action === "watch") {
          api.watchResult(pasted, pasted.job_one_liner);
          play("watch", mute);
          sim.current = afterStamp(s, "watch", stampRoast("watch", pasted.verdict));
        } else {
          api.skipResult(pasted, pasted.job_one_liner);
          play("skip", mute);
          sim.current = afterStamp(s, "skip", stampRoast("skip", pasted.verdict));
        }
        setLastStamp(pasted);
        setPasteResult(null);
        setPasteText("");
        overlay();
        return;
      }
      if (s.mode !== "encounter" || !s.encounterId) return;
      const spec = plateFor(s.encounterId);
      if (!spec) return;
      const result = identifyPlate(spec, api.save);
      if (action === "catch") {
        const done = api.catchResult(result, { pin: true });
        if (!done.ok) {
          sim.current = { ...s, toast: done.reason ?? "Cap 50. Release before Keep." };
          play("warn", mute);
          overlay();
          return;
        }
        play("catch", mute);
        const roast = stampRoast("catch", result.verdict) + (done.pinned ? " Pinned to a hole." : " Boxed. Six from the desk.");
        sim.current = afterStamp(s, "catch", roast);
      } else if (action === "watch") {
        api.watchResult(result, spec.job);
        play("watch", mute);
        sim.current = afterStamp(s, "watch", stampRoast("watch", result.verdict));
      } else {
        api.skipResult(result, spec.job);
        play("skip", mute);
        sim.current = afterStamp(s, "skip", stampRoast("skip", result.verdict));
      }
      setLastStamp(result);
      overlay();
      window.setTimeout(() => {
        if (sim.current.toast) {
          sim.current = { ...sim.current, toast: null };
          overlay();
        }
      }, 3200);
    },
    [api, mute, pasteResult],
  );

  useEffect(() => {
    setPad({
      active: true,
      move,
      a: pressA,
      b: pressB,
    });
    return () => setPad({ active: false, move: () => undefined, a: () => undefined, b: () => undefined });
  }, [move, pressA, pressB, setPad]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (isTyping(e.target)) return;
      const mode = sim.current.mode;
      if (KEY_MOVE[e.key] && mode === "walk") {
        e.preventDefault();
        const step = KEY_MOVE[e.key];
        if (step) move(step[0], step[1]);
        return;
      }
      if (mode === "encounter" || (mode === "paste" && pasteResult)) {
        const act = stampKey(e.key);
        if (act) {
          e.preventDefault();
          stamp(act);
          return;
        }
      }
      if (isConfirmKey(e.key)) {
        e.preventDefault();
        if (mode !== "encounter" && mode !== "paste") pressA();
        return;
      }
      if (isCancelKey(e.key) || e.key === "?") {
        e.preventDefault();
        if (e.key === "?" && mode === "walk") {
          sim.current = { ...sim.current, mode: "help" };
          overlay();
          return;
        }
        pressB();
      }
    }
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [move, pasteResult, pressA, pressB, stamp]);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    applyView();
    const ro = new ResizeObserver(() => applyView());
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [applyView]);

  useEffect(() => {
    let raf = 0;
    const loop = () => {
      const held = hold.current;
      if (held && sim.current.mode === "walk") move(held.dx, held.dy);
      sim.current = tick(sim.current, rng.current);
      paint();
      raf = window.requestAnimationFrame(loop);
    };
    raf = window.requestAnimationFrame(loop);
    return () => window.cancelAnimationFrame(raf);
  }, [move, paint]);

  function startHold(e: ReactPointerEvent<HTMLButtonElement>, dx: number, dy: number) {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    hold.current = { dx, dy };
    move(dx, dy);
  }
  function endHold() {
    hold.current = null;
  }

  async function onPasteIdentify(e: FormEvent) {
    e.preventDefault();
    const raw = pasteText.trim();
    if (!raw) return;
    setPasteBusy(true);
    try {
      const r = await identifyInput(raw, { activeCount: api.stats.active });
      api.markSeen(r.id);
      setPasteResult(r);
      play("identify", mute);
      overlay();
    } finally {
      setPasteBusy(false);
    }
  }

  const s = sim.current;
  const spec: Specimen | undefined = s.encounterId ? plateFor(s.encounterId) : undefined;
  const wildResult = spec ? identifyPlate(spec, api.save) : null;
  const card = s.mode === "paste" ? pasteResult : wildResult;
  const overlayOn = s.mode !== "walk";

  return (
    <section className="field-shell" aria-label="Field">
      <div className="field-canvas-wrap" ref={wrapRef}>
        <canvas ref={canvasRef} role="img" aria-label="Field map. WASD to walk." />
        {overlayOn ? null : (
          <div className="field-hud">
            <span>SEEN {stats.seen}</span>
            <span>INDEX {stats.caught}</span>
            <span>SIX {stats.attention}/6</span>
            <span>BOTS {stats.cap}/50</span>
          </div>
        )}
        {s.toast && s.mode === "walk" ? <p className="field-toast">{s.toast}</p> : null}
        {lastStamp && s.mode === "walk" ? (
          <button type="button" className="ghost field-save" onClick={() => saveCard(lastStamp)}>
            Save card
          </button>
        ) : null}
        {overlayOn ? (
          <div className="field-overlay" role="dialog" aria-live="polite">
            {s.mode === "intro" || s.mode === "help" ? (
              <>
                <pre className="field-intro">{s.mode === "help" ? INTRO + "\n\nEsc or B closes help." : INTRO}</pre>
                <button type="button" className="primary" onClick={pressA}>
                  Walk
                </button>
              </>
            ) : null}
            {s.mode === "talk" && s.talk ? (
              <>
                <p className="lede">{s.talk}</p>
                <button type="button" className="primary" onClick={pressA}>
                  OK
                </button>
              </>
            ) : null}
            {s.mode === "paste" && !pasteResult ? (
              <form className="stamp-card" onSubmit={(ev) => void onPasteIdentify(ev)}>
                <p className="dim">LAB PASTE</p>
                <p className="lede">Wish or x.ai/bot URL. Identify stays local. We never click Add.</p>
                <textarea
                  value={pasteText}
                  onChange={(ev) => setPasteText(ev.target.value)}
                  rows={5}
                  placeholder="Own weekly account health. Never contact a customer."
                  aria-label="Paste a job or share URL"
                />
                <div className="hearing-stamps">
                  <button type="submit" className="primary" disabled={pasteBusy || !pasteText.trim()}>
                    Identify
                  </button>
                  <button type="button" onClick={pressB}>
                    Back
                  </button>
                </div>
              </form>
            ) : null}
            {(s.mode === "encounter" && spec && card) || (s.mode === "paste" && card) ? (
              <div className="stamp-card">
                <p className="dim">{s.mode === "paste" ? "WILD · paste" : `WILD · ${spec?.origin ?? "wild"}`}</p>
                <div className="specimen-name">{card?.name}</div>
                <div className="dim">{card?.title}</div>
                <div>
                  {(card?.types ?? []).map((t) => (
                    <TypeChip key={t} id={t} />
                  ))}
                </div>
                <div className={`stamp stamp-xl ${card?.verdict}`}>{card?.verdict}</div>
                <p>{card?.job_one_liner}</p>
                {(card?.never_list.length ?? 0) > 0 ? (
                  <p>
                    <strong>Never:</strong> {card?.never_list.slice(0, 2).join(" / ")}
                  </p>
                ) : (
                  <p className="pressure">No never-list.</p>
                )}
                <ul className="why">
                  {(card?.why ?? []).slice(0, 2).map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
                <div className="hearing-stamps">
                  <button type="button" className="primary" onClick={() => stamp("catch")}>
                    1 Keep
                  </button>
                  <button type="button" onClick={() => stamp("watch")}>
                    2 Watch
                  </button>
                  <button type="button" className="alert" onClick={() => stamp("skip")}>
                    3 Skip
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
        <div className="field-pad" aria-label="Tap controls">
          <div className="field-dpad">
            <span />
            <button
              type="button"
              aria-label="Up"
              onPointerDown={(e) => startHold(e, 0, -1)}
              onPointerUp={endHold}
              onPointerCancel={endHold}
              onLostPointerCapture={endHold}
            >
              U
            </button>
            <span />
            <button
              type="button"
              aria-label="Left"
              onPointerDown={(e) => startHold(e, -1, 0)}
              onPointerUp={endHold}
              onPointerCancel={endHold}
              onLostPointerCapture={endHold}
            >
              L
            </button>
            <span className="dpad-core" />
            <button
              type="button"
              aria-label="Right"
              onPointerDown={(e) => startHold(e, 1, 0)}
              onPointerUp={endHold}
              onPointerCancel={endHold}
              onLostPointerCapture={endHold}
            >
              R
            </button>
            <span />
            <button
              type="button"
              aria-label="Down"
              onPointerDown={(e) => startHold(e, 0, 1)}
              onPointerUp={endHold}
              onPointerCancel={endHold}
              onLostPointerCapture={endHold}
            >
              D
            </button>
            <span />
          </div>
          <p className="field-pad-hint dim">WASD walk. Z talk. 1 2 3 stamp. Lab A pastes.</p>
          <div className="field-ab">
            <button type="button" className="ab-btn" onClick={pressB} aria-label="B, back">
              B
            </button>
            <button type="button" className="ab-btn a" onClick={pressA} aria-label="A, talk">
              A
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
