"""Cover-crop housing still to 1200x630 JPEG+PNG and stamp ASCII type."""
from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
MASTER = ROOT / "assets" / "masters" / "og-housing-wilds.jpg"
SRC = MASTER
OUT_JPG = ROOT / "public" / "og.jpg"
OUT_PNG = ROOT / "public" / "og.png"
W, H = 1200, 630


def cover(im: Image.Image, w: int, h: int) -> Image.Image:
    src_w, src_h = im.size
    scale = max(w / src_w, h / src_h)
    nw, nh = int(src_w * scale), int(src_h * scale)
    im = im.resize((nw, nh), Image.Resampling.LANCZOS)
    left = (nw - w) // 2
    top = max(0, (nh - h) // 2 - 40)
    return im.crop((left, top, left + w, top + h))


def font(size: int, bold: bool) -> ImageFont.FreeTypeFont:
    path = Path(r"C:\Windows\Fonts\consolab.ttf" if bold else r"C:\Windows\Fonts\consola.ttf")
    return ImageFont.truetype(str(path), size)


def main() -> None:
    if not SRC.exists():
        raise SystemExit("missing assets/masters/og-housing-wilds.jpg")
    raw = Image.open(SRC).convert("RGB")
    card = cover(raw, W, H)
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    draw.rectangle((0, H - 118, W, H), fill=(26, 20, 16, 210))
    draw.text((36, H - 100), "POKEBOT", font=font(36, True), fill=(200, 240, 168, 255))
    draw.text((36, H - 56), "You can have fifty. You can stand six.", font=font(22, False), fill=(231, 215, 182, 255))
    out = Image.alpha_composite(card.convert("RGBA"), overlay).convert("RGB")
    out.save(OUT_JPG, "JPEG", quality=92, optimize=True)
    out.save(OUT_PNG, "PNG", optimize=True)
    print(f"wrote {OUT_JPG} {OUT_JPG.stat().st_size} {out.size}")
    print(f"wrote {OUT_PNG} {OUT_PNG.stat().st_size}")


if __name__ == "__main__":
    main()
