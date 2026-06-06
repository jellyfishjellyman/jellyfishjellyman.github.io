# Resource Tools Loop

HyperFrames source composition for the Jellyfish blog Resources and Tools pages.

## Intended Output

- `static/videos/resource-tools-loop.mp4`
- `static/videos/resource-tools-loop.webm`
- `static/videos/resource-tools-loop-poster.jpg`

The composition is 1920x1080, 8 seconds, silent, and designed as a soft looping background.

## Visual Idea

This is a gentle personal bookmark universe: translucent cards, small abstract labels, pale connection lines, and a quiet scan passing over the collection. It should sit behind page headings or card groups without drawing too much attention away from the page content.

## Hugo Embed

```html
<video
  class="section-bg-video"
  autoplay
  muted
  loop
  playsinline
  preload="metadata"
  poster="/videos/resource-tools-loop-poster.jpg"
  aria-hidden="true"
>
  <source src="/videos/resource-tools-loop.webm" type="video/webm">
  <source src="/videos/resource-tools-loop.mp4" type="video/mp4">
</video>
```

```css
.resource-page .module-intro,
.tools-page .module-intro {
  position: relative;
  overflow: hidden;
}

.section-bg-video {
  position: absolute;
  inset: 0;
  z-index: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: .28;
  pointer-events: none;
}

.resource-page .module-intro > *:not(.section-bg-video),
.tools-page .module-intro > *:not(.section-bg-video) {
  position: relative;
  z-index: 1;
}

@media (prefers-reduced-motion: reduce) {
  .section-bg-video {
    display: none;
  }
}
```
