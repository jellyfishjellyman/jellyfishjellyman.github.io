# Jellyfish Hero Loop

HyperFrames source composition for the Jellyfish blog homepage hero background.

## Intended Output

- `static/videos/jellyfish-hero-loop.mp4`
- `static/videos/jellyfish-hero-loop.webm`
- `static/videos/jellyfish-hero-loop-poster.jpg`

The composition is 1920x1080, 10 seconds, silent, and designed to loop gently.

## Render Commands

Run these from `hyperframes/jellyfish-hero-loop` after the HyperFrames CLI and FFmpeg are available:

```powershell
npx hyperframes lint
npx hyperframes inspect --samples 15
npx hyperframes render --quality high --fps 30 --output ..\..\static\videos\jellyfish-hero-loop.mp4
npx hyperframes render --quality high --fps 30 --format webm --output ..\..\static\videos\jellyfish-hero-loop.webm
```

The current checked-in video files were rendered with the local fallback renderer because npm/npx permission review timed out while installing the HyperFrames CLI in this Codex session. The fallback keeps the same 10-second visual direction and writes real video files through FFmpeg:

```powershell
python render_fallback.py
tools\ffmpeg\ffmpeg-8.1.1-essentials_build\bin\ffmpeg.exe -y -framerate 24 -i ..\..\_jellyfish_frames\frame_%04d.jpg -c:v libx264 -preset slow -crf 24 -pix_fmt yuv420p -movflags +faststart ..\..\static\videos\jellyfish-hero-loop.mp4
tools\ffmpeg\ffmpeg-8.1.1-essentials_build\bin\ffmpeg.exe -y -framerate 24 -i ..\..\_jellyfish_frames\frame_%04d.jpg -c:v libvpx-vp9 -deadline good -cpu-used 3 -crf 34 -b:v 0 -pix_fmt yuv420p ..\..\static\videos\jellyfish-hero-loop.webm
```

Generated output verified on 2026-06-06:

- MP4: 1920x1080, 10.0s, H.264, no audio, about 1.6 MB.
- WebM: 1920x1080, 10.0s, VP9, no audio, about 0.9 MB.
- Poster: 1920x1080 JPEG, about 213 KB.

## Hugo Embed

```html
<video
  class="hero-bg-video"
  autoplay
  muted
  loop
  playsinline
  preload="metadata"
  poster="/videos/jellyfish-hero-loop-poster.jpg"
  aria-hidden="true"
>
  <source src="/videos/jellyfish-hero-loop.webm" type="video/webm">
  <source src="/videos/jellyfish-hero-loop.mp4" type="video/mp4">
</video>
```

```css
.home-hero-window {
  position: relative;
  overflow: hidden;
}

.hero-bg-video {
  position: absolute;
  inset: 0;
  z-index: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: .42;
  pointer-events: none;
}

.home-hero-window > *:not(.hero-bg-video) {
  position: relative;
  z-index: 1;
}

@media (prefers-reduced-motion: reduce) {
  .hero-bg-video {
    display: none;
  }
}
```

## Notes

- The video is decorative and should remain muted.
- Use the poster as a fallback for reduced motion or slow networks.
- Keep the central area visually quiet so the homepage title remains readable.
