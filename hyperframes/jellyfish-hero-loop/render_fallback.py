from __future__ import annotations

import math
import shutil
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageFont


ROOT = Path(__file__).resolve().parent
REPO = ROOT.parent.parent
WIDTH = 1920
HEIGHT = 1080
DURATION = 10
FPS = 24
FRAME_COUNT = DURATION * FPS

HERO = ROOT / "assets" / "hero-optimized.jpg"
OUT_DIR = REPO / "static" / "videos"
POSTER = OUT_DIR / "jellyfish-hero-loop-poster.jpg"
FRAME_DIR = Path.cwd() / "_jellyfish_frames"


def ease(t: float) -> float:
    return 0.5 - 0.5 * math.cos(t * math.tau)


def loop(t: float, phase: float = 0) -> float:
    return math.sin((t + phase) * math.tau)


def cover_image(path: Path) -> Image.Image:
    src = Image.open(path).convert("RGB")
    scale = max(WIDTH / src.width, HEIGHT / src.height)
    size = (math.ceil(src.width * scale), math.ceil(src.height * scale))
    src = src.resize(size, Image.Resampling.LANCZOS)
    left = (src.width - WIDTH) // 2
    top = (src.height - HEIGHT) // 2
    return src.crop((left, top, left + WIDTH, top + HEIGHT))


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    candidates = [
        "C:/Windows/Fonts/segoeuib.ttf" if bold else "C:/Windows/Fonts/segoeui.ttf",
        "C:/Windows/Fonts/arialbd.ttf" if bold else "C:/Windows/Fonts/arial.ttf",
    ]
    for candidate in candidates:
        try:
            return ImageFont.truetype(candidate, size=size)
        except OSError:
            continue
    return ImageFont.load_default()


FONT_KICKER = font(25, True)


