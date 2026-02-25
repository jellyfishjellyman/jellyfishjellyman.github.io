(function () {
  // 创建回到顶部按钮
  const btn = document.createElement("button");
  btn.id = "backToTop";
  btn.type = "button";
  btn.setAttribute("aria-label", "Back to top");
  btn.innerHTML = "↑";
  document.body.appendChild(btn);

  if (location.pathname === "/" || location.pathname === "/index.html") {
    document.body.classList.add("home");
  }
  const toggle = () => {
    if (window.scrollY > 400) btn.classList.add("show");
    else btn.classList.remove("show");
  };

  window.addEventListener("scroll", toggle, { passive: true });
  toggle();

  btn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
})();
// ===== 首页：首次向下滚动时，从开场页平滑滑到内容区（只触发一次）=====
(function () {
  const hero = document.getElementById("hero");
  const content = document.getElementById("homeContent");
  if (!hero || !content) return;

  let done = false;

  const inHero = () => {
    const rect = hero.getBoundingClientRect();
    // hero 顶部在视口上方不太多，并且 still covers majority of viewport
    return rect.top <= 10 && rect.bottom > window.innerHeight * 0.6;
  };

  const go = () => {
    if (done) return;
    done = true;
    content.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // wheel（鼠标滚轮 / 触控板）
  window.addEventListener(
    "wheel",
    (e) => {
      if (done) return;
      if (!inHero()) return;
      if (e.deltaY <= 0) return;
      e.preventDefault();
      go();
    },
    { passive: false }
  );

  // touch（手机上滑）
  let touchStartY = null;
  window.addEventListener("touchstart", (e) => {
    touchStartY = e.touches?.[0]?.clientY ?? null;
  }, { passive: true });

  window.addEventListener("touchmove", (e) => {
    if (done) return;
    if (!inHero()) return;
    if (touchStartY == null) return;
    const y = e.touches?.[0]?.clientY ?? touchStartY;
    if (touchStartY - y > 10) {
      // 上滑
      go();
    }
  }, { passive: true });

  // 键盘
  window.addEventListener("keydown", (e) => {
    if (done) return;
    if (!inHero()) return;
    if (e.key === "ArrowDown" || e.key === "PageDown" || e.key === " ") {
      e.preventDefault();
      go();
    }
  });

  // 点击提示也能跳
  const hint = document.querySelector(".hero-hint");
  if (hint) hint.addEventListener("click", go);
})();