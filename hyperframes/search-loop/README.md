# Search Loop

HyperFrames source composition for the Jellyfish blog search page.

## Intended Output

- `static/videos/search-loop.mp4`
- `static/videos/search-loop.webm`
- `static/videos/search-loop-poster.jpg`

The composition is 1920x1080, 7 seconds, silent, and designed as a quiet background for the search page header or search panel.

## Visual Idea

This loop suggests clues being found across posts, external resources, tools, and game entries. A glass search input anchors the scene, small keyword points connect to abstract cards, and the motion resolves into a soft search result list without drawing attention away from the real page UI.

## Hugo Embed

```html
<video
  class="search-bg-video"
  autoplay
  muted
  loop
  playsinline
  preload="metadata"
  poster="/videos/search-loop-poster.jpg"
  aria-hidden="true"
>
  <source src="/videos/search-loop.webm" type="video/webm">
  <source src="/videos/search-loop.mp4" type="video/mp4">
</video>
```

```css
.search-page .search-hero,
.search-page .search-panel {
  position: relative;
  overflow: hidden;
}

.search-bg-video {
  position: absolute;
  inset: 0;
  z-index: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: .24;
  pointer-events: none;
}

.search-page .search-hero > *:not(.search-bg-video),
.search-page .search-panel > *:not(.search-bg-video) {
  position: relative;
  z-index: 1;
}

@media (prefers-reduced-motion: reduce) {
  .search-bg-video {
    display: none;
  }
}
```
