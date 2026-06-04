(function () {
  const root = document.documentElement;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const coarsePointer = window.matchMedia("(pointer: coarse)").matches;

  const setPointerVars = (event) => {
    root.style.setProperty("--mouse-x", `${event.clientX}px`);
    root.style.setProperty("--mouse-y", `${event.clientY}px`);
  };

  if (!reduceMotion && finePointer) {
    document.body.classList.add("has-pointer");
    window.addEventListener("pointermove", setPointerVars, { passive: true });
  }

  if (location.pathname === "/" || location.pathname === "/index.html") {
    document.body.classList.add("home");
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
  const goToContent = () => {
    if (!content) return;
    content.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  };
  if (hint) hint.addEventListener("click", goToContent);

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
