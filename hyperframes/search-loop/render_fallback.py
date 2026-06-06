from __future__ import annotations

import math
import shutil
from pathlib import Path

from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageFont


ROOT = Path(__file__).resolve().parent
REPO = ROOT.parent.parent
WIDTH = 1920
HEIGHT = 1080
DURATION = 7
FPS = 24
FRAME_COUNT = DURATION * FPS
OUT_DIR = REPO / "static" / "videos"
POSTER = OUT_DIR / "search-loop-poster.jpg"
FRAME_DIR = REPO / "_search_loop_frames"


def loop(t: float, phase: float = 0.0) -> float:
    return math.sin((t + phase) * math.tau)


def ease_loop(t: float) -> float:
    return 0.5 - 0.5 * math.cos(t * math.tau)


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    paths = [
        "C:/Windows/Fonts/msyhbd.ttc" if bold else "C:/Windows/Fonts/msyh.ttc",
        "C:/Windows/Fonts/segoeuib.ttf" if bold else "C:/Windows/Fonts/segoeui.ttf",
        "C:/Windows/Fonts/arialbd.ttf" if bold else "C:/Windows/Fonts/arial.ttf",
    ]
    for path in paths:
        try:
            return ImageFont.truetype(path, size=size)
        except OSError:
            continue
    return ImageFont.load_default()


TAG_FONT = font(34, True)


def rounded(draw: ImageDraw.ImageDraw, box, radius, fill, outline=None, width=1):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def background(t: float) -> Image.Image:
    img = Image.new("RGBA", (WIDTH, HEIGHT), (248, 245, 238, 255))
    d = ImageDraw.Draw(img)
    d.rectangle((0, 0, WIDTH, HEIGHT), fill=(248, 245, 238, 255))
    d.ellipse((-260, -250, 840, 670), fill=(237, 249, 246, 220))
    d.ellipse((1130, 470, 2240, 1320), fill=(240, 166, 201, 54))
    d.ellipse((610, 90, 1480, 850), fill=(226, 236, 255, 86))
    img = img.filter(ImageFilter.GaussianBlur(82))

    grid = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    gd = ImageDraw.Draw(grid)
    sx = int(loop(t, .1) * 12)
    sy = int(loop(t, .32) * 8)
    for x in range(-110 + sx, WIDTH + 110, 110):
        gd.line((x, 0, x, HEIGHT), fill=(49, 90, 164, 22), width=1)
    for y in range(-110 + sy, HEIGHT + 110, 110):
        gd.line((0, y, WIDTH, y), fill=(49, 90, 164, 20), width=1)
    img.alpha_composite(grid)
    return img


