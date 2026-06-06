from __future__ import annotations

import math
import shutil
from pathlib import Path

from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageFont


ROOT = Path(__file__).resolve().parent
REPO = ROOT.parent.parent
WIDTH = 1920
HEIGHT = 1080
DURATION = 8
FPS = 24
FRAME_COUNT = DURATION * FPS
OUT_DIR = REPO / "static" / "videos"
POSTER = OUT_DIR / "resource-tools-loop-poster.jpg"
FRAME_DIR = REPO / "_resource_tools_frames"


def loop(t: float, phase: float = 0.0) -> float:
    return math.sin((t + phase) * math.tau)


def ease(t: float) -> float:
    return 0.5 - 0.5 * math.cos(t * math.tau)


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    paths = [
        "C:/Windows/Fonts/segoeuib.ttf" if bold else "C:/Windows/Fonts/segoeui.ttf",
        "C:/Windows/Fonts/arialbd.ttf" if bold else "C:/Windows/Fonts/arial.ttf",
    ]
    for path in paths:
        try:
            return ImageFont.truetype(path, size=size)
        except OSError:
            continue
    return ImageFont.load_default()


TAG_FONT = font(27, True)


def rounded(draw: ImageDraw.ImageDraw, box, radius, fill, outline=None, width=1):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def background(t: float) -> Image.Image:
    img = Image.new("RGBA", (WIDTH, HEIGHT), (248, 245, 238, 255))
    d = ImageDraw.Draw(img)
    d.rectangle((0, 0, WIDTH, HEIGHT), fill=(248, 245, 238, 255))
    d.ellipse((-260, -220, 900, 680), fill=(235, 248, 245, 210))
    d.ellipse((1110, 480, 2240, 1320), fill=(240, 166, 201, 64))
    d.ellipse((610, 130, 1400, 900), fill=(220, 233, 255, 92))
    img = img.filter(ImageFilter.GaussianBlur(78))

    grid = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    gd = ImageDraw.Draw(grid)
    sx = int(loop(t, .12) * 14)
    sy = int(loop(t, .38) * 8)
    for x in range(-104 + sx, WIDTH + 104, 104):
        gd.line((x, 0, x, HEIGHT), fill=(47, 88, 165, 24), width=1)
    for y in range(-104 + sy, HEIGHT + 104, 104):
        gd.line((0, y, WIDTH, y), fill=(47, 88, 165, 22), width=1)
    img.alpha_composite(grid)
    return img


