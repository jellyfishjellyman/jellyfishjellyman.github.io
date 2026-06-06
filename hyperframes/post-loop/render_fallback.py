from __future__ import annotations

import math
import shutil
from pathlib import Path

from PIL import Image, ImageDraw, ImageEnhance, ImageFilter


ROOT = Path(__file__).resolve().parent
REPO = ROOT.parent.parent
WIDTH = 1920
HEIGHT = 1080
DURATION = 6
FPS = 24
FRAME_COUNT = DURATION * FPS
OUT_DIR = REPO / "static" / "videos"
POSTER = OUT_DIR / "post-loop-poster.jpg"
FRAME_DIR = REPO / "_post_loop_frames"


def loop(t: float, phase: float = 0.0) -> float:
    return math.sin((t + phase) * math.tau)


def ease_loop(t: float) -> float:
    return 0.5 - 0.5 * math.cos(t * math.tau)


def rounded(draw: ImageDraw.ImageDraw, box, radius, fill, outline=None, width=1):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def background(t: float) -> Image.Image:
    img = Image.new("RGBA", (WIDTH, HEIGHT), (248, 245, 238, 255))
    d = ImageDraw.Draw(img)
    d.rectangle((0, 0, WIDTH, HEIGHT), fill=(248, 245, 238, 255))
    d.ellipse((-260, -240, 900, 700), fill=(229, 245, 241, 205))
    d.ellipse((1060, 500, 2240, 1320), fill=(240, 166, 201, 36))
    d.ellipse((560, 120, 1480, 900), fill=(223, 234, 255, 60))
    img = img.filter(ImageFilter.GaussianBlur(86))

    grain = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    gd = ImageDraw.Draw(grain)
    sx = int(loop(t, .12) * 8)
    sy = int(loop(t, .34) * 6)
    for x in range(-86 + sx, WIDTH + 86, 86):
        gd.line((x, 0, x, HEIGHT), fill=(49, 90, 164, 10), width=1)
    for y in range(-86 + sy, HEIGHT + 86, 86):
        gd.line((0, y, WIDTH, y), fill=(49, 90, 164, 12), width=1)
    img.alpha_composite(grain)
    return img