def rounded_rect(draw: ImageDraw.ImageDraw, box: tuple[int, int, int, int], radius: int, fill, outline=None, width=1):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def glass_card(base: Image.Image, x: int, y: int, w: int, h: int, label: str, t: float, phase: float) -> None:
    wobble = loop(t, phase)
    x += round(wobble * 7)
    y += round(loop(t, phase + 0.17) * 9)
    card = Image.new("RGBA", (w + 80, h + 80), (0, 0, 0, 0))
    d = ImageDraw.Draw(card)
    shadow = Image.new("RGBA", card.size, (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    rounded_rect(sd, (30, 30, 30 + w, 30 + h), 22, (47, 88, 165, 34))
    shadow = shadow.filter(ImageFilter.GaussianBlur(28))
    card.alpha_composite(shadow)
    rounded_rect(d, (30, 30, 30 + w, 30 + h), 22, (255, 255, 255, 136), (127, 163, 216, 96), 2)
    rounded_rect(d, (52, 52, 52 + int(w * 0.55), 66), 8, (83, 172, 190, 56))
    d.text((52, 84), label.upper(), font=FONT_KICKER, fill=(47, 88, 165, 170))
    rounded_rect(d, (52, h - 4, 52 + int(w * 0.68), h + 12), 8, (47, 88, 165, 38))
    rounded_rect(d, (52, h + 24, 52 + int(w * 0.42), h + 36), 7, (112, 211, 203, 42))
    base.alpha_composite(card, (x - 30, y - 30))


def draw_grid(layer: Image.Image, t: float) -> None:
    d = ImageDraw.Draw(layer)
    shift_x = int(loop(t, 0.1) * 16)
    shift_y = int(loop(t, 0.4) * 10)
    color = (47, 88, 165, 26)
    for x in range(-96 + shift_x, WIDTH + 96, 96):
        d.line((x, 0, x, HEIGHT), fill=color, width=1)
    for y in range(-96 + shift_y, HEIGHT + 96, 96):
        d.line((0, y, WIDTH, y), fill=color, width=1)


def draw_threads(layer: Image.Image, t: float) -> None:
    d = ImageDraw.Draw(layer)
    segments = [
        ((330, 292), (560, 342), 0.0),
        ((1340, 336), (1580, 272), 0.22),
        ((850, 790), (1120, 812), 0.42),
    ]
    for a, b, phase in segments:
        alpha = int(44 + 32 * (0.5 + 0.5 * loop(t, phase)))
        d.line((*a, *b), fill=(47, 88, 165, alpha), width=2)


def draw_particles(layer: Image.Image, t: float) -> None:
    d = ImageDraw.Draw(layer)
    particles = [
        (294, 230, "rose", 0.0),
        (430, 790, "mint", 0.18),
        (1220, 222, "rose", 0.36),
        (1530, 736, "mint", 0.54),
        (980, 820, "rose", 0.72),
        (828, 180, "mint", 0.88),
    ]
    for x, y, kind, phase in particles:
        amp = loop(t, phase)
        px = x + int(math.cos((t + phase) * math.tau) * 9)
        py = y + int(amp * 12)
        color = (242, 169, 206, 150) if kind == "rose" else (112, 211, 203, 140)
        glow = Image.new("RGBA", (52, 52), (0, 0, 0, 0))
        gd = ImageDraw.Draw(glow)
        gd.ellipse((13, 13, 39, 39), fill=color)
        glow = glow.filter(ImageFilter.GaussianBlur(10))
        layer.alpha_composite(glow, (px - 26, py - 26))
        d.ellipse((px - 5, py - 5, px + 5, py + 5), fill=color)


def draw_light_scan(layer: Image.Image, t: float) -> None:
    scan = Image.new("RGBA", (520, HEIGHT + 220), (0, 0, 0, 0))
    sd = ImageDraw.Draw(scan)
    for i in range(260):
        alpha = int(70 * (1 - abs(i - 130) / 130))
        sd.line((i * 2, 0, i * 2 - 260, HEIGHT + 220), fill=(255, 255, 255, alpha), width=2)
    scan = scan.filter(ImageFilter.GaussianBlur(9))
    x = int(-650 + ease(t) * 2900)
    layer.alpha_composite(scan, (x, -110))


def make_frame(i: int) -> Image.Image:
    t = i / FRAME_COUNT
    base = cover_image(HERO)
    base = ImageEnhance.Color(base).enhance(0.78)
    base = ImageEnhance.Brightness(base).enhance(1.22)
    base = base.filter(ImageFilter.GaussianBlur(2.0))
    base = base.convert("RGBA")

    wash = Image.new("RGBA", (WIDTH, HEIGHT), (248, 245, 238, 92))
    d = ImageDraw.Draw(wash)
    d.rectangle((0, 0, 460, HEIGHT), fill=(248, 245, 238, 178))
    d.rectangle((1460, 0, WIDTH, HEIGHT), fill=(248, 245, 238, 172))
    d.ellipse((-120, -160, 820, 620), fill=(234, 247, 244, 150))
    d.ellipse((1180, 500, 2200, 1360), fill=(242, 169, 206, 72))
    wash = wash.filter(ImageFilter.GaussianBlur(70))
    base.alpha_composite(wash)

    grid = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    draw_grid(grid, t)
    base.alpha_composite(grid)

    lines = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    draw_threads(lines, t)
    draw_particles(lines, t)
    base.alpha_composite(lines)

    glass_card(base, 124, 150, 330, 124, "Search", t, 0.0)
    glass_card(base, 132, 382, 238, 100, "Weather", t, 0.2)
    glass_card(base, 154, 622, 286, 118, "Notes", t, 0.42)
    glass_card(base, 1516, 176, 226, 96, "Quote", t, 0.12)
    glass_card(base, 1408, 442, 330, 118, "Guestbook", t, 0.36)
    glass_card(base, 1460, 710, 286, 118, "Explore", t, 0.62)

    reserve = Image.new("RGBA", (980, 560), (0, 0, 0, 0))
    rd = ImageDraw.Draw(reserve)
    opacity = int(42 + 18 * (0.5 + 0.5 * loop(t, 0.1)))
    rounded_rect(rd, (0, 0, 980, 560), 36, (255, 255, 255, opacity), (255, 255, 255, 88), 2)
    reserve = reserve.filter(ImageFilter.GaussianBlur(1.4))
    base.alpha_composite(reserve, (460, 220))

    scan = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    draw_light_scan(scan, t)
    base.alpha_composite(scan)

    vignette = Image.new("RGBA", (WIDTH, HEIGHT), (255, 255, 255, 0))
    vd = ImageDraw.Draw(vignette)
    vd.rectangle((0, 0, WIDTH, 70), fill=(255, 255, 255, 88))
    vd.rectangle((0, HEIGHT - 90, WIDTH, HEIGHT), fill=(255, 255, 255, 96))
    vignette = vignette.filter(ImageFilter.GaussianBlur(65))
    base.alpha_composite(vignette)

    return base.convert("RGB")


def main() -> int:
    if not HERO.exists():
        print(f"Missing {HERO}", file=sys.stderr)
        return 1
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    if FRAME_DIR.exists():
        shutil.rmtree(FRAME_DIR)
    FRAME_DIR.mkdir(parents=True)

    poster = make_frame(0)
    poster.save(POSTER, quality=88, optimize=True)

    for i in range(FRAME_COUNT):
        frame = make_frame(i)
        frame.save(FRAME_DIR / f"frame_{i:04d}.jpg", quality=88, optimize=True)
        if i % 24 == 0:
            print(f"rendered frame {i}/{FRAME_COUNT}")
    print(FRAME_DIR)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
