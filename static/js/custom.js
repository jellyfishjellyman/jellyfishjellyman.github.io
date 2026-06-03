(function () {
  const root = document.documentElement;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!reduceMotion) {
    window.addEventListener(
      "pointermove",
      (event) => {
        root.style.setProperty("--mouse-x", `${event.clientX}px`);
        root.style.setProperty("--mouse-y", `${event.clientY}px`);
      },
      { passive: true }
    );
  }

  if (location.pathname === "/" || location.pathname === "/index.html") {
    document.body.classList.add("home");
  }

  const backToTop = document.createElement("button");
  backToTop.id = "backToTop";
  backToTop.type = "button";
  backToTop.setAttribute("aria-label", "回到顶部");
  backToTop.textContent = "↑";
  document.body.appendChild(backToTop);

  const toggleBackToTop = () => {
    backToTop.classList.toggle("show", window.scrollY > 420);
  };

  window.addEventListener("scroll", toggleBackToTop, { passive: true });
  toggleBackToTop();

  backToTop.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  });

  const musicToggle = document.createElement("button");
  musicToggle.id = "musicToggle";
  musicToggle.type = "button";
  musicToggle.setAttribute("aria-label", "播放或暂停背景音乐");
  musicToggle.title = "轻音乐";
  musicToggle.textContent = "♪";
  document.body.appendChild(musicToggle);

  let audioCtx = null;
  let musicTimer = null;
  let playing = false;

  const notesByPath = {
    "/links/": [261.63, 329.63, 392.0, 523.25],
    "/tools/": [293.66, 369.99, 440.0, 587.33],
    "/games/": [329.63, 392.0, 493.88, 659.25],
    "/posts/": [246.94, 329.63, 415.3, 493.88],
    default: [220.0, 277.18, 329.63, 440.0],
  };

  const getNotes = () => {
    const path = `${location.pathname.replace(/\/$/, "")}/`;
    return notesByPath[path] || notesByPath.default;
  };

  const playTone = (frequency, time) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(frequency, time);
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(0.035, time + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 1.4);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(time);
    osc.stop(time + 1.5);
  };

  const startMusic = async () => {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    await audioCtx.resume();
    const notes = getNotes();
    let index = 0;
    playing = true;
    musicToggle.classList.add("is-playing");

    const tick = () => {
      if (!playing) return;
      playTone(notes[index % notes.length], audioCtx.currentTime);
      index += 1;
      musicTimer = window.setTimeout(tick, 1700);
    };

    tick();
  };

  const stopMusic = () => {
    playing = false;
    musicToggle.classList.remove("is-playing");
    if (musicTimer) window.clearTimeout(musicTimer);
  };

  musicToggle.addEventListener("click", () => {
    if (playing) stopMusic();
    else startMusic().catch(stopMusic);
  });

  const revealItems = document.querySelectorAll(".reveal-on-scroll, .post-card, .feature-card");
  if ("IntersectionObserver" in window && !reduceMotion) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    revealItems.forEach((item) => {
      item.classList.add("reveal-on-scroll");
      observer.observe(item);
    });
  } else {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  }

  const hero = document.getElementById("hero");
  const content = document.getElementById("homeContent");
  if (!hero || !content) return;

  let cooling = false;

  const inHero = () => {
    const rect = hero.getBoundingClientRect();
    return rect.top <= 10 && rect.bottom > window.innerHeight * 0.58;
  };

  const go = () => {
    if (cooling) return;
    cooling = true;
    content.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    window.setTimeout(() => (cooling = false), 720);
  };

  window.addEventListener(
    "wheel",
    (event) => {
      if (cooling || !inHero() || event.deltaY <= 0) return;
      event.preventDefault();
      go();
    },
    { passive: false }
  );

  let touchStartY = null;
  window.addEventListener(
    "touchstart",
    (event) => {
      touchStartY = event.touches?.[0]?.clientY ?? null;
    },
    { passive: true }
  );

  window.addEventListener(
    "touchmove",
    (event) => {
      if (cooling || !inHero() || touchStartY == null) return;
      const y = event.touches?.[0]?.clientY ?? touchStartY;
      if (touchStartY - y > 10) go();
    },
    { passive: true }
  );

  window.addEventListener("keydown", (event) => {
    if (cooling || !inHero()) return;
    if (event.key === "ArrowDown" || event.key === "PageDown" || event.key === " ") {
      event.preventDefault();
      go();
    }
  });

  const hint = document.querySelector(".hero-hint");
  if (hint) hint.addEventListener("click", go);
})();
