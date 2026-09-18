import { TYPE_META, type TypeId } from "../data/types";
import { MAP_H, MAP_W, tileAt } from "./field";
import type { FieldState } from "./field";

export const TILE_PX = 16;
export const VIEW_W = 18;
export const VIEW_H = 11;

export interface FieldView {
  viewW: number;
  viewH: number;
  cell: number;
}

export function fitFieldView(cssW: number, cssH: number): FieldView {
  const w = Math.max(80, Math.floor(cssW));
  const h = Math.max(80, Math.floor(cssH));
  const cell = Math.max(8, Math.min(48, Math.floor(h / MAP_H)));
  const viewH = Math.min(MAP_H, Math.max(8, Math.floor(h / cell)));
  const viewW = Math.min(MAP_W, Math.max(10, Math.floor(w / cell)));
  return { viewW, viewH, cell };
}

function hexRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

export function fill(ctx: CanvasRenderingContext2D, color: string, x: number, y: number, w: number, h: number): void {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

function px(ctx: CanvasRenderingContext2D, color: string, x: number, y: number, w = 1, h = 1): void {
  fill(ctx, color, x, y, w, h);
}

function tileColor(ch: string, x: number, y: number, t: number): string {
  const dither = ((x + y) & 1) === 0;
  if (ch === "#") return dither ? "#1c2a1e" : "#152018";
  if (ch === "~") return (Math.floor(t / 18) + x + y) % 2 === 0 ? "#2a6a78" : "#348090";
  if (ch === "g") return dither ? "#2f7a3c" : "#3d9450";
  if (ch === "L" || ch === "@") return dither ? "#3a5840" : "#486848";
  if (ch === "T") return dither ? "#5a4a28" : "#6a5a30";
  if (ch === "A") return dither ? "#3a5040" : "#486048";
  if (ch === "M") return dither ? "#6a3850" : "#7a4460";
  if (ch === "H") return dither ? "#7a6040" : "#8c7048";
  if (ch === "F") return dither ? "#7a4828" : "#8c5430";
  if (ch === "C") return dither ? "#2a5870" : "#3a6880";
  return dither ? "#4a8a48" : "#5aa058";
}

function drawBrick(ctx: CanvasRenderingContext2D, x: number, y: number, ink: string): void {
  px(ctx, ink, x, y, 16, 1);
  px(ctx, ink, x, y + 15, 16, 1);
  px(ctx, ink, x, y, 1, 16);
  px(ctx, ink, x + 15, y, 1, 16);
  px(ctx, ink, x + 8, y + 8, 1, 1);
}

export function drawCreature(
  ctx: CanvasRenderingContext2D,
  ox: number,
  oy: number,
  type: TypeId,
  bob: number,
  npc: boolean,
  step: number,
): void {
  const [r, g, b] = hexRgb(TYPE_META[type].color);
  const body = npc ? "#f2c14e" : `rgb(${r},${g},${b})`;
  const ink = "#0b0f0c";
  const x = ox + (step ? 1 : 0);
  const y = oy + bob + 1;
  fill(ctx, "rgba(11,15,12,0.45)", x + 2, y + 13, 11, 2);

  if (npc || type === "chief") {
    px(ctx, "#f2c14e", x + 3, y, 9, 3);
    px(ctx, ink, x + 2, y + 2, 11, 1);
    px(ctx, body, x + 3, y + 3, 9, 9);
    px(ctx, ink, x + 2, y + 3, 1, 9);
    px(ctx, ink, x + 12, y + 3, 1, 9);
    px(ctx, ink, x + 5, y + 6, 2, 2);
    px(ctx, ink, x + 8, y + 6, 2, 2);
    px(ctx, ink, x + 6, y + 9, 3, 1);
    return;
  }

  px(ctx, body, x + 3, y + 3, 10, 10);
  px(ctx, ink, x + 2, y + 2, 12, 1);
  px(ctx, ink, x + 2, y + 3, 1, 10);
  px(ctx, ink, x + 13, y + 3, 1, 10);
  px(ctx, ink, x + 2, y + 13, 12, 1);

  if (type === "scout") {
    px(ctx, "#f2c14e", x + 5, y, 5, 3);
    px(ctx, ink, x + 6, y + 1, 3, 1);
    px(ctx, ink, x + 4, y + 6, 8, 2);
    px(ctx, body, x + 6, y + 6, 4, 2);
  } else if (type === "scribe") {
    px(ctx, body, x + 12, y + 1, 2, 10);
    px(ctx, ink, x + 12, y + 11, 2, 2);
    px(ctx, ink, x + 5, y + 6, 5, 1);
    px(ctx, ink, x + 5, y + 8, 4, 1);
  } else if (type === "ops") {
    px(ctx, "#c8f0a8", x + 4, y + 4, 8, 8);
    px(ctx, ink, x + 4, y + 6, 8, 1);
    px(ctx, ink, x + 4, y + 9, 8, 1);
    px(ctx, ink, x + 6, y + 5, 1, 7);
  } else if (type === "forge") {
    px(ctx, "#e23d28", x + 6, y, 4, 3);
    px(ctx, ink, x + 4, y + 6, 8, 2);
    px(ctx, ink, x + 7, y + 4, 2, 6);
  } else if (type === "sense") {
    px(ctx, ink, x + 4, y + 7, 8, 2);
    px(ctx, "#c8f0a8", x + 5, y + 7, 2, 2);
    px(ctx, "#c8f0a8", x + 9, y + 7, 2, 2);
    px(ctx, ink, x + 7, y + 10, 2, 2);
  } else if (type === "voice") {
    px(ctx, body, x + 12, y + 5, 3, 5);
    px(ctx, ink, x + 12, y + 6, 1, 3);
    px(ctx, ink, x + 4, y + 6, 3, 3);
  } else if (type === "keep") {
    px(ctx, body, x + 1, y + 4, 13, 3);
    px(ctx, "#e23d28", x + 6, y + 7, 3, 4);
    px(ctx, ink, x + 7, y + 8, 1, 2);
  } else {
    px(ctx, ink, x + 5, y + 6, 2, 2);
    px(ctx, ink, x + 8, y + 6, 2, 2);
  }
}

export function drawPlayer(ctx: CanvasRenderingContext2D, ox: number, oy: number, dir: number, frame: number): void {
  const bob = Math.floor(frame / 10) % 2;
  const step = Math.floor(frame / 8) % 2;
  const x = ox + (step ? 1 : 0);
  const y = oy + bob + 1;
  fill(ctx, "rgba(11,15,12,0.5)", x + 2, y + 13, 11, 2);
  px(ctx, "#3a2f24", x + 4, y, 7, 4);
  px(ctx, "#e7d7b6", x + 3, y + 4, 9, 9);
  px(ctx, "#0b0f0c", x + 5, y + 6, 2, 2);
  px(ctx, "#0b0f0c", x + 8, y + 6, 2, 2);
  const slabX = dir === 3 ? x : x + 10;
  px(ctx, "#3a2f24", slabX, y + 6, 4, 5);
  px(ctx, "#c8f0a8", slabX + 1, y + 7, 2, 3);
  if (dir === 0) px(ctx, "#3a2f24", x + 5, y + 12, 2, 2);
  if (dir === 2) px(ctx, "#3a2f24", x + 8, y + 12, 2, 2);
}

export function drawFrame(
  ctx: CanvasRenderingContext2D,
  state: FieldState,
  t: number,
  reduce: boolean,
  plateType: (id: string) => TypeId,
  view: FieldView = { viewW: VIEW_W, viewH: VIEW_H, cell: TILE_PX },
): void {
  const viewW = view.viewW;
  const viewH = view.viewH;
  const camX = Math.max(0, Math.min(state.x - Math.floor(viewW / 2), Math.max(0, MAP_W - viewW)));
  const camY = Math.max(0, Math.min(state.y - Math.floor(viewH / 2), Math.max(0, MAP_H - viewH)));
  ctx.imageSmoothingEnabled = false;
  fill(ctx, "#0b0f0c", 0, 0, viewW * TILE_PX, viewH * TILE_PX);
  for (let y = 0; y < viewH; y++) {
    for (let x = 0; x < viewW; x++) {
      const mx = camX + x;
      const my = camY + y;
      const ch = tileAt(mx, my);
      const px0 = x * TILE_PX;
      const py0 = y * TILE_PX;
      fill(ctx, tileColor(ch, mx, my, t), px0, py0, TILE_PX, TILE_PX);
      if (ch === "g" && !reduce && (t + mx) % 20 < 2) {
        fill(ctx, "#4a8a50", px0 + 3, py0 + 2, 2, 3);
        fill(ctx, "#2a5a30", px0 + 10, py0 + 8, 2, 4);
      }
      if ("LTAHFCM@".includes(ch)) {
        drawBrick(ctx, px0, py0, "rgba(11,15,12,0.35)");
      }
    }
  }
  const bob = reduce ? 0 : Math.floor(t / 12) % 2;
  const step = reduce ? 0 : Math.floor(t / 10) % 2;
  for (const actor of state.actors) {
    const ax = actor.x - camX;
    const ay = actor.y - camY;
    if (ax < -1 || ay < -1 || ax > viewW || ay > viewH) continue;
    drawCreature(ctx, ax * TILE_PX, ay * TILE_PX, plateType(actor.id), bob, actor.npc, actor.wander ? step : 0);
  }
  drawPlayer(ctx, (state.x - camX) * TILE_PX, (state.y - camY) * TILE_PX, state.dir, reduce ? 0 : state.frame);
  if (state.flash > 0) {
    ctx.fillStyle = `rgba(200,240,168,${0.12 * state.flash})`;
    ctx.fillRect(0, 0, viewW * TILE_PX, viewH * TILE_PX);
  }
}
