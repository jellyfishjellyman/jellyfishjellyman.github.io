(function () {
  const root = document.documentElement;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const coarsePointer = window.matchMedia("(pointer: coarse)").matches;

  const themeToggle = document.querySelector("[data-theme-toggle]");
  const themeIcon = document.querySelector("[data-theme-icon]");
  const storedTheme = window.localStorage.getItem("site-theme");
  const setTheme = (theme) => {
    root.dataset.theme = theme;
    themeToggle?.setAttribute("aria-pressed", String(theme === "night"));
    if (themeIcon) themeIcon.textContent = theme === "night" ? "☀" : "☾";
  };

  setTheme(storedTheme || "day");
  themeToggle?.addEventListener("click", () => {
    const nextTheme = root.dataset.theme === "night" ? "day" : "night";
    const rect = themeToggle.getBoundingClientRect();
    root.style.setProperty("--switch-x", `${rect.left + rect.width / 2}px`);
    window.localStorage.setItem("site-theme", nextTheme);
    document.body.classList.remove("theme-is-switching", "theme-switch-to-day", "theme-switch-to-night");
    document.body.classList.add("theme-is-switching", `theme-switch-to-${nextTheme === "night" ? "night" : "day"}`);
    window.setTimeout(() => {
      document.body.classList.remove("theme-is-switching", "theme-switch-to-day", "theme-switch-to-night");
    }, 920);
    setTheme(nextTheme);
  });

  const setPointerVars = (event) => {
    root.style.setProperty("--mouse-x", `${event.clientX}px`);
    root.style.setProperty("--mouse-y", `${event.clientY}px`);
  };

  if (!reduceMotion && finePointer) {
    document.body.classList.add("has-pointer");
    window.addEventListener("pointermove", setPointerVars, { passive: true });

    let lastSpark = 0;
    let sparkIndex = 0;
    const maxSparks = 24;
    const gamePage = document.querySelector("[data-game-page]");

    const spawnSpark = (event) => {
      const now = performance.now();
      if (now - lastSpark < 42) return;
      lastSpark = now;
      const spark = document.createElement("span");
      spark.className = gamePage ? "pointer-spark is-game-spark" : "pointer-spark";
      spark.setAttribute("aria-hidden", "true");
      const drift = 10 + (sparkIndex % 4) * 4;
      const angle = (sparkIndex * 137.5 * Math.PI) / 180;
      spark.style.left = `${event.clientX}px`;
      spark.style.top = `${event.clientY}px`;
      spark.style.setProperty("--spark-x", `${Math.cos(angle) * drift}px`);
      spark.style.setProperty("--spark-y", `${Math.sin(angle) * drift}px`);
      document.body.appendChild(spark);
      sparkIndex += 1;
      while (document.querySelectorAll(".pointer-spark").length > maxSparks) {
        document.querySelector(".pointer-spark")?.remove();
      }
      spark.addEventListener("animationend", () => spark.remove(), { once: true });
    };

    const spawnRipple = (event) => {
      if (event.button !== 0) return;
      const ripple = document.createElement("span");
      ripple.className = "pointer-ripple";
      ripple.setAttribute("aria-hidden", "true");
      ripple.style.left = `${event.clientX}px`;
      ripple.style.top = `${event.clientY}px`;
      document.body.appendChild(ripple);
      ripple.addEventListener("animationend", () => ripple.remove(), { once: true });
    };

    window.addEventListener("pointermove", spawnSpark, { passive: true });
    window.addEventListener("pointerdown", spawnRipple, { passive: true });
  }

  if (location.pathname === "/" || location.pathname === "/index.html") {
    document.body.classList.add("home");
  }

  const progress = document.createElement("div");
  progress.className = "reading-progress";
  progress.setAttribute("aria-hidden", "true");
  document.body.appendChild(progress);

  const updateProgress = () => {
    const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const value = Math.min(1, Math.max(0, window.scrollY / max));
    progress.style.transform = `scaleX(${value})`;
    document.body.classList.toggle("is-scrolled", window.scrollY > 48);
  };

  window.addEventListener("scroll", updateProgress, { passive: true });
  window.addEventListener("resize", updateProgress, { passive: true });
  updateProgress();

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
      modal.querySelector(".resource-close")?.focus({ preventScroll: true });
    };

    const closeModal = () => {
      if (!modal) return;
      modal.classList.remove("is-open");
      modal.setAttribute("aria-hidden", "true");
      document.body.classList.remove("has-resource-modal");
      lastActiveTab?.focus({ preventScroll: true });
    };

    tabs.forEach((tab) => tab.addEventListener("click", () => openModal(tab.dataset.resourceTab)));
    closeButtons.forEach((button) => button.addEventListener("click", closeModal));
    window.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && modal?.classList.contains("is-open")) closeModal();
    });
  });

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

  document.querySelectorAll(".post-content pre").forEach((block) => {
    const button = document.createElement("button");
    button.className = "copy-code-button";
    button.type = "button";
    button.textContent = "复制";
    block.appendChild(button);

    button.addEventListener("click", async () => {
      const code = block.querySelector("code")?.innerText || block.innerText.replace(button.innerText, "");
      try {
        await navigator.clipboard.writeText(code.trimEnd());
        button.textContent = "已复制";
      } catch {
        button.textContent = "复制失败";
      }
      window.setTimeout(() => {
        button.textContent = "复制";
      }, 1400);
    });
  });

  const lightbox = document.createElement("div");
  lightbox.className = "image-lightbox";
  lightbox.setAttribute("aria-hidden", "true");
  lightbox.innerHTML = '<button class="image-lightbox-close" type="button" aria-label="关闭图片预览">×</button><img alt="">';
  document.body.appendChild(lightbox);
  const lightboxImage = lightbox.querySelector("img");
  const closeLightbox = () => {
    lightbox.classList.remove("is-open");
    lightbox.setAttribute("aria-hidden", "true");
    document.body.classList.remove("has-lightbox");
    lightboxImage?.removeAttribute("src");
  };

  document.querySelectorAll(".post-content img").forEach((image) => {
    image.addEventListener("click", () => {
      if (!lightboxImage) return;
      lightboxImage.src = image.currentSrc || image.src;
      lightboxImage.alt = image.alt || "";
      lightbox.classList.add("is-open");
      lightbox.setAttribute("aria-hidden", "false");
      document.body.classList.add("has-lightbox");
    });
  });
  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox || event.target.closest(".image-lightbox-close")) closeLightbox();
  });
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && lightbox.classList.contains("is-open")) closeLightbox();
  });

  const selectableItems = document.querySelectorAll(".post-card, .module-card, .game-card, .feature-card, .resource-tag, .link-item");
  if (finePointer) {
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
            const tiltX = (x / rect.width - 0.5) * 4;
            const tiltY = (0.5 - y / rect.height) * 3;
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
  }

  document.querySelectorAll(".post-card").forEach((card) => {
    const link = card.querySelector(".post-card-hit") || card.querySelector("h2 a");
    if (!link) return;
    card.addEventListener("click", (event) => {
      if (event.target.closest("a")) return;
      window.location.href = link.href;
    });
  });

  const revealItems = document.querySelectorAll(".reveal-on-scroll, .post-card, .feature-card, .module-card, .game-card, .resource-tag, .link-item");
  if ("IntersectionObserver" in window && !reduceMotion) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
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
  const hint = document.querySelector("[data-scroll-target]");
  const goToContent = () => content?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  hint?.addEventListener("click", goToContent);

  const orb = document.querySelector(".home-orb");
  if (orb && finePointer && !reduceMotion) {
    let orbFrame = 0;
    window.addEventListener(
      "pointermove",
      (event) => {
        if (orbFrame) return;
        orbFrame = window.requestAnimationFrame(() => {
          const rect = orb.getBoundingClientRect();
          const dx = (event.clientX - (rect.left + rect.width / 2)) / rect.width;
          const dy = (event.clientY - (rect.top + rect.height / 2)) / rect.height;
          orb.style.setProperty("--orb-x", `${Math.max(-1, Math.min(1, dx)) * 14}px`);
          orb.style.setProperty("--orb-y", `${Math.max(-1, Math.min(1, dy)) * 10}px`);
          orb.style.setProperty("--orb-rot-x", `${Math.max(-1, Math.min(1, -dy)) * 8}deg`);
          orb.style.setProperty("--orb-rot-y", `${Math.max(-1, Math.min(1, dx)) * 10}deg`);
          orbFrame = 0;
        });
      },
      { passive: true }
    );
  }

  const canvas = document.querySelector("[data-webgl-canvas]");
  if (!canvas || !hero || reduceMotion) return;

  const gl = canvas.getContext("webgl", {
    antialias: false,
    alpha: true,
    depth: false,
    powerPreference: "low-power",
  });
  if (!gl) return;

  const density = coarsePointer ? 42 : 78;
  const vertices = [];
  for (let y = 0; y < density; y += 1) {
    for (let x = 0; x < density; x += 1) {
      vertices.push((x / (density - 1)) * 2 - 1, (y / (density - 1)) * 2 - 1);
    }
  }

  const vertexShaderSource = `
    attribute vec2 a_position;
    uniform float u_time;
    uniform vec2 u_pointer;
    uniform float u_aspect;
    varying float v_depth;

    void main() {
      vec2 p = a_position;
      float wave = sin((p.x * 3.4 + u_time * 0.42)) * 0.055;
      wave += cos((p.y * 4.1 - u_time * 0.34)) * 0.045;
      float pull = 0.055 / (distance(vec2(p.x * u_aspect, p.y), vec2(u_pointer.x * u_aspect, u_pointer.y)) + 0.22);
      p.y += wave + pull * 0.18;
      p.x += sin(p.y * 3.0 + u_time * 0.18) * 0.018;
      v_depth = wave + pull;
      gl_Position = vec4(p, 0.0, 1.0);
      gl_PointSize = ${coarsePointer ? "1.4" : "1.9"} + v_depth * 9.0;
    }
  `;

  const fragmentShaderSource = `
    precision mediump float;
    varying float v_depth;

    void main() {
      vec2 uv = gl_PointCoord - 0.5;
      float dotShape = smoothstep(0.48, 0.12, length(uv));
      vec3 cyan = vec3(0.22, 0.86, 1.0);
      vec3 rose = vec3(1.0, 0.43, 0.72);
      vec3 color = mix(cyan, rose, clamp(v_depth * 2.2, 0.0, 1.0));
      gl_FragColor = vec4(color, dotShape * 0.42);
    }
  `;

  const createShader = (type, source) => {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  };

  const vertexShader = createShader(gl.VERTEX_SHADER, vertexShaderSource);
  const fragmentShader = createShader(gl.FRAGMENT_SHADER, fragmentShaderSource);
  if (!vertexShader || !fragmentShader) return;

  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

  const positionLocation = gl.getAttribLocation(program, "a_position");
  const timeLocation = gl.getUniformLocation(program, "u_time");
  const pointerLocation = gl.getUniformLocation(program, "u_pointer");
  const aspectLocation = gl.getUniformLocation(program, "u_aspect");

  const pointer = { x: 0, y: 0 };
  if (finePointer) {
    window.addEventListener(
      "pointermove",
      (event) => {
        const rect = canvas.getBoundingClientRect();
        pointer.x = ((event.clientX - rect.left) / Math.max(1, rect.width)) * 2 - 1;
        pointer.y = -(((event.clientY - rect.top) / Math.max(1, rect.height)) * 2 - 1);
      },
      { passive: true }
    );
  }

  let width = 0;
  let height = 0;
  const resize = () => {
    const scale = Math.min(window.devicePixelRatio || 1, coarsePointer ? 1 : 1.5);
    width = Math.floor(canvas.clientWidth * scale);
    height = Math.floor(canvas.clientHeight * scale);
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    gl.viewport(0, 0, width, height);
  };

  let visible = true;
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
      },
      { threshold: 0.02 }
    );
    observer.observe(hero);
  }

  let animationFrame = 0;
  const render = (time) => {
    animationFrame = window.requestAnimationFrame(render);
    if (!visible) return;
    resize();
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    gl.uniform1f(timeLocation, time * 0.001);
    gl.uniform2f(pointerLocation, pointer.x, pointer.y);
    gl.uniform1f(aspectLocation, width / Math.max(1, height));
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    gl.drawArrays(gl.POINTS, 0, vertices.length / 2);
  };

  animationFrame = window.requestAnimationFrame(render);
  window.addEventListener("pagehide", () => window.cancelAnimationFrame(animationFrame), { once: true });
})();
