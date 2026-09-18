import { PRODUCT } from "../data/copy";
import { TYPE_META, type IdentifyResult, type MondayReport, type SaveFile } from "../data/types";
import type { Slam } from "./gym";
import { stats } from "./roster";

export const CARD_PORTRAIT = { w: 1080, h: 1350 };
export const CARD_LANDSCAPE = { w: 1600, h: 900 };

export interface ShareModel {
  name: string;
  title: string;
  types: string[];
  stamp: "CATCH" | "WATCH" | "SKIP" | "TEAM";
  seen: number;
  caught: number;
  active: number;
  attention: number;
  bots: number;
  trainerName: string;
  flavor: string;
}

export function modelFromSave(save: SaveFile, result?: IdentifyResult): ShareModel {
  const s = stats(save);
  if (result) {
    return {
      name: result.name,
      title: result.title,
      types: result.types.map((t) => TYPE_META[t].label),
      stamp: result.verdict,
      seen: s.seen,
      caught: s.caught,
      active: s.active,
      attention: s.attention,
      bots: s.cap,
      trainerName: save.trainerName,
      flavor: result.why[0] ?? result.job_one_liner,
    };
  }
  const lead = save.caught.find((c) => save.activeIds.includes(c.id)) ?? save.caught[0];
  return {
    name: save.trainerName,
    title: "Field trainer",
    types: lead ? lead.types.map((t) => TYPE_META[t].label) : ["Chief"],
    stamp: "TEAM",
    seen: s.seen,
    caught: s.caught,
    active: s.active,
    attention: s.attention,
    bots: s.cap,
    trainerName: save.trainerName,
    flavor: PRODUCT.oneLiner,
  };
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function drawShareCard(canvas: HTMLCanvasElement, model: ShareModel, kind: "portrait" | "landscape"): void {
  const dim = kind === "portrait" ? CARD_PORTRAIT : CARD_LANDSCAPE;
  canvas.width = dim.w;
  canvas.height = dim.h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.fillStyle = "#1A1410";
  ctx.fillRect(0, 0, dim.w, dim.h);

  ctx.fillStyle = "#E7D7B6";
  roundRect(ctx, 48, 48, dim.w - 96, dim.h - 96, 48);
  ctx.fill();

  ctx.fillStyle = "#3A2F24";
  roundRect(ctx, 96, 120, dim.w - 192, dim.h - 280, 28);
  ctx.fill();

  ctx.fillStyle = "#0B0F0C";
  roundRect(ctx, 128, 152, dim.w - 256, dim.h - 360, 12);
  ctx.fill();

  ctx.fillStyle = "#C8F0A8";
  ctx.font = `700 36px "IBM Plex Mono", monospace`;
  ctx.fillText("POKEBOT FIELD GUIDE", 168, 220);

  ctx.font = `700 96px "Source Serif 4", serif`;
  ctx.fillText(model.name.slice(0, 18), 168, 340);

  ctx.font = `500 36px "IBM Plex Mono", monospace`;
  ctx.fillText(model.title.slice(0, 42), 168, 400);

  let x = 168;
  ctx.font = `700 28px "IBM Plex Mono", monospace`;
  for (const t of model.types) {
    ctx.fillStyle = "#7AA86A";
    ctx.fillRect(x, 440, 160, 48);
    ctx.fillStyle = "#0B0F0C";
    ctx.fillText(t, x + 16, 474);
    x += 176;
  }

  ctx.fillStyle = model.stamp === "SKIP" ? "#E23D28" : model.stamp === "WATCH" ? "#F2C14E" : "#C8F0A8";
  ctx.font = `700 64px "IBM Plex Mono", monospace`;
  ctx.fillText(model.stamp, 168, 580);

  ctx.fillStyle = "#C8F0A8";
  ctx.font = `500 32px "IBM Plex Mono", monospace`;
  ctx.fillText(`SEEN ${model.seen}   CAUGHT ${model.caught}`, 168, 650);
  ctx.fillText(`ATTN ${model.attention} / 6   BOTS ${model.bots} / 50`, 168, 694);

  ctx.font = `500 28px "Source Serif 4", serif`;
  wrapText(ctx, model.flavor, 168, 740, dim.w - 360, 40);

  ctx.fillStyle = "#3A2F24";
  ctx.font = `600 28px "IBM Plex Mono", monospace`;
  ctx.fillText(`${model.trainerName}  ·  ${PRODUCT.oneLiner}`, 120, dim.h - 80);
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, max: number, lh: number): void {
  const words = text.split(" ");
  let line = "";
  let yy = y;
  for (const word of words) {
    const next = line ? line + " " + word : word;
    if (ctx.measureText(next).width > max) {
      ctx.fillText(line, x, yy);
      line = word;
      yy += lh;
    } else {
      line = next;
    }
  }
  if (line) ctx.fillText(line, x, yy);
}

export function drawMondayReport(canvas: HTMLCanvasElement, report: MondayReport, trainerName: string): void {
  const dim = CARD_PORTRAIT;
  canvas.width = dim.w;
  canvas.height = dim.h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.fillStyle = "#1A1410";
  ctx.fillRect(0, 0, dim.w, dim.h);
  ctx.fillStyle = "#E7D7B6";
  roundRect(ctx, 48, 48, dim.w - 96, dim.h - 96, 48);
  ctx.fill();
  ctx.fillStyle = "#0B0F0C";
  roundRect(ctx, 96, 110, dim.w - 192, dim.h - 220, 16);
  ctx.fill();
  ctx.fillStyle = "#C8F0A8";
  ctx.font = `700 28px "IBM Plex Mono", monospace`;
  ctx.fillText("WEEKLY GYM", 140, 170);
  ctx.font = `700 56px "Source Serif 4", serif`;
  ctx.fillText("Monday report", 140, 240);
  ctx.font = `500 26px "IBM Plex Mono", monospace`;
  ctx.fillText(`CAP ${report.cap} / 50    KEEP ${report.keep}    BOX ${report.box}    ATTN ${report.slots.filter((s) => s.id).length} / 6`, 140, 300);
  ctx.fillText(trainerName.slice(0, 28), 140, 340);
  let y = 400;
  ctx.font = `500 28px "IBM Plex Mono", monospace`;
  for (const slot of report.slots) {
    const color = slot.action === "keep" ? "#C8F0A8" : slot.action === "empty" ? "#7AA86A" : "#E23D28";
    ctx.fillStyle = color;
    ctx.fillText(`${slot.slot}  ${slot.name.slice(0, 16).padEnd(16)}  ${slot.action.toUpperCase()}  ${slot.total}`, 140, y);
    y += 48;
  }
  ctx.fillStyle = "#F2C14E";
  ctx.font = `500 26px "IBM Plex Mono", monospace`;
  wrapText(ctx, report.cheapestKill ? `Cheapest kill: ${report.cheapestKill}` : "No cheap kill. Cap is honest.", 140, y + 24, dim.w - 320, 36);
  ctx.fillStyle = "#7AA86A";
  wrapText(ctx, `Brief: ${report.brief}`, 140, y + 120, dim.w - 320, 34);
  ctx.fillStyle = "#3A2F24";
  ctx.font = `600 24px "IBM Plex Mono", monospace`;
  ctx.fillText("PokeBot never clicks Add.", 140, dim.h - 90);
}

export function drawMatchCard(
  canvas: HTMLCanvasElement,
  model: {
    trainer: string;
    brief: string;
    aName: string;
    bName: string;
    winner: "a" | "b" | "tie";
    slams: Slam[];
    challengeName?: string;
  },
): void {
  const dim = CARD_PORTRAIT;
  canvas.width = dim.w;
  canvas.height = dim.h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.fillStyle = "#1A1410";
  ctx.fillRect(0, 0, dim.w, dim.h);
  ctx.fillStyle = "#E7D7B6";
  roundRect(ctx, 48, 48, dim.w - 96, dim.h - 96, 48);
  ctx.fill();
  ctx.fillStyle = "#0B0F0C";
  roundRect(ctx, 96, 110, dim.w - 192, dim.h - 220, 16);
  ctx.fill();
  ctx.fillStyle = "#C8F0A8";
  ctx.font = `700 28px "IBM Plex Mono", monospace`;
  ctx.fillText("BRIEF MATCH", 140, 170);
  ctx.font = `700 52px "Source Serif 4", serif`;
  ctx.fillText(model.winner === "tie" ? "TIE" : `${(model.winner === "a" ? model.aName : model.bName).slice(0, 16)} keeps it`, 140, 240);
  ctx.font = `500 26px "IBM Plex Mono", monospace`;
  ctx.fillStyle = "#7AA86A";
  ctx.fillText(`${model.aName.slice(0, 18)}  vs  ${model.bName.slice(0, 18)}`, 140, 300);
  ctx.fillText(model.trainer.slice(0, 28), 140, 340);
  let y = 420;
  ctx.font = `500 28px "IBM Plex Mono", monospace`;
  for (const slam of model.slams) {
    ctx.fillStyle = slam.winner === "tie" ? "#F2C14E" : "#C8F0A8";
    ctx.fillText(`${slam.label.padEnd(6)}  ${slam.a}  ${slam.b}  ${slam.winner.toUpperCase()}`, 140, y);
    y += 56;
  }
  ctx.fillStyle = "#F2C14E";
  wrapText(ctx, `Brief: ${model.brief}`, 140, y + 24, dim.w - 320, 34);
  if (model.challengeName) {
    ctx.fillStyle = "#7AA86A";
    ctx.fillText(`Challenger: ${model.challengeName.slice(0, 28)}`, 140, y + 140);
  }
  ctx.fillStyle = "#3A2F24";
  ctx.font = `600 24px "IBM Plex Mono", monospace`;
  ctx.fillText("PokeBot never clicks Add.", 140, dim.h - 90);
}

export function downloadCanvas(canvas: HTMLCanvasElement, filename: string): void {
  const url = canvas.toDataURL("image/png");
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
}