def draw_card(base: Image.Image, x: int, y: int, w: int, h: int, label: str, t: float, phase: float):
    dx = int(loop(t, phase) * 8)
    dy = int(loop(t, phase + .2) * 10)
    opacity = int(130 + 34 * (0.5 + 0.5 * loop(t, phase + .1)))
    blur_mix = 0.5 + 0.5 * loop(t, phase + .35)
    card = Image.new("RGBA", (w + 90, h + 90), (0, 0, 0, 0))
    shadow = Image.new("RGBA", card.size, (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    rounded(sd, (34, 34, 34 + w, 34 + h), 24, (61, 95, 148, 34))
    shadow = shadow.filter(ImageFilter.GaussianBlur(30))
    card.alpha_composite(shadow)
    d = ImageDraw.Draw(card)
    rounded(d, (34, 34, 34 + w, 34 + h), 24, (255, 255, 255, opacity), (127, 163, 216, 104), 2)
    d.ellipse((16, 0, 238, 220), fill=(107, 207, 197, 28))
    d.ellipse((w - 92, h - 68, w + 106, h + 112), fill=(240, 166, 201, 24))
    rounded(d, (58, 58, 58 + int(w * .34), 93), 17, (255, 255, 255, 92), (127, 163, 216, 70), 1)
    d.text((72, 62), label.upper(), font=TAG_FONT, fill=(47, 88, 165, 180))
    rounded(d, (58, 124, 58 + int(w * .68), 138), 7, (47, 88, 165, 38))
    rounded(d, (58, 152, 58 + int(w * .46), 165), 7, (107, 207, 197, 42))
    if blur_mix < .12:
        card = card.filter(ImageFilter.GaussianBlur(1.4))
    base.alpha_composite(card, (x + dx - 34, y + dy - 34))


def draw_connections(base: Image.Image, t: float):
    layer = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    points = [(444, 262), (802, 188), (1252, 306), (620, 716), (960, 560), (1420, 754)]
    lines = [(0, 1, "mint"), (1, 2, "blue"), (0, 3, "blue"), (3, 4, "mint"), (4, 5, "blue"), (2, 5, "mint")]
    for index, (a, b, kind) in enumerate(lines):
        p1, p2 = points[a], points[b]
        alpha = int(46 + 36 * (0.5 + 0.5 * loop(t, index * .11)))
        color = (107, 207, 197, alpha) if kind == "mint" else (47, 88, 165, alpha)
        d.line((*p1, *p2), fill=color, width=2)
    for index, (x, y) in enumerate(points):
        amp = loop(t, index * .13)
        px = x + int(math.cos((t + index * .07) * math.tau) * 7)
        py = y + int(amp * 9)
        color = (107, 207, 197, 155) if index % 2 == 0 else (240, 166, 201, 150)
        glow = Image.new("RGBA", (54, 54), (0, 0, 0, 0))
        gd = ImageDraw.Draw(glow)
        gd.ellipse((12, 12, 42, 42), fill=color)
        glow = glow.filter(ImageFilter.GaussianBlur(11))
        layer.alpha_composite(glow, (px - 27, py - 27))
        d.ellipse((px - 6, py - 6, px + 6, py + 6), fill=color)
    base.alpha_composite(layer)


def draw_scan(base: Image.Image, t: float):
    scan = Image.new("RGBA", (580, HEIGHT + 240), (0, 0, 0, 0))
    d = ImageDraw.Draw(scan)
    for i in range(290):
        alpha = int(76 * (1 - abs(i - 145) / 145))
        d.line((i * 2, 0, i * 2 - 300, HEIGHT + 240), fill=(255, 255, 255, alpha), width=2)
    scan = scan.filter(ImageFilter.GaussianBlur(10))
    x = int(-720 + ease(t) * 3020)
    base.alpha_composite(scan, (x, -120))


def frame(i: int) -> Image.Image:
    t = i / FRAME_COUNT
    img = background(t)
    orb = Image.new("RGBA", (560, 560), (0, 0, 0, 0))
    od = ImageDraw.Draw(orb)
    od.ellipse((0, 0, 560, 560), fill=(255, 255, 255, int(70 + 34 * (0.5 + 0.5 * loop(t, .2)))))
    orb = orb.filter(ImageFilter.GaussianBlur(18))
    img.alpha_composite(orb, (680, 260))
    draw_connections(img, t)

    draw_card(img, 250, 220, 330, 158, "links", t, 0.0)
    draw_card(img, 696, 126, 330, 158, "index", t, .12)
    draw_card(img, 1158, 248, 330, 158, "tools", t, .28)
    draw_card(img, 390, 650, 330, 158, "notes", t, .44)
    draw_card(img, 796, 496, 330, 158, "ideas", t, .6)
    draw_card(img, 1244, 690, 330, 158, "search", t, .76)

    draw_scan(img, t)
    vignette = Image.new("RGBA", (WIDTH, HEIGHT), (255, 255, 255, 0))
    vd = ImageDraw.Draw(vignette)
    vd.rectangle((0, 0, WIDTH, 70), fill=(255, 255, 255, 82))
    vd.rectangle((0, HEIGHT - 88, WIDTH, HEIGHT), fill=(255, 255, 255, 92))
    vignette = vignette.filter(ImageFilter.GaussianBlur(60))
    img.alpha_composite(vignette)
    return ImageEnhance.Sharpness(img.convert("RGB")).enhance(1.02)


def main() -> int:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    if FRAME_DIR.exists():
        shutil.rmtree(FRAME_DIR)
    FRAME_DIR.mkdir(parents=True)
    poster = frame(0)
    poster.save(POSTER, quality=88, optimize=True)
    for i in range(FRAME_COUNT):
        frame(i).save(FRAME_DIR / f"frame_{i:04d}.jpg", quality=88, optimize=True)
        if i % 24 == 0:
            print(f"rendered frame {i}/{FRAME_COUNT}")
    print(FRAME_DIR)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