def draw_search_input(base: Image.Image, t: float):
    x, y, w, h = 440, 184, 1080, 104
    dx = int(loop(t, .08) * 3)
    dy = int(loop(t, .24) * 4)
    panel = Image.new("RGBA", (w + 120, h + 120), (0, 0, 0, 0))
    shadow = Image.new("RGBA", panel.size, (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    rounded(sd, (48, 48, 48 + w, 48 + h), 34, (61, 95, 148, 34))
    shadow = shadow.filter(ImageFilter.GaussianBlur(34))
    panel.alpha_composite(shadow)
    d = ImageDraw.Draw(panel)
    rounded(d, (48, 48, 48 + w, 48 + h), 34, (255, 255, 255, 158), (126, 162, 214, 112), 2)
    d.ellipse((86, 82, 124, 120), outline=(49, 90, 164, 88), width=5)
    d.line((118, 116, 142, 140), fill=(49, 90, 164, 88), width=5)
    rounded(d, (174, 91, 174 + 610, 110), 10, (49, 90, 164, 34))
    rounded(d, (174, 91, 174 + int(610 * (.38 + .08 * loop(t, .18))), 110), 10, (107, 207, 197, 42))
    cursor_alpha = int(74 + 84 * (0.5 + 0.5 * loop(t * 5, .2)))
    rounded(d, (760, 80, 764, 124), 2, (240, 166, 201, cursor_alpha))
    panel = panel.filter(ImageFilter.GaussianBlur(0.1))
    base.alpha_composite(panel, (x + dx - 48, y + dy - 48))


def draw_card(base: Image.Image, x: int, y: int, w: int, h: int, label: str, t: float, phase: float):
    dx = int(loop(t, phase) * 8)
    dy = int(loop(t, phase + .2) * 10)
    opacity = int(126 + 34 * (0.5 + 0.5 * loop(t, phase + .1)))
    card = Image.new("RGBA", (w + 96, h + 96), (0, 0, 0, 0))
    shadow = Image.new("RGBA", card.size, (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    rounded(sd, (36, 36, 36 + w, 36 + h), 24, (61, 95, 148, 30))
    shadow = shadow.filter(ImageFilter.GaussianBlur(28))
    card.alpha_composite(shadow)
    d = ImageDraw.Draw(card)
    rounded(d, (36, 36, 36 + w, 36 + h), 24, (255, 255, 255, opacity), (126, 162, 214, 94), 2)
    d.ellipse((14, 0, 238, 220), fill=(107, 207, 197, 27))
    d.ellipse((w - 78, h - 72, w + 118, h + 110), fill=(240, 166, 201, 22))
    rounded(d, (64, 64, 154, 108), 22, (255, 255, 255, 100), (126, 162, 214, 70), 1)
    d.text((88, 66), label, font=TAG_FONT, fill=(49, 90, 164, 184), anchor="ma")
    rounded(d, (64, 136, 64 + int(w * .66), 151), 8, (49, 90, 164, 34))
    rounded(d, (64, 166, 64 + int(w * .46), 180), 8, (107, 207, 197, 40))
    base.alpha_composite(card, (x + dx - 36, y + dy - 36))


def draw_result_list(base: Image.Image, t: float):
    x, y, w, h = 720, 548, 520, 256
    dx = int(loop(t, .42) * 5)
    dy = int(loop(t, .58) * 7)
    panel = Image.new("RGBA", (w + 108, h + 108), (0, 0, 0, 0))
    shadow = Image.new("RGBA", panel.size, (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    rounded(sd, (40, 40, 40 + w, 40 + h), 26, (61, 95, 148, 30))
    shadow = shadow.filter(ImageFilter.GaussianBlur(30))
    panel.alpha_composite(shadow)
    d = ImageDraw.Draw(panel)
    rounded(d, (40, 40, 40 + w, 40 + h), 26, (255, 255, 255, 144), (126, 162, 214, 84), 2)
    widths = [410, 320, 280, 358, 390]
    colors = [(49, 90, 164, 32), (107, 207, 197, 42), (49, 90, 164, 30), (107, 207, 197, 38), (49, 90, 164, 30)]
    for index, width in enumerate(widths):
        yy = 72 + index * 42
        alpha_boost = int(10 * (0.5 + 0.5 * loop(t, index * .1)))
        r, g, b, a = colors[index]
        rounded(d, (76, yy, 76 + width, yy + 17), 9, (r, g, b, a + alpha_boost))
    base.alpha_composite(panel, (x + dx - 40, y + dy - 40))


def draw_connections_and_clues(base: Image.Image, t: float):
    layer = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    points = [(704, 314), (820, 312), (936, 312), (1052, 314), (960, 630)]
    targets = [(382, 514), (390, 746), (1402, 512), (1420, 744), (960, 630)]
    for index, (p1, p2) in enumerate(zip(points, targets)):
        alpha = int(38 + 36 * (0.5 + 0.5 * loop(t, index * .13)))
        color = (107, 207, 197, alpha) if index % 2 == 0 else (49, 90, 164, alpha)
        d.line((*p1, *p2), fill=color, width=2)
    d.line((704, 314, 960, 630), fill=(107, 207, 197, 58), width=2)
    d.line((1052, 314, 960, 630), fill=(49, 90, 164, 48), width=2)

    paths = [
        ((704, 314), (382, 514), (107, 207, 197, 168)),
        ((820, 312), (390, 746), (240, 166, 201, 156)),
        ((936, 312), (1402, 512), (107, 207, 197, 164)),
        ((1052, 314), (1420, 744), (240, 166, 201, 154)),
        ((875, 360), (960, 630), (107, 207, 197, 170)),
    ]
    travel = ease_loop(t)
    for index, (start, end, color) in enumerate(paths):
        local = (travel + index * .11) % 1.0
        local = 0.5 - 0.5 * math.cos(local * math.tau)
        x = int(start[0] + (end[0] - start[0]) * local)
        y = int(start[1] + (end[1] - start[1]) * local + loop(t, index * .17) * 9)
        glow = Image.new("RGBA", (58, 58), (0, 0, 0, 0))
        gd = ImageDraw.Draw(glow)
        gd.ellipse((12, 12, 46, 46), fill=color)
        glow = glow.filter(ImageFilter.GaussianBlur(12))
        layer.alpha_composite(glow, (x - 29, y - 29))
        d.ellipse((x - 6, y - 6, x + 6, y + 6), fill=color)
    base.alpha_composite(layer)


def draw_scan(base: Image.Image, t: float):
    scan = Image.new("RGBA", (560, HEIGHT + 220), (0, 0, 0, 0))
    d = ImageDraw.Draw(scan)
    for i in range(280):
        alpha = int(60 * (1 - abs(i - 140) / 140))
        d.line((i * 2, 0, i * 2 - 290, HEIGHT + 220), fill=(255, 255, 255, alpha), width=2)
    scan = scan.filter(ImageFilter.GaussianBlur(11))
    x = int(-710 + ease_loop(t) * 3000)
    base.alpha_composite(scan, (x, -110))


def frame(i: int) -> Image.Image:
    t = i / FRAME_COUNT
    img = background(t)
    draw_connections_and_clues(img, t)
    draw_search_input(img, t)
    draw_card(img, 250, 442, 340, 172, "文章", t, 0.0)
    draw_card(img, 260, 704, 340, 172, "资源", t, .18)
    draw_card(img, 1330, 442, 340, 172, "工具", t, .36)
    draw_card(img, 1328, 704, 340, 172, "游戏", t, .54)
    draw_result_list(img, t)
    draw_scan(img, t)

    vignette = Image.new("RGBA", (WIDTH, HEIGHT), (255, 255, 255, 0))
    vd = ImageDraw.Draw(vignette)
    vd.rectangle((0, 0, WIDTH, 78), fill=(255, 255, 255, 84))
    vd.rectangle((0, HEIGHT - 88, WIDTH, HEIGHT), fill=(255, 255, 255, 92))
    vignette = vignette.filter(ImageFilter.GaussianBlur(64))
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
