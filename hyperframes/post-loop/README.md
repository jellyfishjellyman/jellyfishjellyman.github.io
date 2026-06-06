# Post Loop

HyperFrames source composition for Jellyfish blog post pages and article card hover backgrounds.

## Intended Output

- `static/videos/post-loop.mp4`
- `static/videos/post-loop.webm`
- `static/videos/post-loop-poster.jpg`

The composition is 1920x1080, 6 seconds, silent, and designed as a subtle paper-and-reading-light background.

## Visual Idea

Warm paper fills the frame. A few translucent page panels sit softly in depth, abstract writing lines fade in and drift, a broad reading-light sweep passes across the surface, and tiny mint/rose particles float slowly. The result should support article titles instead of becoming the subject.

## Hugo Embed

```html
<video
  class="post-bg-video"
  autoplay
  muted
  loop
  playsinline
  preload="metadata"
  poster="/videos/post-loop-poster.jpg"
  aria-hidden="true"
>
  <source src="/videos/post-loop.webm" type="video/webm">
  <source src="/videos/post-loop.mp4" type="video/mp4">
</video>
```

```css
.post-page .post-hero,
.post-card.has-video-bg {
  position: relative;
  overflow: hidden;
}

.post-bg-video {
  position: absolute;
  inset: 0;
  z-index: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: .18;
  pointer-events: none;
}

.post-page .post-hero > *:not(.post-bg-video),
.post-card.has-video-bg > *:not(.post-bg-video) {
  position: relative;
  z-index: 1;
}

@media (prefers-reduced-motion: reduce) {
  .post-bg-video {
    display: none;
  }
}
```