def draw_sheet(base: Image.Image, t: float):
    x, y, w, h = 470, 222, 1080, 650
    dx = int(loop(t, .18) * 4)
    dy = int(loop(t, .36) * 8)
    panel = Image.new("RGBA", (w + 130, h + 130), (0, 0, 0, 0))
    shadow = Image.new("RGBA", panel.size, (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    rounded(sd, (48, 48, 48 + w, 48 + h), 28, (61, 95, 148, 26))
    shadow = shadow.filter(ImageFilter.GaussianBlur(38))
    panel.alpha_composite(shadow)
    d = ImageDraw.Draw(panel)
    rounded(d, (48, 48, 48 + w, 48 + h), 28, (255, 253, 248, 134), (126, 162, 214, 54), 2)
    d.ellipse((40, 16, 460, 330), fill=(229, 245, 241, 34))
    d.ellipse((760, 444, 1188, 780), fill=(240, 166, 201, 18))
    d.line((192, 96, 192, h + 8), fill=(240, 166, 201, 48), width=2)

    lines = [
        (260, 126, 610, (49, 90, 164, 30), 0.0),
        (260, 176, 740, (107, 207, 197, 38), .08),
        (260, 226, 520, (49, 90, 164, 28), .16),
        (260, 314, 680, (49, 90, 164, 30), .24),
        (260, 364, 780, (107, 207, 197, 36), .32),
        (260, 414, 480, (49, 90, 164, 28), .4),
        (260, 506, 630, (107, 207, 197, 34), .48),
        (260, 556, 720, (49, 90, 164, 28), .56),
        (260, 606, 410, (49, 90, 164, 26), .64),
    ]
    for lx, ly, length, color, phase in lines:
        alpha = int(color[3] + 26 * (0.5 + 0.5 * loop(t, phase)))
        shift = int(loop(t, phase + .22) * 12)
        rounded(d, (lx + shift, ly, lx + length + shift, ly + 12), 7, (color[0], color[1], color[2], alpha))

    base.alpha_composite(panel, (x + dx - 48, y + dy - 48))


def draw_note(base: Image.Image, x: int, y: int, w: int, h: int, t: float, phase: float):
    dx = int(loop(t, phase) * 7)
    dy = int(loop(t, phase + .22) * 9)
    note = Image.new("RGBA", (w + 90, h + 90), (0, 0, 0, 0))
    shadow = Image.new("RGBA", note.size, (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    rounded(sd, (34, 34, 34 + w, 34 + h), 22, (61, 95, 148, 18))
    shadow = shadow.filter(ImageFilter.GaussianBlur(25))
    note.alpha_composite(shadow)
    d = ImageDraw.Draw(note)
    rounded(d, (34, 34, 34 + w, 34 + h), 22, (255, 255, 255, 82), (126, 162, 214, 46), 1)
    rounded(d, (66, 88, 66 + int(w * .66), 100), 7, (49, 90, 164, 20))
    rounded(d, (66, 126, 66 + int(w * .42), 138), 7, (107, 207, 197, 28))
    base.alpha_composite(note, (x + dx - 34, y + dy - 34))


def draw_particles(base: Image.Image, t: float):
    layer = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    particles = [
        (426, 260, (107, 207, 197, 126), 0.0),
        (1340, 300, (240, 166, 201, 112), .17),
        (560, 760, (107, 207, 197, 116), .34),
        (1180, 704, (240, 166, 201, 104), .51),
        (1508, 590, (107, 207, 197, 112), .68),
    ]
    for x, y, color, phase in particles:
        px = x + int(math.cos((t + phase) * math.tau) * 11)
        py = y + int(loop(t, phase + .2) * 10)
        glow = Image.new("RGBA", (54, 54), (0, 0, 0, 0))
        gd = ImageDraw.Draw(glow)
        gd.ellipse((14, 14, 40, 40), fill=color)
        glow = glow.filter(ImageFilter.GaussianBlur(11))
        layer.alpha_composite(glow, (px - 27, py - 27))
        d.ellipse((px - 5, py - 5, px + 5, py + 5), fill=color)
    base.alpha_composite(layer)


def draw_light_sweep(base: Image.Image, t: float):
    scan = Image.new("RGBA", (760, HEIGHT + 260), (0, 0, 0, 0))
    d = ImageDraw.Draw(scan)
    for i in range(380):
        alpha = int(58 * (1 - abs(i - 190) / 190))
        d.line((i * 2, 0, i * 2 - 410, HEIGHT + 260), fill=(255, 255, 255, alpha), width=2)
    scan = scan.filter(ImageFilter.GaussianBlur(18))
    x = int(-910 + ease_loop(t) * 3220)
    base.alpha_composite(scan, (x, -130))


def frame(i: int) -> Image.Image:
    t = i / FRAME_COUNT
    img = background(t)
    draw_note(img, 144, 286, 280, 184, t, .08)
    draw_note(img, 1480, 500, 300, 202, t, .46)
    draw_sheet(img, t)
    draw_particles(img, t)
    draw_light_sweep(img, t)

    vignette = Image.new("RGBA", (WIDTH, HEIGHT), (255, 255, 255, 0))
    vd = ImageDraw.Draw(vignette)
    vd.rectangle((0, 0, WIDTH, 80), fill=(255, 255, 255, 82))
    vd.rectangle((0, HEIGHT - 90, WIDTH, HEIGHT), fill=(255, 255, 255, 94))
    vignette = vignette.filter(ImageFilter.GaussianBlur(66))
    img.alpha_composite(vignette)
    return ImageEnhance.Sharpness(img.convert("RGB")).enhance(1.01)


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
