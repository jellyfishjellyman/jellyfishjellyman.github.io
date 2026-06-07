(function () {
  const root = document.documentElement;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
  const prefersNight = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const cleanText = (value) => String(value || "").replace(/\s+/g, " ").trim();

  const themeToggle = document.querySelector("[data-theme-toggle]");
  const storedTheme = window.localStorage.getItem("site-theme");
  const themeColorMeta = document.querySelector('meta[name="theme-color"]:not([media])') || document.createElement("meta");
  themeColorMeta.name = "theme-color";
  if (!themeColorMeta.parentNode) document.head.appendChild(themeColorMeta);
  const setTheme = (theme) => {
    root.dataset.theme = theme;
    themeToggle?.setAttribute("aria-pressed", String(theme === "night"));
    themeToggle?.setAttribute("aria-label", theme === "night" ? "切换到白天模式" : "切换到夜间模式");
    themeColorMeta.content = theme === "night" ? "#101412" : "#f6f4ee";
  };

  setTheme(storedTheme || root.dataset.theme || (prefersNight ? "night" : "day"));
  themeToggle?.addEventListener("click", () => {
    const nextTheme = root.dataset.theme === "night" ? "day" : "night";
    const rect = themeToggle.getBoundingClientRect();
    root.style.setProperty("--switch-x", `${rect.left + rect.width / 2}px`);
    root.style.setProperty("--switch-y", `${rect.top + rect.height / 2}px`);
    window.localStorage.setItem("site-theme", nextTheme);
    document.body.classList.remove("theme-is-switching", "theme-switch-to-day", "theme-switch-to-night");
    document.body.classList.add("theme-is-switching", `theme-switch-to-${nextTheme === "night" ? "night" : "day"}`);
    window.setTimeout(() => {
      document.body.classList.remove("theme-is-switching", "theme-switch-to-day", "theme-switch-to-night");
    }, reduceMotion ? 0 : 760);
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

  const quoteText = document.querySelector("[data-quote-text]");
  const quoteSource = document.querySelector("[data-quote-source]");
  const quoteNext = document.querySelector("[data-quote-next]");
  const quoteProxyUrl = document.querySelector('meta[name="random-quote-proxy"]')?.content || window.siteRandomQuoteProxy || "";
  const fallbackQuotes = [
    { text: "一往情深深几许？深山夕照深秋雨。", source: "纳兰性德 · 本地句库" },
    { text: "明月松间照，清泉石上流。", source: "王维 · 本地句库" },
    { text: "山中何事？松花酿酒，春水煎茶。", source: "张可久 · 本地句库" },
    { text: "夜暗方显万颗星，灯明始见一缕尘。", source: "站内小记 · 本地句库" },
    { text: "把复杂的事写清楚，也是一种慢慢变强。", source: "Jellyfish Lab · 本地句库" },
    { text: "玻璃晴朗，橘子辉煌。", source: "北岛 · 本地句库" },
    { text: "人间有味是清欢。", source: "苏轼 · 本地句库" },
    { text: "且将新火试新茶，诗酒趁年华。", source: "苏轼 · 本地句库" }
  ];
  const remoteQuoteSources = [
    {
      name: "站点代理",
      bucket: "proxy",
      url: quoteProxyUrl,
      parse: (data) => {
        const text = data?.text || data?.content || data?.hitokoto || data?.quote;
        return text ? { text, source: data?.source || "站点代理 · 随机灵感" } : null;
      },
      enabled: () => Boolean(quoteProxyUrl)
    },
    {
      name: "Hitokoto公开一言",
      bucket: "public",
      url: "https://v1.hitokoto.cn",
      parse: (data) => data?.hitokoto
        ? { text: data.hitokoto, source: `${data.from || data.creator || "Hitokoto"} · 公开一言` }
        : null
    },
    {
      name: "770a公开一言",
      bucket: "public",
      url: "https://www.770a.cn/yiyan/",
      parse: (data) => data?.hitokoto
        ? { text: data.hitokoto, source: `${data.from || data.creator || "770a.cn"} · 公开一言` }
        : (typeof data === "string" && data ? { text: data, source: "770a.cn · 公开一言" } : null)
    }
  ];
  const quoteFetchTimeout = 5200;
  const quoteClickGap = 1300;
  const quoteDailySoftLimit = 18;
  let quotes = fallbackQuotes;
  let quoteIndex = Math.floor(Math.random() * quotes.length);
  let quoteSourceIndex = Math.floor(Math.random() * remoteQuoteSources.length);
  let quoteLoading = false;
  let lastQuoteRequestAt = 0;
  const renderQuote = (quote) => {
    if (!quoteText || !quoteSource) return;
    const nextQuote = quote || quotes[quoteIndex % quotes.length];
    quoteText.textContent = nextQuote.text;
    quoteSource.textContent = nextQuote.source;
    if (!quote) quoteIndex += 1;
  };
  const loadQuotes = async () => {
    if (!quoteText || !quoteSource) return;
    try {
      const response = await fetch("/data/random-lines.json", { cache: "no-store" });
      if (!response.ok) return;
      const items = await response.json();
      if (!Array.isArray(items) || !items.length) return;
      quotes = items
        .filter((item) => item && item.text)
        .map((item) => ({
          text: item.text,
          source: `${item.source || item.type || "随机一言"} · 本地句库`
        }));
      quoteIndex = Math.floor(Math.random() * quotes.length);
      renderQuote();
    } catch (_) {
      quotes = fallbackQuotes;
    }
  };
  const fetchWithTimeout = async (url) => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), quoteFetchTimeout);
    try {
      const response = await fetch(url, { cache: "no-store", signal: controller.signal });
      const text = await response.text();
      if (!response.ok) return null;
      try {
        return JSON.parse(text);
      } catch (_) {
        return text.trim();
      }
    } finally {
      window.clearTimeout(timeoutId);
    }
  };
  const getQuoteUsage = () => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const usage = JSON.parse(window.localStorage.getItem("random-quote-usage") || "{}");
      return usage.date === today ? usage : { date: today, proxy: 0, public: 0 };
    } catch (_) {
      return { date: "", proxy: 0, public: 0 };
    }
  };
  const markQuoteUsage = (bucket) => {
    try {
      const usage = getQuoteUsage();
      usage[bucket] = (usage[bucket] || 0) + 1;
      window.localStorage.setItem("random-quote-usage", JSON.stringify(usage));
    } catch (_) {
      return;
    }
  };
  const canUseQuoteSource = (source) => {
    if (source.enabled && !source.enabled()) return false;
    if (source.bucket !== "proxy") return true;
    const usage = getQuoteUsage();
    return (usage.proxy || 0) < quoteDailySoftLimit;
  };
  const fetchRemoteQuote = async () => {
    const orderedSources = [
      ...remoteQuoteSources.slice(quoteSourceIndex),
      ...remoteQuoteSources.slice(0, quoteSourceIndex)
    ];
    quoteSourceIndex = (quoteSourceIndex + 1) % remoteQuoteSources.length;
    for (const source of orderedSources) {
      if (!canUseQuoteSource(source)) continue;
      try {
        const data = await fetchWithTimeout(source.url);
        const quote = data && source.parse(data);
        if (quote?.text) {
          markQuoteUsage(source.bucket);
          return quote;
        }
      } catch (_) {
        continue;
      }
    }
    return null;
  };
  const requestQuote = async ({ remote = false } = {}) => {
    if (!quoteText || !quoteSource || quoteLoading) return;
    const now = Date.now();
    if (remote && now - lastQuoteRequestAt < quoteClickGap) {
      renderQuote();
      return;
    }
    lastQuoteRequestAt = now;
    if (!remote) {
      renderQuote();
      return;
    }
    quoteLoading = true;
    quoteNext?.setAttribute("aria-busy", "true");
    if (quoteNext) quoteNext.textContent = "加载中";
    try {
      const remoteQuote = await fetchRemoteQuote();
      renderQuote(remoteQuote || undefined);
    } finally {
      quoteLoading = false;
      quoteNext?.removeAttribute("aria-busy");
      if (quoteNext) quoteNext.textContent = "换一句";
    }
  };
  renderQuote();
  loadQuotes();
  window.setTimeout(() => requestQuote({ remote: true }), 360);
  quoteNext?.addEventListener("click", () => requestQuote({ remote: true }));

  const homeTools = document.querySelector("[data-home-tools]");
  if (homeTools) {
    const tabs = homeTools.querySelectorAll("[data-tool-tab]");
    const panels = homeTools.querySelectorAll("[data-tool-panel]");
    const activateTool = (name) => {
      const current = homeTools.dataset.activeTool;
      const next = current === name ? "" : name;
      homeTools.dataset.activeTool = next;
      tabs.forEach((tab) => {
        const active = tab.dataset.toolTab === next;
        tab.classList.toggle("is-active", active);
        tab.setAttribute("aria-selected", String(active));
      });
      panels.forEach((panel) => {
        panel.classList.toggle("is-active", panel.dataset.toolPanel === next);
      });
    };
    tabs.forEach((tab) => {
      tab.addEventListener("click", () => activateTool(tab.dataset.toolTab));
    });
    if (window.matchMedia("(max-width: 720px)").matches) activateTool("search");
  }

  const searchForm = document.querySelector("[data-site-search]");
  const searchInput = document.querySelector("[data-search-input]");
  const searchResults = document.querySelector("[data-search-results]");
  let searchIndexPromise = null;
  const getSearchIndex = () => {
    if (!searchIndexPromise) {
      searchIndexPromise = fetch("/index.json")
        .then((response) => response.ok ? response.json() : [])
        .catch(() => []);
    }
    return searchIndexPromise;
  };
  const normalize = (value) => String(value || "").toLowerCase().trim();
  const getSearchKindLabel = (item) => {
    if (item.kind === "link") return "资源外链";
    if (item.kind === "tool") return item.external ? "工具外链" : "工具";
    if (item.kind === "api") return "公开 API";
    if (item.kind === "game") return item.external ? "游戏外链" : "游戏";
    if (item.section === "posts") return "文章";
    if (item.section === "links") return "资源页";
    if (item.section === "tools") return "工具页";
    return "站内页面";
  };
  const renderSearch = async () => {
    if (!searchInput || !searchResults) return;
    const query = normalize(searchInput.value);
    if (!query) {
      searchResults.innerHTML = '<div class="search-empty">输入关键词后会在这里显示结果。</div>';
      return;
    }
    const items = await getSearchIndex();
    const terms = query.split(/\s+/).filter(Boolean);
    const seen = new Set();
    const matches = items
      .map((item) => {
        const titleText = normalize(item.title);
        const sectionText = normalize([item.section, item.group, item.kind].join(" "));
        const bodyText = normalize([item.summary, item.url, (item.tags || []).join(" ")].join(" "));
        const score = terms.reduce((sum, term) => {
          if (!term) return sum;
          return sum
            + (titleText.includes(term) ? 4 : 0)
            + (sectionText.includes(term) ? 2 : 0)
            + (bodyText.includes(term) ? 1 : 0);
        }, 0);
        return { item, score };
      })
      .filter((entry) => entry.score > 0)
      .filter(({ item }) => {
        const key = `${normalize(item.title)}|${normalize(item.url)}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((a, b) => b.score - a.score || String(b.item.date || "").localeCompare(String(a.item.date || "")))
      .slice(0, 8);
    if (!matches.length) {
      searchResults.innerHTML = '<div class="search-empty">暂时没有匹配结果，换个关键词试试。</div>';
      return;
    }
    searchResults.replaceChildren(...matches.map(({ item }) => {
      const link = document.createElement("a");
      const meta = document.createElement("small");
      const title = document.createElement("strong");
      const summary = document.createElement("span");
      const metaText = [getSearchKindLabel(item), item.group].filter(Boolean).join(" / ");
      link.className = item.external ? "search-result is-external" : "search-result";
      link.href = item.url;
      if (item.external) {
        link.target = "_blank";
        link.rel = "noopener noreferrer";
      }
      meta.textContent = metaText;
      title.textContent = item.title;
      summary.textContent = item.summary || item.section || "站内页面";
      link.append(meta, title, summary);
      return link;
    }));
  };
  if (searchForm) {
    searchResults.innerHTML = '<div class="search-empty">输入关键词后会在这里显示结果。</div>';
    searchForm.addEventListener("submit", (event) => {
      event.preventDefault();
      renderSearch();
    });
    searchInput?.addEventListener("input", () => {
      window.clearTimeout(searchInput._searchTimer);
      searchInput._searchTimer = window.setTimeout(renderSearch, 160);
    });
  }

  const repairHomeToolText = () => {
    if (themeToggle) {
      themeToggle.setAttribute("aria-label", root.dataset.theme === "night" ? "切换到白天模式" : "切换到夜间模式");
    }
    document.querySelectorAll(".search-empty").forEach((item) => {
      const text = item.textContent || "";
      if (!text || /[\u9428\u9357\u68e3\u93c2\u74a7\u5bb8\u5a13\u93bc\u934f\u922b\u6fb6\u9354\u93b9\u6748\u7ed4\u7477]/.test(text)) {
        item.textContent = searchInput?.value?.trim() ? "暂时没有匹配结果，换个关键词试试。" : "输入关键词后会在这里显示结果。";
      }
    });
    document.querySelectorAll(".search-result span").forEach((item) => {
      if (/[\u9428\u9357\u68e3\u93c2\u74a7\u5bb8\u5a13\u93bc\u934f\u922b\u6fb6\u9354\u93b9\u6748\u7ed4\u7477]/.test(item.textContent || "")) {
        item.textContent = "站内页面";
      }
    });
    if (quoteNext && /[\u9428\u9357\u68e3\u93c2\u74a7\u5bb8\u5a13\u93bc\u934f\u922b\u6fb6\u9354\u93b9\u6748\u7ed4\u7477]/.test(quoteNext.textContent || "")) {
      quoteNext.textContent = quoteNext.getAttribute("aria-busy") ? "加载中" : "换一句";
    }
  };

  repairHomeToolText();
  if (searchResults) {
    new MutationObserver(repairHomeToolText).observe(searchResults, { childList: true, subtree: true });
  }
  quoteNext?.addEventListener("click", () => window.setTimeout(repairHomeToolText, 0));
  themeToggle?.addEventListener("click", () => window.setTimeout(repairHomeToolText, 0));

  const apiLab = document.querySelector("[data-public-api-lab]");
  if (apiLab) {
    const tabs = Array.from(apiLab.querySelectorAll("[data-api-tab]"));
    const panels = Array.from(apiLab.querySelectorAll("[data-api-panel]"));
    const forms = Array.from(apiLab.querySelectorAll("[data-api-form]"));
    const resultFor = (name) => apiLab.querySelector(`[data-api-result="${name}"]`);
    const activateApiTab = (name) => {
      tabs.forEach((tab) => {
        const active = tab.dataset.apiTab === name;
        tab.classList.toggle("is-active", active);
        tab.setAttribute("aria-selected", String(active));
      });
      panels.forEach((panel) => panel.classList.toggle("is-active", panel.dataset.apiPanel === name));
    };
    const escapeHtml = (value) => {
      const span = document.createElement("span");
      span.textContent = value == null ? "" : String(value);
      return span.innerHTML;
    };
    const decodeApiText = (value) => {
      try {
        return decodeURIComponent(String(value || "").replace(/\+/g, "%20"));
      } catch (_) {
        return String(value || "");
      }
    };
    const formatNumber = (value) => new Intl.NumberFormat("zh-CN", { maximumFractionDigits: 2 }).format(Number(value || 0));
    const weatherNames = {
      0: "晴朗",
      1: "大体晴朗",
      2: "局部多云",
      3: "阴天",
      45: "有雾",
      48: "雾凇",
      51: "小毛毛雨",
      53: "毛毛雨",
      55: "强毛毛雨",
      61: "小雨",
      63: "中雨",
      65: "大雨",
      71: "小雪",
      73: "中雪",
      75: "大雪",
      80: "阵雨",
      81: "较强阵雨",
      82: "强阵雨",
      95: "雷暴",
    };
    const setApiState = (name, state, title, message) => {
      const result = resultFor(name);
      if (!result) return;
      result.classList.remove("is-loading", "is-error", "is-success");
      result.classList.add(`is-${state}`);
      result.innerHTML = `<span>${escapeHtml(message)}</span><strong>${escapeHtml(title)}</strong>`;
    };
    const renderApiResult = (name, payload) => {
      const result = resultFor(name);
      if (!result) return;
      const rows = (payload.rows || [])
        .filter((row) => row && row.value)
        .map((row) => `
          <div class="api-result-item">
            <small>${escapeHtml(row.label)}</small>
            <strong>${escapeHtml(row.value)}</strong>
          </div>
        `).join("");
      const note = payload.note ? `<p>${escapeHtml(payload.note)}</p>` : "";
      const image = payload.image
        ? `<img class="api-result-image" src="${escapeHtml(payload.image.src)}" alt="${escapeHtml(payload.image.alt || "")}" loading="lazy">`
        : "";
      const audio = payload.audio
        ? `<audio controls preload="none" src="${escapeHtml(payload.audio)}"></audio>`
        : "";
      result.classList.remove("is-loading", "is-error");
      result.classList.add("is-success");
      result.innerHTML = `
        <span>${escapeHtml(payload.meta || "公开 API 返回")}</span>
        <strong>${escapeHtml(payload.title)}</strong>
        ${image}
        ${rows ? `<div class="api-result-grid">${rows}</div>` : ""}
        ${note}
        ${audio}
      `;
    };
    const fetchJsonWithTimeout = async (url) => {
      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), 8000);
      try {
        const response = await fetch(url, { cache: "no-store", signal: controller.signal });
        const text = await response.text();
        let data = null;
        try {
          data = text ? JSON.parse(text) : null;
        } catch (_) {
          data = text;
        }
        if (!response.ok) {
          const message = data?.message || data?.title || `请求失败：${response.status}`;
          throw new Error(message);
        }
        return data;
      } finally {
        window.clearTimeout(timeoutId);
      }
    };
    const runApiForm = async (form, runner) => {
      const name = form.dataset.apiForm;
      const submit = form.querySelector('button[type="submit"]');
      setApiState(name, "loading", "正在连接公开 API", "如果服务限流或 CORS 变化，会在这里提示");
      if (submit) submit.disabled = true;
      try {
        await runner(new FormData(form));
      } catch (error) {
        const message = error?.name === "AbortError" ? "请求超时，稍后再试" : (error?.message || "公开 API 暂时不可用");
        setApiState(name, "error", "没有拿到可用结果", message);
      } finally {
        if (submit) submit.disabled = false;
      }
    };
    const runners = {
      dictionary: async (formData) => {
        const word = cleanText(formData.get("word"));
        if (!word) throw new Error("请输入要查询的英文单词");
        const data = await fetchJsonWithTimeout(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
        const entry = Array.isArray(data) ? data[0] : null;
        const meaning = entry?.meanings?.[0];
        const definition = meaning?.definitions?.[0]?.definition;
        if (!entry || !definition) throw new Error("没有找到释义");
        const audio = (entry.phonetics || []).find((item) => item.audio)?.audio;
        renderApiResult("dictionary", {
          title: entry.word || word,
          meta: [meaning.partOfSpeech, entry.phonetic].filter(Boolean).join(" · ") || "Free Dictionary API",
          rows: [
            { label: "释义", value: definition },
            { label: "近义词", value: (meaning.synonyms || []).slice(0, 6).join("、") },
          ],
          note: (entry.sourceUrls || [])[0] ? `来源：${entry.sourceUrls[0]}` : "",
          audio,
        });
      },
      exchange: async (formData) => {
        const amount = Number(formData.get("amount") || 0);
        const from = cleanText(formData.get("from")).toUpperCase();
        const to = cleanText(formData.get("to")).toUpperCase();
        if (!amount || amount < 0) throw new Error("请输入大于 0 的金额");
        if (!from || !to) throw new Error("请选择币种");
        if (from === to) {
          renderApiResult("exchange", {
            title: `${formatNumber(amount)} ${to}`,
            meta: "同币种无需换算",
            rows: [{ label: "汇率", value: "1" }],
          });
          return;
        }
        let data = null;
        let value = null;
        let source = "Frankfurter";
        try {
          data = await fetchJsonWithTimeout(`https://api.frankfurter.app/latest?amount=${encodeURIComponent(amount)}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);
          value = data?.rates?.[to];
        } catch (_) {
          const base = from.toLowerCase();
          const target = to.toLowerCase();
          data = await fetchJsonWithTimeout(`https://latest.currency-api.pages.dev/v1/currencies/${encodeURIComponent(base)}.json`);
          const rate = data?.[base]?.[target];
          if (typeof rate === "number") {
            value = amount * rate;
            source = "Currency-api";
            data = { amount, base: from, date: data.date, rates: { [to]: value } };
          }
        }
        if (typeof value !== "number") throw new Error("汇率服务没有返回目标币种");
        renderApiResult("exchange", {
          title: `${formatNumber(amount)} ${from} ≈ ${formatNumber(value)} ${to}`,
          meta: `${source} · ${data.date || "最新可用日期"}`,
          rows: [
            { label: "基准金额", value: `${formatNumber(data.amount || amount)} ${data.base || from}` },
            { label: "折算结果", value: `${formatNumber(value)} ${to}` },
          ],
          note: "汇率日期取决于服务端最新可用交易日；Frankfurter 不可用时自动切换备用源。",
        });
      },
      country: async (formData) => {
        const query = cleanText(formData.get("country"));
        if (!query) throw new Error("请输入国家或地区名称");
        const data = await fetchJsonWithTimeout(`https://restcountries.com/v3.1/name/${encodeURIComponent(query)}?fields=name,capital,region,subregion,population,currencies,languages,flags`);
        const entries = Array.isArray(data) ? data : [];
        const country = entries.find((item) => item.name?.common?.toLowerCase() === query.toLowerCase()) || entries[0];
        if (!country) throw new Error("没有找到国家资料");
        const currencies = Object.entries(country.currencies || {})
          .map(([code, value]) => `${code} ${value.name || ""}`.trim())
          .join("、");
        const languages = Object.values(country.languages || {}).join("、");
        renderApiResult("country", {
          title: country.name?.common || query,
          meta: country.name?.official || "REST Countries",
          image: country.flags?.svg ? { src: country.flags.svg, alt: country.flags.alt || `${country.name?.common || query} flag` } : null,
          rows: [
            { label: "首都", value: (country.capital || []).join("、") || "未列出" },
            { label: "地区", value: [country.region, country.subregion].filter(Boolean).join(" · ") },
            { label: "人口", value: country.population ? `${formatNumber(country.population)} 人` : "" },
            { label: "货币", value: currencies },
            { label: "语言", value: languages },
          ],
        });
      },
      weather: async (formData) => {
        const city = cleanText(formData.get("city"));
        if (!city) throw new Error("请输入城市名");
        const geo = await fetchJsonWithTimeout(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=zh&format=json`);
        const place = geo?.results?.[0];
        if (!place) throw new Error("没有找到城市坐标");
        const weather = await fetchJsonWithTimeout(`https://api.open-meteo.com/v1/forecast?latitude=${encodeURIComponent(place.latitude)}&longitude=${encodeURIComponent(place.longitude)}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=auto`);
        const current = weather?.current;
        if (!current) throw new Error("天气服务没有返回当前数据");
        renderApiResult("weather", {
          title: `${place.name}${place.admin1 ? ` · ${place.admin1}` : ""}`,
          meta: `Open-Meteo · ${current.time || "当前天气"}`,
          rows: [
            { label: "天气", value: weatherNames[current.weather_code] || `天气代码 ${current.weather_code}` },
            { label: "温度", value: `${current.temperature_2m}°C` },
            { label: "湿度", value: `${current.relative_humidity_2m}%` },
            { label: "风速", value: `${current.wind_speed_10m} km/h` },
          ],
          note: `${place.country || ""}${place.timezone ? ` · ${place.timezone}` : ""}`,
        });
      },
      trivia: async () => {
        const data = await fetchJsonWithTimeout("https://opentdb.com/api.php?amount=1&type=multiple&encode=url3986");
        const item = data?.results?.[0];
        if (!item) throw new Error("题库暂时没有返回题目");
        const answers = [item.correct_answer, ...(item.incorrect_answers || [])]
          .map(decodeApiText)
          .sort(() => Math.random() - 0.5);
        renderApiResult("trivia", {
          title: decodeApiText(item.question),
          meta: [decodeApiText(item.category), decodeApiText(item.difficulty)].filter(Boolean).join(" · "),
          rows: [
            { label: "选项", value: answers.join(" / ") },
            { label: "答案", value: decodeApiText(item.correct_answer) },
          ],
        });
      },
    };
    tabs.forEach((tab) => tab.addEventListener("click", () => activateApiTab(tab.dataset.apiTab)));
    forms.forEach((form) => {
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        const runner = runners[form.dataset.apiForm];
        if (runner) runApiForm(form, runner);
      });
    });
  }

  const guestbook = document.querySelector("[data-guestbook]");
  if (guestbook) {
    const apiBase = guestbook.dataset.api || "";
    const form = guestbook.querySelector("[data-guestbook-form]");
    const list = guestbook.querySelector("[data-guestbook-list]");
    const status = guestbook.querySelector("[data-guestbook-status]");
    const startedAtField = guestbook.querySelector("[data-guestbook-started-at]");
    const nameInput = guestbook.querySelector('input[name="name"]');
    const randomNameButton = guestbook.querySelector("[data-guestbook-random-name]");
    const isHomeGuestbook = list?.classList.contains("home-guestbook-canvas");
    const noteClasses = ["note-blue", "note-green", "note-pink", "note-lilac", "note-sky", "note-white"];
    const guestNameAdjectives = [
      "隐秘", "迅捷", "冷静", "精准", "破晓", "暗影", "锋利", "坚韧", "炽热", "霜冷",
      "雷鸣", "清澈", "荒芜", "漂泊", "回响", "寂静", "湮灭", "灰烬", "极昼", "逆光",
      "历战", "凶猛", "巨型", "古老", "狩猎", "冰封", "灼热", "幽毒", "狂怒", "敏锐",
      "守护", "量子", "纳米", "共生", "星际", "远征", "热血", "深邃", "晶亮", "灵巧",
      "黄金", "音速", "波动", "铁壁", "杀意", "神圣", "混沌", "灵能", "不屈", "猩红",
      "褪色", "斑驳", "癫狂", "暗月", "熔金", "重力", "秘藏", "爆裂", "蚀刻", "冰冻",
      "幸存", "孤高", "幽深", "野性", "无形", "锐眼", "虔诚", "夜雀", "温暖", "幻想",
      "天命", "如意", "凝滞", "坚硬", "聚形", "刚毅", "流光", "雾蓝", "白玉", "竹影",
      "奔放", "庄严", "失落", "虚空", "边境", "高能", "跃迁", "警戒", "灼目", "幽蓝",
      "银白", "赤红", "翠绿", "苍蓝", "玄黑", "琥珀", "夜行", "断罪", "离谱", "镜像",
      "星蚀", "无畏", "坚固", "机敏", "妖火", "暴躁", "沉默", "秘银", "闪耀", "影缝",
      "构造", "升格", "逆元", "终焉", "虹闪", "衔尾", "零落", "帕弥什", "露西亚式", "极夜",
      "升龙", "旋风", "百裂", "电刃", "迅雷", "刚拳", "音巢", "真空", "疾风", "烈火",
      "鲜血", "腐败", "癫火", "熔炉", "古龙", "死诞", "辉石", "赐福", "星月", "王城",
      "轨道", "解放", "超级", "民主", "空降", "火力", "榴弹", "补给", "增援", "战术",
      "深岩", "钻探", "硝石", "墨菱", "矿脉", "镐击", "虫潮", "空舱", "矮人", "岩核",
      "风涡", "雷楔", "霜华", "炽焰", "磐岩", "草木", "尘世", "星穹", "神瞳", "深渊",
      "共鸣", "潮汐", "鸣泣", "荒涡", "无音", "溯洄", "弥音", "声骸", "残响", "漂泊者式",
      "猎空式", "源氏式", "半藏式", "黑影式", "天使式", "西格玛式", "守望", "脉冲", "龙刃", "重装",
      "蛛丝", "毒液", "瓦坎达", "阿斯加德", "复仇", "悬丝", "反浩克", "无限", "振金", "共生体式"
    ];
    const guestNameNouns = [
      "特遣队员", "侦察兵", "突击手", "医疗兵", "工兵", "狙击手", "指挥官", "战术犬", "补给箱", "信标",
      "不死鸟", "贤者", "夜露", "炼狱", "零", "捷风", "霓虹", "星芒阵", "幽影", "尖塔",
      "旅行者", "神之眼", "风之翼", "尘世之锁", "千岩长枪", "雾切", "若陀龙王", "特瓦林", "丘丘人", "史莱姆",
      "漂泊者", "共鸣器", "声骸", "无音区", "潮汐猎手", "回响乐师", "残象", "鸣式", "荒石", "弥音兽",
      "构造体", "升格者", "指挥官", "意识海", "红潮", "露西亚", "丽芙", "神威", "比安卡", "机体",
      "猎人", "艾露猫", "火龙", "轰龙", "灭尽龙", "冰牙龙", "雷狼龙", "金狮子", "冥灯龙", "煌黑龙",
      "猎空", "源氏", "半藏", "温斯顿", "查莉娅", "天使", "死神", "黑影", "巴蒂斯特", "西格玛",
      "蜘蛛侠", "毒液", "共生体", "瓦坎达", "阿斯加德", "量子通道", "纳米战甲", "蛛丝发射器", "迈尔斯", "章鱼博士",
      "地狱潜兵", "解放者", "轨道炮", "补给仓", "机甲", "虫族克星", "超级地球", "民主之刃", "空投舱", "榴弹兵",
      "矮人矿工", "钻机手", "侦察员", "炮手", "工程师", "墨菱石", "异虫蜂后", "空降舱", "黄金矿脉", "酒吧杯",
      "隆", "肯", "春丽", "古烈", "嘉米", "布兰卡", "本田", "波动拳", "升龙拳", "音速手刀",
      "星际战士", "机械教士", "灵能者", "审判官", "战斗修女", "欧克兽人", "钛星人", "灵族游侠", "链锯剑", "动力甲",
      "褪色者", "梅琳娜", "菈妮", "碎星", "女武神", "恶兆王", "满月女王", "黑剑", "龙王", "赐福",
      "秘藏猎人", "小吵闹", "魔女", "兽王", "特工", "枪手", "疯子", "大骗子", "天使", "毁灭者",
      "幸存者", "野人", "变异体", "石斧", "木屋", "洞穴探险家", "图腾", "潜水器", "篝火", "飞机餐",
      "艾吉奥", "阿泰尔", "康纳", "爱德华", "巴耶克", "卡珊德拉", "艾沃尔", "袖剑", "鹰眼视觉", "信仰之跃",
      "米斯蒂娅", "夜雀老板娘", "烤鳗鱼", "幻之酒", "油豆腐", "白玉丸子", "竹取玉", "宴席桌", "幻想乡来客", "夜市招牌",
      "天命人", "狼妖", "蛇女", "虎先锋", "石先锋", "黄风怪", "亢金龙", "灵虚子", "六丁六甲", "葫芦",
      "边境电台", "月面仓库", "雪原火把", "废墟路标", "星港售票员", "裂隙档案", "备用钥匙", "风暴望远镜", "旧城区地图", "雨夜终端",
      "训练场靶子", "料理锅", "矿车", "任务板", "传送锚点", "篝火看守", "弹药袋", "药水瓶", "护符", "远征旗",
      "AveMujica", "Doloris", "Mortis", "Timoris", "Amoris", "Oblivionis", "丰川祥子", "若叶睦", "八幡海铃", "祐天寺若麦",
      "三角初华", "月海假面", "黑蔷薇键盘", "哥特舞台", "迷子乐队", "CRYCHIC", "假面鼓手", "月之森", "灯光控台", "金色面具",
      "井芹仁菜", "河原木桃香", "安和昴", "海老塚智", "露帕", "刺刺乐队", "无刺有刺", "钻石星尘", "贝斯包", "练习室",
      "少女主唱", "街角吉他", "键盘手", "鼓棒", "舞台返听", "Live屋", "乐队车票", "原创乐谱", "演出海报", "排练搭档",
      "皇家国教骑士团", "海尔辛机关", "阿卡多", "因特古拉", "塞拉斯", "沃尔特", "安德森神父", "伊斯卡里奥", "米伦尼姆", "少校",
      "薛定谔准尉", "伦敦塔", "银十字", "哈克南巨炮", "吸血鬼猎人", "圆桌会议", "女警吸血鬼", "管家手套", "圣钉", "第十三课",
      "海特洛市", "伊波恩古董店", "异象猎人", "半角街", "哈尼娅", "海月", "异象委托", "都市怪谈", "超自然谜团", "异能伙伴",
      "自动贩卖机", "交通信号灯", "民间委托", "古董店员", "怪谈档案", "街巷秘境", "异常现象", "无证猎人", "都市物语", "温馨小窝",
      "拉米亚", "哈比", "人鱼", "史莱姆娘", "阿尔劳娜", "阿拉克涅", "狐娘", "狼娘", "猫妖", "龙娘",
      "妖精", "小恶魔", "塞壬", "史库拉", "独角兽娘", "半人马娘", "美杜莎", "报丧女妖", "鸟身女妖", "魔物图鉴",
      "森林精灵", "海妖歌姬", "蘑菇娘", "雪女", "吸血鬼娘", "木乃伊娘", "沙罗曼达", "温泉妖精", "梦魔", "哥布林娘",
      "虚拟主播", "绊爱", "直播间", "棉花糖", "切片师", "Live2D模型", "歌回", "耐久台", "舰长", "弹幕墙",
      "虚拟形象", "动捕棚", "3D模型", "生日主播", "联动搭档", "杂谈台", "实况主播", "虹社", "hololive", "模型师",
      "特别周", "无声铃鹿", "东海帝王", "小栗帽", "黄金船", "米浴", "目白麦昆", "大和赤骥", "伏特加", "鲁道夫象征",
      "赛马场", "胜负服", "马娘训练员", "闸门", "URA决赛", "友情训练", "弯道加速", "逃马", "差马", "终盘冲刺",
      "皮卡丘", "伊布", "喷火龙", "妙蛙种子", "杰尼龟", "路卡利欧", "耿鬼", "梦幻", "超梦", "快龙",
      "可达鸭", "卡比兽", "精灵球", "宝可梦图鉴", "宝可梦中心", "训练家", "道馆馆主", "极巨腕带", "大师球", "宝可梦蛋",
      "星之卡比", "瓦豆鲁迪", "帝帝帝大王", "梅塔骑士", "复制能力", "波普之星", "梦之泉", "吸入大王", "星之杖", "糖果山",
      "马力欧", "路易吉", "碧姬公主", "酷霸王", "耀西", "林克", "塞尔达", "萨姆斯", "皮克敏", "动森岛民",
      "喷射战士", "蘑菇王国", "海拉鲁", "银河战士", "动物之森", "大乱斗", "马力欧赛车", "火焰花", "三角力量", "大师剑",
      "炭治郎", "祢豆子", "善逸", "伊之助", "富冈义勇", "胡蝶忍", "炼狱杏寿郎", "宇髄天元", "鬼舞辻无惨", "日轮刀",
      "呼吸法", "水之呼吸", "炎之呼吸", "蝶屋", "鬼杀队", "柱合会议", "无限城", "珠世", "愈史郎", "青色彼岸花",
      "江户川柯南", "毛利兰", "毛利小五郎", "灰原哀", "怪盗基德", "赤井秀一", "安室透", "工藤新一", "阿笠博士", "少年侦探团",
      "黑衣组织", "蝴蝶结变声器", "足球腰带", "麻醉针手表", "滑板", "侦探徽章", "贝尔摩德", "琴酒", "伏特加", "波本",
      "漩涡鸣人", "宇智波佐助", "春野樱", "卡卡西", "自来也", "宇智波鼬", "日向雏田", "宇智波斑", "九尾", "写轮眼",
      "螺旋丸", "影分身", "晓组织", "木叶忍者", "火影岩", "苦无", "护额", "尾兽玉", "须佐能乎", "通灵卷轴",
      "叶文洁", "罗辑", "程心", "云天明", "章北海", "三体人", "智子", "面壁者", "破壁人", "水滴",
      "黑暗森林", "古筝行动", "二向箔", "掩体纪元", "红岸基地", "ETO", "阶梯计划", "执剑人", "蓝色空间号", "引力波天线",
      "Saber", "Archer", "Lancer", "Rider", "Caster", "Assassin", "Berserker", "卫宫士郎", "远坂凛", "间桐樱",
      "阿尔托莉雅", "吉尔伽美什", "库丘林", "美狄亚", "圣杯", "令咒", "英灵座", "迦勒底", "玛修", "藤丸立香"
    ];

    const refreshGuestbookStartedAt = () => {
      if (startedAtField) startedAtField.value = String(Date.now());
    };

    const randomGuestName = () => {
      const adjective = guestNameAdjectives[Math.floor(Math.random() * guestNameAdjectives.length)];
      const noun = guestNameNouns[Math.floor(Math.random() * guestNameNouns.length)];
      return cleanText(`${adjective}${noun}`).slice(0, 20);
    };

    const fillRandomGuestName = () => {
      if (!nameInput) return;
      nameInput.value = randomGuestName();
      nameInput.dispatchEvent(new Event("input", { bubbles: true }));
    };

    const setGuestbookStatus = (message, type = "") => {
      if (!status) return;
      status.textContent = message;
      status.classList.toggle("is-error", type === "error");
      status.classList.toggle("is-success", type === "success");
    };

    const formatGuestTime = (timestamp) => {
      if (!timestamp) return "刚刚";
      try {
        return new Intl.DateTimeFormat("zh-CN", {
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        }).format(new Date(timestamp));
      } catch (_) {
        return "刚刚";
      }
    };

    const escapeText = (value) => {
      const span = document.createElement("span");
      span.textContent = value || "";
      return span.innerHTML;
    };

    const renderGuestMessages = (messages) => {
      if (!list) return;
      if (!messages.length) {
        list.innerHTML = isHomeGuestbook ? `
          <a class="board-note note-blue" href="/guestbook/">
            <span>你好，陌生人</span>
            <strong>留言板刚擦干净，第一张纸条等你来贴。</strong>
            <em>进入留言板</em>
          </a>
        ` : `
          <article class="guest-note note-blue">
            <span>你好，陌生人</span>
            <strong>留言板刚擦干净，第一张纸条等你来贴。</strong>
            <em>空白中</em>
          </article>
        `;
        return;
      }

      list.innerHTML = messages.map((item, index) => {
        const noteClass = noteClasses[index % noteClasses.length];
        const name = escapeText(item.name || "路过的人");
        const message = escapeText(item.message || "");
        const time = formatGuestTime(item.created_at);
        return isHomeGuestbook ? `
          <a class="board-note ${noteClass}" href="/guestbook/">
            <span>${name}</span>
            <strong>${message}</strong>
            <em>${time}</em>
          </a>
        ` : `
          <article class="guest-note ${noteClass}">
            <span>${name}</span>
            <strong>${message}</strong>
            <em>${time}</em>
          </article>
        `;
      }).join("");
    };

    const loadGuestMessages = async () => {
      if (!apiBase) return;
      try {
        const response = await fetch(`${apiBase}/messages`, { headers: { Accept: "application/json" } });
        const data = await response.json();
        if (!response.ok) throw new Error(data?.error || "留言加载失败。");
        renderGuestMessages(Array.isArray(data.messages) ? data.messages : []);
      } catch (error) {
        renderGuestMessages([]);
        setGuestbookStatus(error.message || "留言加载失败。", "error");
      }
    };

    form?.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!apiBase) return;
      const submitButton = form.querySelector('button[type="submit"]');
      const formData = new FormData(form);
      if (!cleanText(formData.get("name"))) {
        const generatedName = randomGuestName();
        formData.set("name", generatedName);
        if (nameInput) nameInput.value = generatedName;
      }
      if (submitButton) submitButton.disabled = true;
      setGuestbookStatus("正在贴上纸条...");
      try {
        const response = await fetch(`${apiBase}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.get("name"),
            message: formData.get("message"),
            website: formData.get("website"),
            startedAt: formData.get("startedAt"),
          }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data?.error || "留言提交失败。");
        form.reset();
        refreshGuestbookStartedAt();
        setGuestbookStatus("纸条贴好了。", "success");
        await loadGuestMessages();
      } catch (error) {
        setGuestbookStatus(error.message || "留言提交失败。", "error");
      } finally {
        if (submitButton) submitButton.disabled = false;
      }
    });

    refreshGuestbookStartedAt();
    randomNameButton?.addEventListener("click", fillRandomGuestName);
    loadGuestMessages();
  }

  const selectableItems = document.querySelectorAll(".post-card, .module-card, .game-card, .feature-card, .resource-tag, .link-item, .api-source-card, .api-directory-item");
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
    const cardVideo = card.querySelector(".post-card-video");
    if (cardVideo) {
      cardVideo.pause();
      cardVideo.currentTime = 0;
      const playCardVideo = () => {
        if (reduceMotion) return;
        cardVideo.play().catch(() => {});
      };
      const pauseCardVideo = () => {
        cardVideo.pause();
        cardVideo.currentTime = 0;
      };
      card.addEventListener("pointerenter", playCardVideo);
      card.addEventListener("focusin", playCardVideo);
      card.addEventListener("pointerleave", pauseCardVideo);
      card.addEventListener("focusout", pauseCardVideo);
    }
    if (!link) return;
    card.addEventListener("click", (event) => {
      if (event.target.closest("a")) return;
      window.location.href = link.href;
    });
  });

  const ambientPanel = document.querySelector("[data-ambient-player]");
  const ambientToggle = document.querySelector("[data-ambient-toggle]");
  const ambientStatus = document.querySelector("[data-ambient-status]");
  if (ambientPanel && ambientToggle) {
    let ambientAudio = null;
    let ambientState = "off";
    const ambientSrc = cleanText(ambientPanel.dataset.audioSrc);

    const setAmbientState = (state, label, status) => {
      ambientState = state;
      ambientPanel.dataset.state = state;
      ambientPanel.classList.toggle("is-playing", state === "playing");
      ambientPanel.classList.toggle("is-paused", state === "paused");
      ambientToggle.setAttribute("aria-pressed", String(state === "playing"));
      ambientToggle.setAttribute("aria-label", label);
      if (ambientStatus) ambientStatus.textContent = status;
    };

    const ensureAmbientAudio = () => {
      if (!ambientSrc) return null;
      if (ambientAudio) return ambientAudio;
      ambientAudio = new Audio(ambientSrc);
      ambientAudio.loop = true;
      ambientAudio.volume = 0.12;
      ambientAudio.preload = "none";
      ambientAudio.addEventListener("ended", () => setAmbientState("paused", "继续氛围声音", "已暂停"));
      ambientAudio.addEventListener("error", () => setAmbientState("off", "开启氛围声音", "音频不可用"));
      return ambientAudio;
    };

    ambientToggle.addEventListener("click", async () => {
      const audio = ensureAmbientAudio();
      if (!audio) {
        setAmbientState("off", "开启氛围声音", "请先添加音频");
        return;
      }
      if (ambientState === "playing") {
        audio.pause();
        setAmbientState("paused", "继续氛围声音", "已暂停");
        return;
      }
      try {
        await audio.play();
        setAmbientState("playing", "暂停氛围声音", "低音量播放中");
      } catch (_) {
        setAmbientState("off", "开启氛围声音", "点击后再试");
      }
    });

    setAmbientState("off", "开启氛围声音", "默认关闭");
  }

  const revealItems = document.querySelectorAll(".reveal-on-scroll, .post-card, .feature-card, .module-card, .game-card, .resource-tag, .link-item, .api-source-card, .api-directory-item");
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
