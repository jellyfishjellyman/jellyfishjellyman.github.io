(function () {
  const root = document.documentElement;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const pointer = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

  if (!reduceMotion) {
    document.body.classList.add("has-pointer");
    const noise = document.createElement("div");
    noise.className = "dream-noise";
    document.body.appendChild(noise);

    const grid = document.createElement("div");
    grid.className = "vapor-grid";
    document.body.appendChild(grid);

    const trails = Array.from({ length: 7 }, (_, index) => {
      const dot = document.createElement("span");
      dot.className = "cursor-trail";
      dot.style.width = `${12 + index * 5}px`;
      dot.style.height = `${12 + index * 5}px`;
      dot.style.transitionDelay = `${index * 12}ms`;
      document.body.appendChild(dot);
      return { el: dot, x: pointer.x, y: pointer.y };
    });

    const animateTrail = () => {
      let leadX = pointer.x;
      let leadY = pointer.y;
      trails.forEach((trail, index) => {
        trail.x += (leadX - trail.x) * (0.26 - index * 0.018);
        trail.y += (leadY - trail.y) * (0.26 - index * 0.018);
        trail.el.style.transform = `translate3d(${trail.x}px, ${trail.y}px, 0) translate(-50%, -50%) scale(${1 - index * 0.045})`;
        trail.el.style.opacity = String(Math.max(0.08, 0.48 - index * 0.055));
        leadX = trail.x;
        leadY = trail.y;
      });
      window.requestAnimationFrame(animateTrail);
    };
    animateTrail();

    window.addEventListener(
      "pointermove",
      (event) => {
        pointer.x = event.clientX;
        pointer.y = event.clientY;
        root.style.setProperty("--mouse-x", `${event.clientX}px`);
        root.style.setProperty("--mouse-y", `${event.clientY}px`);
        root.style.setProperty("--cursor-hue", `${160 + (event.clientX / Math.max(1, window.innerWidth)) * 120}deg`);
      },
      { passive: true }
    );
  }

  document.querySelectorAll("[data-resource-tabs]").forEach((shell) => {
    const tabs = Array.from(shell.querySelectorAll("[data-resource-tab]"));
    const panels = Array.from(shell.querySelectorAll("[data-resource-panel]"));
    const modal = shell.querySelector("[data-resource-modal]");
    const closeButtons = Array.from(shell.querySelectorAll("[data-resource-close]"));
    let lastActiveTab = tabs.find((tab) => tab.classList.contains("is-active")) || tabs[0];

    const activate = (id) => {
      tabs.forEach((tab) => {
        const active = tab.dataset.resourceTab === id;
        tab.classList.toggle("is-active", active);
        tab.setAttribute("aria-expanded", String(active));
        if (active) lastActiveTab = tab;
      });
      panels.forEach((panel) => panel.classList.toggle("is-active", panel.id === id));
    };

    const openModal = (id) => {
      activate(id);
      if (!modal) return;
      modal.classList.add("is-open");
      modal.setAttribute("aria-hidden", "false");
      document.body.classList.add("has-resource-modal");
      const closeButton = modal.querySelector(".resource-close");
      if (closeButton) closeButton.focus({ preventScroll: true });
    };

    const closeModal = () => {
      if (!modal) return;
      modal.classList.remove("is-open");
      modal.setAttribute("aria-hidden", "true");
      document.body.classList.remove("has-resource-modal");
      if (lastActiveTab) lastActiveTab.focus({ preventScroll: true });
    };

    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        openModal(tab.dataset.resourceTab);
      });
    });

    closeButtons.forEach((button) => button.addEventListener("click", closeModal));
    window.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && modal?.classList.contains("is-open")) closeModal();
    });
  });

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

  const musicPanel = document.createElement("div");
  musicPanel.className = "music-panel";
  musicPanel.setAttribute("aria-label", "背景音乐控制台");

  const musicToggle = document.createElement("button");
  musicToggle.id = "musicToggle";
  musicToggle.type = "button";
  musicToggle.setAttribute("aria-label", "播放或暂停背景音乐");
  musicToggle.title = "播放氛围音乐";
  musicToggle.textContent = "♪";

  const musicCopy = document.createElement("div");
  musicCopy.className = "music-copy";
  musicCopy.innerHTML = '<span class="music-title">Moonlight</span><span class="music-status">点击启动</span>';

  const bars = document.createElement("div");
  bars.className = "music-bars";
  for (let i = 0; i < 12; i += 1) {
    const bar = document.createElement("span");
    bar.style.setProperty("--bar-index", i);
    bars.appendChild(bar);
  }

  musicPanel.append(musicToggle, musicCopy, bars);
  document.body.appendChild(musicPanel);
  const musicStatus = musicCopy.querySelector(".music-status");

  let audioCtx = null;
  let musicTimer = null;
  let lfoTimer = null;
  let masterGain = null;
  let playing = false;
  let step = 0;

  const notesByPath = {
    "/links/": [220.0, 277.18, 329.63, 415.3, 493.88],
    "/tools/": [196.0, 246.94, 293.66, 369.99, 440.0],
    "/games/": [174.61, 220.0, 261.63, 329.63, 392.0],
    "/posts/": [196.0, 246.94, 293.66, 369.99, 493.88],
    default: [174.61, 220.0, 261.63, 329.63, 392.0],
  };

  const getNotes = () => {
    const path = `${location.pathname.replace(/\/$/, "")}/`;
    return notesByPath[path] || notesByPath.default;
  };

  const ensureAudio = async () => {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    await audioCtx.resume();
    if (!masterGain) {
      masterGain = audioCtx.createGain();
      masterGain.gain.value = 0.42;
      masterGain.connect(audioCtx.destination);
    }
  };

  const playTone = (frequency, time, index) => {
    const osc = audioCtx.createOscillator();
    const shimmer = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const filter = audioCtx.createBiquadFilter();
    osc.type = "sine";
    shimmer.type = "sine";
    osc.frequency.setValueAtTime(frequency, time);
    shimmer.frequency.setValueAtTime(frequency * (index % 2 ? 1.5 : 2.0), time);
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(560 + (index % 5) * 34, time);
    filter.Q.setValueAtTime(1.8, time);
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(0.026, time + 0.36);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 3.8);
    osc.connect(filter);
    shimmer.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);
    osc.start(time);
    shimmer.start(time + 0.02);
    osc.stop(time + 4.0);
    shimmer.stop(time + 3.2);
  };

  const playBass = (time, frequency) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(frequency * 0.5, time);
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(0.018, time + 0.5);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 4.8);
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(time);
    osc.stop(time + 5.0);
  };

  const startMusic = async () => {
    await ensureAudio();
    const notes = getNotes();
    playing = true;
    musicPanel.classList.add("is-playing");
    musicStatus.textContent = "月光模式";
    masterGain.gain.setTargetAtTime(0.3, audioCtx.currentTime, 0.35);

    const tick = () => {
      if (!playing) return;
      const now = audioCtx.currentTime;
      const note = notes[step % notes.length];
      playTone(note, now, step);
      if (step % 3 === 0) playTone(note * 1.25, now + 0.18, step + 2);
      if (step % 4 === 0) playBass(now + 0.08, note);
      step += 1;
      musicTimer = window.setTimeout(tick, step % 4 === 0 ? 2600 : 2100);
    };

    tick();
    lfoTimer = window.setInterval(() => {
      if (!masterGain || !playing) return;
      const value = 0.26 + Math.sin(Date.now() / 1300) * 0.045;
      masterGain.gain.setTargetAtTime(value, audioCtx.currentTime, 0.2);
    }, 240);
  };

  const stopMusic = () => {
    playing = false;
    musicPanel.classList.remove("is-playing");
    musicStatus.textContent = "点击启动";
    if (musicTimer) window.clearTimeout(musicTimer);
    if (lfoTimer) window.clearInterval(lfoTimer);
    if (masterGain && audioCtx) masterGain.gain.setTargetAtTime(0.0001, audioCtx.currentTime, 0.15);
  };

  musicToggle.addEventListener("click", () => {
    if (playing) stopMusic();
    else startMusic().catch(stopMusic);
  });

  const selectableItems = document.querySelectorAll(".post-card, .module-card, .game-card, .feature-card, .resource-tag, .link-item");
  selectableItems.forEach((item) => {
    item.addEventListener(
      "pointermove",
      (event) => {
        const rect = item.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        item.style.setProperty("--card-x", `${x}px`);
        item.style.setProperty("--card-y", `${y}px`);
        if (!reduceMotion && !item.classList.contains("link-item")) {
          const tiltX = ((x / rect.width) - 0.5) * 5.5;
          const tiltY = ((0.5 - y / rect.height)) * 4.2;
          item.style.setProperty("--tilt-x", `${tiltX}deg`);
          item.style.setProperty("--tilt-y", `${tiltY}deg`);
        }
      },
      { passive: true }
    );
    item.addEventListener("pointerenter", () => document.body.classList.add("is-card-hovered"));
    item.addEventListener("pointerleave", () => {
      document.body.classList.remove("is-card-hovered");
      item.style.setProperty("--tilt-x", "0deg");
      item.style.setProperty("--tilt-y", "0deg");
    });
  });

  document.querySelectorAll(".post-card").forEach((card) => {
    const summary = card.querySelector(".post-summary");
    if (!summary) return;
    card.addEventListener(
      "wheel",
      (event) => {
        if (!card.matches(":hover")) return;
        const canScroll = summary.scrollHeight > summary.clientHeight;
        if (!canScroll) return;
        const before = summary.scrollTop;
        summary.scrollTop += event.deltaY;
        if (summary.scrollTop !== before) event.preventDefault();
      },
      { passive: false }
    );
  });

  const revealItems = document.querySelectorAll(".reveal-on-scroll, .post-card, .feature-card, .module-card, .game-card, .resource-tag, .link-item");
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
