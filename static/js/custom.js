(function () {
  const root = document.documentElement;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
  const prefersNight = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const cleanText = (value) => String(value || "").replace(/\s+/g, " ").trim();

  const themeToggle = document.querySelector("[data-theme-toggle]");
  const menuToggle = document.querySelector("[data-menu-toggle]");
  const siteMenu = document.querySelector("[data-site-menu]");
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

  const setMenuOpen = (open) => {
    if (!menuToggle || !siteMenu) return;
    document.body.classList.toggle("site-menu-open", open);
    menuToggle.setAttribute("aria-expanded", String(open));
    menuToggle.setAttribute("aria-label", open ? "关闭导航" : "打开导航");
  };

  menuToggle?.addEventListener("click", () => {
    setMenuOpen(!document.body.classList.contains("site-menu-open"));
  });

  siteMenu?.addEventListener("click", (event) => {
    if (event.target.closest("a")) setMenuOpen(false);
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setMenuOpen(false);
  });

  window.addEventListener("resize", () => {
    if (window.matchMedia("(min-width: 821px)").matches) setMenuOpen(false);
  }, { passive: true });

  const hydrateVideo = (video) => {
    if (!video || video.dataset.videoHydrated === "true") return;
    const base = video.dataset.videoBase;
    if (!base) return;
    const webm = document.createElement("source");
    webm.src = `/videos/${base}.webm`;
    webm.type = "video/webm";
    const mp4 = document.createElement("source");
    mp4.src = `/videos/${base}.mp4`;
    mp4.type = "video/mp4";
    video.append(webm, mp4);
    video.dataset.videoHydrated = "true";
    video.load();
  };

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
    const formatNumber = (value, digits = 2) => new Intl.NumberFormat("zh-CN", { maximumFractionDigits: digits }).format(Number(value || 0));
    const compactJoin = (items, separator = "、") => items.filter(Boolean).join(separator);
    const currencyLabels = {
      CNY: "人民币",
      USD: "美元",
      EUR: "欧元",
      JPY: "日元",
      GBP: "英镑",
      HKD: "港币",
      SGD: "新加坡元",
      AUD: "澳元",
      CAD: "加元",
      CHF: "瑞郎",
    };
    const commonCurrencies = ["USD", "CNY", "EUR", "JPY", "GBP", "HKD", "SGD", "AUD", "CAD", "CHF"];
    const currencyLabel = (code) => currencyLabels[code] ? `${code} · ${currencyLabels[code]}` : code;
    const formatDay = (value) => {
      try {
        return new Intl.DateTimeFormat("zh-CN", { month: "2-digit", day: "2-digit", weekday: "short" }).format(new Date(`${value}T00:00:00`));
      } catch (_) {
        return value || "";
      }
    };
    const shortText = (value, limit = 220) => {
      const text = cleanText(value);
      return text.length > limit ? `${text.slice(0, limit - 1)}…` : text;
    };
    const stripHtml = (value) => {
      const box = document.createElement("span");
      box.innerHTML = String(value || "");
      return cleanText(box.textContent || "");
    };
    const hasEnglishText = (value) => /[A-Za-z][A-Za-z\s'’.,:;!?()/-]{2,}/.test(String(value || ""));
    const collectTranslationText = (payload) => {
      const pieces = [];
      const seen = new Set();
      const add = (value) => {
        const text = shortText(cleanText(value), 220);
        if (/^(en|english|zh|zh-cn|chinese)$/i.test(text)) return;
        if (!text || !hasEnglishText(text) || seen.has(text)) return;
        seen.add(text);
        pieces.push(text);
      };
      add(payload.title);
      add(payload.summary);
      add(payload.note);
      (payload.rows || []).forEach((row) => add(row?.value));
      (payload.chips || []).forEach(add);
      (payload.choices || []).forEach((choice) => add(choice?.label));
      (payload.sections || []).forEach((section) => {
        (section.items || []).forEach((item) => {
          add(item?.label);
          add(item?.value);
          add(item?.meta);
        });
      });
      return pieces.join("\n").slice(0, 1200);
    };
    const formatHost = (value) => {
      try {
        return new URL(value).hostname.replace(/^www\./, "");
      } catch (_) {
        return "";
      }
    };
    const formatRelativeTime = (seconds) => {
      const diff = Math.max(0, Math.floor(Date.now() / 1000) - Number(seconds || 0));
      if (diff < 3600) return `${Math.max(1, Math.floor(diff / 60))} 分钟前`;
      if (diff < 86400) return `${Math.floor(diff / 3600)} 小时前`;
      return `${Math.floor(diff / 86400)} 天前`;
    };
    const formatDateTime = (value) => {
      if (!value) return "";
      try {
        return new Intl.DateTimeFormat("zh-CN", {
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        }).format(new Date(value));
      } catch (_) {
        return String(value).slice(0, 16);
      }
    };
    const formatDuration = (seconds) => {
      const total = Number(seconds || 0);
      if (!Number.isFinite(total) || total <= 0) return "";
      const hours = Math.floor(total / 3600);
      const minutes = Math.floor((total % 3600) / 60);
      return `${hours} 小时 ${minutes} 分钟`;
    };
    const titleCase = (value) => cleanText(value)
      .split(/[\s_-]+/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
    const boolText = (value) => value ? "是" : "否";
    const normalizeDomain = (value) => cleanText(value)
      .replace(/^mailto:/i, "")
      .replace(/^https?:\/\//i, "")
      .split(/[/?#]/)[0]
      .split("@")
      .pop()
      .toLowerCase();
    const parseTraceText = (text) => Object.fromEntries(String(text || "")
      .split(/\n+/)
      .map((line) => line.split("="))
      .filter((parts) => parts.length >= 2)
      .map(([key, ...rest]) => [key, rest.join("=")]));
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
        .filter((row) => row && row.value != null && row.value !== "")
        .map((row) => `
          <div class="api-result-item">
            <small>${escapeHtml(row.label)}</small>
            <strong>${escapeHtml(row.value)}</strong>
          </div>
        `).join("");
      const chips = (payload.chips || [])
        .filter(Boolean)
        .map((chip) => `<span>${escapeHtml(chip)}</span>`)
        .join("");
      const sections = (payload.sections || [])
        .map((section) => {
          const items = (section.items || [])
            .filter((item) => item && (item.label || item.value || item.meta))
            .map((item) => `
              <article class="api-result-list-item">
                ${item.label ? `<small>${escapeHtml(item.label)}</small>` : ""}
                ${item.value ? `<strong>${escapeHtml(item.value)}</strong>` : ""}
                ${item.meta ? `<em>${escapeHtml(item.meta)}</em>` : ""}
              </article>
            `).join("");
          if (!items) return "";
          return `
            <div class="api-result-section">
              ${section.title ? `<h4>${escapeHtml(section.title)}</h4>` : ""}
              <div class="api-result-list">${items}</div>
            </div>
          `;
        })
        .join("");
      const choices = (payload.choices || [])
        .map((choice, index) => `
          <button class="api-choice" type="button" data-trivia-choice data-correct="${choice.correct ? "true" : "false"}">
            <span>${String.fromCharCode(65 + index)}</span>
            ${escapeHtml(choice.label)}
          </button>
        `).join("");
      const note = payload.note ? `<p>${escapeHtml(payload.note)}</p>` : "";
      const summary = payload.summary ? `<p class="api-result-summary">${escapeHtml(payload.summary)}</p>` : "";
      const image = payload.image
        ? `<img class="api-result-image" src="${escapeHtml(payload.image.src)}" alt="${escapeHtml(payload.image.alt || "")}" loading="lazy">`
        : "";
      const swatch = payload.swatch
        ? `<span class="api-color-swatch" style="--api-swatch:${escapeHtml(payload.swatch)}"></span>`
        : "";
      const link = payload.link?.href
        ? `<a class="api-result-link" href="${escapeHtml(payload.link.href)}" target="_blank" rel="noopener noreferrer">${escapeHtml(payload.link.label || "打开链接")}</a>`
        : "";
      const audio = payload.audio
        ? `<audio controls preload="none" src="${escapeHtml(payload.audio)}"></audio>`
        : "";
      const translationText = collectTranslationText(payload);
      const translateControl = translationText
        ? `
          <div class="api-translate" data-api-translate-shell>
            <button class="api-translate-button" type="button" data-api-translate>翻译成中文</button>
            <div class="api-translation" data-api-translation hidden></div>
          </div>
        `
        : "";
      result.classList.remove("is-loading", "is-error");
      result.classList.add("is-success");
      result.innerHTML = `
        <span>${escapeHtml(payload.meta || "公开 API 返回")}</span>
        <strong>${escapeHtml(payload.title)}</strong>
        ${summary}
        ${swatch}
        ${image}
        ${link}
        ${rows ? `<div class="api-result-grid">${rows}</div>` : ""}
        ${chips ? `<div class="api-result-chips">${chips}</div>` : ""}
        ${sections}
        ${choices ? `<div class="api-choice-grid">${choices}</div><p class="api-choice-feedback" data-trivia-feedback>选择一个答案。</p>` : ""}
        ${note}
        ${audio}
        ${translateControl}
      `;
      if (translationText) {
        result.dataset.translateText = translationText;
      } else {
        delete result.dataset.translateText;
      }
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
          const message = data?.message || data?.title || data?.error || `请求失败：${response.status}`;
          throw new Error(message);
        }
        return data;
      } finally {
        window.clearTimeout(timeoutId);
      }
    };
    const translationCache = new Map();
    const translateWithMyMemory = async (text) => {
      const data = await fetchJsonWithTimeout(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en%7Czh-CN`);
      const translated = stripHtml(data?.responseData?.translatedText);
      if (!translated || data?.quotaFinished || Number(data?.responseStatus) >= 400) throw new Error("MyMemory 暂时不可用");
      return { text: translated, provider: "MyMemory" };
    };
    const translateWithGoogle = async (text) => {
      const data = await fetchJsonWithTimeout(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=zh-CN&dt=t&q=${encodeURIComponent(text)}`);
      const translated = Array.isArray(data?.[0])
        ? data[0].map((part) => part?.[0] || "").join("")
        : "";
      if (!translated) throw new Error("翻译服务没有返回内容");
      return { text: stripHtml(translated), provider: "Google translate gtx" };
    };
    const translateTextToChinese = async (text) => {
      const source = cleanText(text).slice(0, 1200);
      if (!source) throw new Error("没有可翻译内容");
      if (translationCache.has(source)) return translationCache.get(source);
      let result = null;
      try {
        result = await translateWithMyMemory(source);
      } catch (_) {
        result = await translateWithGoogle(source);
      }
      translationCache.set(source, result);
      return result;
    };
    const runApiForm = async (form, runner) => {
      const name = form.dataset.apiForm;
      const submit = form.querySelector('button[type="submit"]');
      setApiState(name, "loading", "正在查询", "如果服务限流或网络异常，会在这里提示");
      if (submit) submit.disabled = true;
      try {
        await runner(new FormData(form));
      } catch (error) {
        const message = error?.name === "AbortError" ? "请求超时，稍后再试" : (error?.message || "服务暂时不可用");
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
        const meanings = entry?.meanings || [];
        const definitions = meanings
          .flatMap((meaning) => (meaning.definitions || []).slice(0, 2).map((definition) => ({
            label: meaning.partOfSpeech || "释义",
            value: definition.definition,
            meta: definition.example ? `例句：${definition.example}` : "",
          })))
          .filter((item) => item.value)
          .slice(0, 6);
        if (!entry || !definitions.length) throw new Error("没有找到释义");
        const audio = (entry.phonetics || []).find((item) => item.audio)?.audio;
        const phonetics = Array.from(new Set((entry.phonetics || []).map((item) => item.text).filter(Boolean))).slice(0, 3);
        const synonyms = Array.from(new Set(meanings.flatMap((meaning) => [
          ...(meaning.synonyms || []),
          ...(meaning.definitions || []).flatMap((definition) => definition.synonyms || []),
        ]))).slice(0, 12);
        const parts = Array.from(new Set(meanings.map((meaning) => meaning.partOfSpeech).filter(Boolean))).slice(0, 6);
        renderApiResult("dictionary", {
          title: entry.word || word,
          meta: compactJoin([parts.join(" / "), phonetics.join(" / ") || entry.phonetic], " · ") || "Free Dictionary API",
          summary: definitions[0]?.value,
          rows: [
            { label: "词性", value: parts.join("、") },
            { label: "音标", value: phonetics.join(" / ") || entry.phonetic },
            { label: "发音", value: audio ? "可播放" : "暂无音频" },
          ],
          chips: synonyms,
          sections: [{ title: "更多释义", items: definitions }],
          audio,
        });
      },
      exchange: async (formData) => {
        const amount = Number(formData.get("amount") || 0);
        const from = cleanText(formData.get("from")).toUpperCase();
        const to = cleanText(formData.get("to")).toUpperCase();
        if (!Number.isFinite(amount) || amount <= 0) throw new Error("请输入大于 0 的金额");
        if (!from || !to) throw new Error("请选择币种");
        if (from === to) {
          renderApiResult("exchange", {
            title: `${formatNumber(amount)} ${to}`,
            meta: "同币种无需换算",
            rows: [
              { label: "汇率", value: "1" },
              { label: "币种", value: currencyLabel(to) },
            ],
          });
          return;
        }
        const targetCodes = Array.from(new Set([to, ...commonCurrencies.filter((code) => code !== from && code !== to)])).slice(0, 6);
        let data = null;
        let value = null;
        let rates = {};
        let source = "Frankfurter";
        try {
          data = await fetchJsonWithTimeout(`https://api.frankfurter.app/latest?amount=${encodeURIComponent(amount)}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(targetCodes.join(","))}`);
          rates = data?.rates || {};
          value = rates[to];
        } catch (_) {
          const base = from.toLowerCase();
          const fallback = await fetchJsonWithTimeout(`https://latest.currency-api.pages.dev/v1/currencies/${encodeURIComponent(base)}.json`);
          const sourceRates = fallback?.[base] || {};
          rates = Object.fromEntries(targetCodes
            .map((code) => [code, sourceRates[code.toLowerCase()]])
            .filter(([, rate]) => typeof rate === "number")
            .map(([code, rate]) => [code, amount * rate]));
          value = rates[to];
          source = "Currency-api";
          data = { amount, base: from, date: fallback?.date, rates };
        }
        if (typeof value !== "number") throw new Error("汇率服务没有返回目标币种");
        const rate = value / amount;
        const watchItems = targetCodes
          .filter((code) => typeof rates[code] === "number")
          .map((code) => ({
            label: currencyLabel(code),
            value: `${formatNumber(rates[code])} ${code}`,
            meta: `1 ${from} = ${formatNumber(rates[code] / amount, 6)} ${code}`,
          }));
        renderApiResult("exchange", {
          title: `${formatNumber(amount)} ${from} ≈ ${formatNumber(value)} ${to}`,
          meta: `${source} · ${data.date || "最新可用日期"}`,
          rows: [
            { label: "基准金额", value: `${formatNumber(data.amount || amount)} ${data.base || from}` },
            { label: "折算结果", value: `${formatNumber(value)} ${to}` },
            { label: "实时汇率", value: `1 ${from} = ${formatNumber(rate, 6)} ${to}` },
            { label: "反向汇率", value: `1 ${to} = ${formatNumber(1 / rate, 6)} ${from}` },
          ],
          sections: [{ title: "常用币种对照", items: watchItems }],
          note: "日期取决于服务端最新可用交易日；主源不可用时自动切换备用源。",
        });
      },
      country: async (formData) => {
        const query = cleanText(formData.get("country"));
        if (!query) throw new Error("请输入国家或地区名称");
        const data = await fetchJsonWithTimeout(`https://restcountries.com/v3.1/name/${encodeURIComponent(query)}?fields=name,capital,region,subregion,population,currencies,languages,flags,timezones,area,continents,cca2,cca3,idd`);
        const entries = Array.isArray(data) ? data : [];
        const country = entries.find((item) => item.name?.common?.toLowerCase() === query.toLowerCase()) || entries[0];
        if (!country) throw new Error("没有找到国家资料");
        const currencies = Object.entries(country.currencies || {}).map(([code, value]) => compactJoin([code, value.name, value.symbol ? `(${value.symbol})` : ""], " "));
        const languages = Object.values(country.languages || {});
        const callingCodes = country.idd?.root && Array.isArray(country.idd?.suffixes)
          ? country.idd.suffixes.slice(0, 4).map((suffix) => `${country.idd.root}${suffix}`).join("、")
          : "";
        renderApiResult("country", {
          title: country.name?.common || query,
          meta: country.name?.official || "REST Countries",
          image: country.flags?.svg ? { src: country.flags.svg, alt: country.flags.alt || `${country.name?.common || query} flag` } : null,
          rows: [
            { label: "首都", value: (country.capital || []).join("、") || "未列出" },
            { label: "地区", value: compactJoin([country.region, country.subregion], " · ") },
            { label: "人口", value: country.population ? `${formatNumber(country.population)} 人` : "" },
            { label: "面积", value: country.area ? `${formatNumber(country.area, 0)} km²` : "" },
            { label: "区号", value: callingCodes },
          ],
          chips: [...currencies, ...languages].slice(0, 12),
          sections: [{
            title: "补充资料",
            items: [
              { label: "洲", value: (country.continents || []).join("、") },
              { label: "时区", value: (country.timezones || []).slice(0, 6).join("、") },
              { label: "国家代码", value: compactJoin([country.cca2, country.cca3], " / ") },
              { label: "货币", value: currencies.join("、") },
              { label: "语言", value: languages.join("、") },
            ],
          }],
        });
      },
      weather: async (formData) => {
        const city = cleanText(formData.get("city"));
        if (!city) throw new Error("请输入城市名");
        const geo = await fetchJsonWithTimeout(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=zh&format=json`);
        const place = geo?.results?.[0];
        if (!place) throw new Error("没有找到城市坐标");
        const weather = await fetchJsonWithTimeout(`https://api.open-meteo.com/v1/forecast?latitude=${encodeURIComponent(place.latitude)}&longitude=${encodeURIComponent(place.longitude)}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&forecast_days=5&timezone=auto`);
        const current = weather?.current;
        if (!current) throw new Error("天气服务没有返回当前数据");
        const currentUnits = weather.current_units || {};
        const daily = weather.daily || {};
        const forecastItems = (daily.time || []).map((day, index) => ({
          label: formatDay(day),
          value: `${weatherNames[daily.weather_code?.[index]] || `天气代码 ${daily.weather_code?.[index]}`} · ${daily.temperature_2m_min?.[index]}~${daily.temperature_2m_max?.[index]}°C`,
          meta: daily.precipitation_probability_max?.[index] != null ? `最大降水概率 ${daily.precipitation_probability_max[index]}%` : "",
        }));
        renderApiResult("weather", {
          title: `${place.name}${place.admin1 ? ` · ${place.admin1}` : ""}`,
          meta: `Open-Meteo · ${current.time || "当前天气"}`,
          rows: [
            { label: "天气", value: weatherNames[current.weather_code] || `天气代码 ${current.weather_code}` },
            { label: "温度", value: `${current.temperature_2m}${currentUnits.temperature_2m || "°C"}` },
            { label: "湿度", value: `${current.relative_humidity_2m}${currentUnits.relative_humidity_2m || "%"}` },
            { label: "风速", value: `${current.wind_speed_10m} ${currentUnits.wind_speed_10m || "km/h"}` },
          ],
          sections: [{ title: "未来几天", items: forecastItems }],
          note: `${place.country || ""}${place.timezone ? ` · ${place.timezone}` : ""}`,
        });
      },
      trivia: async (formData) => {
        const category = cleanText(formData.get("category"));
        const difficulty = cleanText(formData.get("difficulty"));
        const params = new URLSearchParams({ amount: "1", type: "multiple", encode: "url3986" });
        if (category) params.set("category", category);
        if (difficulty) params.set("difficulty", difficulty);
        const data = await fetchJsonWithTimeout(`https://opentdb.com/api.php?${params.toString()}`);
        const item = data?.results?.[0];
        if (!item) throw new Error("题库暂时没有返回题目");
        const correctAnswer = decodeApiText(item.correct_answer);
        const answers = [correctAnswer, ...(item.incorrect_answers || []).map(decodeApiText)]
          .sort(() => Math.random() - 0.5);
        const difficultyNames = { easy: "简单", medium: "中等", hard: "困难" };
        renderApiResult("trivia", {
          title: decodeApiText(item.question),
          meta: compactJoin([decodeApiText(item.category), difficultyNames[decodeApiText(item.difficulty)] || decodeApiText(item.difficulty)], " · "),
          summary: "点选一个答案，结果会直接在卡片里标出来。",
          rows: [
            { label: "题型", value: "单选题" },
            { label: "选项数", value: `${answers.length} 个` },
          ],
          choices: answers.map((answer) => ({ label: answer, correct: answer === correctAnswer })),
        });
      },
      wiki: async (formData) => {
        const topic = cleanText(formData.get("topic"));
        if (!topic) throw new Error("请输入百科词条");
        const search = await fetchJsonWithTimeout(`https://zh.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(topic)}&format=json&origin=*&srlimit=5`);
        const matches = search?.query?.search || [];
        const best = matches[0];
        if (!best?.title) throw new Error("没有找到百科结果");
        let summary = null;
        try {
          summary = await fetchJsonWithTimeout(`https://zh.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(best.title.replace(/\s+/g, "_"))}`);
        } catch (_) {
          summary = null;
        }
        renderApiResult("wiki", {
          title: summary?.title || best.title,
          meta: compactJoin(["Wikipedia", summary?.description], " · "),
          summary: shortText(summary?.extract || stripHtml(best.snippet), 260),
          image: summary?.thumbnail?.source ? { src: summary.thumbnail.source, alt: summary.title || best.title } : null,
          rows: [
            { label: "匹配词条", value: `${matches.length} 个` },
            { label: "页面编号", value: best.pageid },
            { label: "语言", value: "中文维基百科" },
          ],
          chips: matches.slice(0, 5).map((item) => item.title),
          sections: [{
            title: "相关结果",
            items: matches.slice(1, 5).map((item) => ({
              label: item.title,
              value: shortText(stripHtml(item.snippet), 120),
              meta: item.timestamp ? item.timestamp.slice(0, 10) : "",
            })),
          }],
        });
      },
      books: async (formData) => {
        const query = cleanText(formData.get("query"));
        if (!query) throw new Error("请输入书名或作者");
        const data = await fetchJsonWithTimeout(`https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=6`);
        const docs = data?.docs || [];
        const book = docs[0];
        if (!book) throw new Error("没有找到图书");
        const authors = (book.author_name || []).slice(0, 3);
        const cover = book.cover_i ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg` : "";
        renderApiResult("books", {
          title: book.title || query,
          meta: compactJoin(["Open Library", authors.join("、")], " · "),
          image: cover ? { src: cover, alt: book.title || query } : null,
          rows: [
            { label: "作者", value: authors.join("、") },
            { label: "首版年份", value: book.first_publish_year },
            { label: "版本数", value: book.edition_count ? `${formatNumber(book.edition_count, 0)} 个` : "" },
            { label: "语言", value: (book.language || []).slice(0, 5).join("、") },
          ],
          chips: (book.subject || []).slice(0, 10),
          sections: [{
            title: "更多结果",
            items: docs.slice(1, 6).map((item) => ({
              label: (item.author_name || []).slice(0, 2).join("、") || "作者未列出",
              value: item.title,
              meta: compactJoin([item.first_publish_year, item.edition_count ? `${item.edition_count} 个版本` : ""], " · "),
            })),
          }],
          note: data?.numFound ? `共找到约 ${formatNumber(data.numFound, 0)} 条记录。` : "",
        });
      },
      art: async (formData) => {
        const query = cleanText(formData.get("query"));
        if (!query) throw new Error("请输入艺术家或主题");
        const data = await fetchJsonWithTimeout(`https://api.artic.edu/api/v1/artworks/search?q=${encodeURIComponent(query)}&limit=6&fields=id,title,artist_display,date_display,image_id,thumbnail,place_of_origin,medium_display`);
        const works = data?.data || [];
        const work = works.find((item) => item.image_id) || works[0];
        if (!work) throw new Error("没有找到馆藏作品");
        const image = work.image_id ? `${data.config?.iiif_url || "https://www.artic.edu/iiif/2"}/${work.image_id}/full/420,/0/default.jpg` : "";
        renderApiResult("art", {
          title: work.title || query,
          meta: compactJoin(["Art Institute of Chicago", work.date_display], " · "),
          summary: shortText(work.thumbnail?.alt_text || work.medium_display || "", 220),
          image: image ? { src: image, alt: work.thumbnail?.alt_text || work.title || query } : null,
          rows: [
            { label: "作者", value: work.artist_display },
            { label: "年代", value: work.date_display },
            { label: "地区", value: work.place_of_origin },
            { label: "材质", value: work.medium_display },
          ],
          sections: [{
            title: "相关馆藏",
            items: works.slice(0, 6).map((item) => ({
              label: item.date_display || "年代未列出",
              value: item.title,
              meta: item.artist_display,
            })),
          }],
        });
      },
      anime: async (formData) => {
        const query = cleanText(formData.get("query"));
        if (!query) throw new Error("请输入动漫名");
        const data = await fetchJsonWithTimeout(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=6&sfw=true`);
        const items = data?.data || [];
        const anime = items[0];
        if (!anime) throw new Error("没有找到动漫资料");
        renderApiResult("anime", {
          title: anime.title || query,
          meta: compactJoin(["Jikan", anime.title_japanese], " · "),
          summary: shortText(anime.synopsis, 260),
          image: anime.images?.jpg?.image_url ? { src: anime.images.jpg.image_url, alt: anime.title || query } : null,
          rows: [
            { label: "评分", value: anime.score ? `${anime.score} / 10` : "" },
            { label: "集数", value: anime.episodes ? `${anime.episodes} 集` : "" },
            { label: "年份", value: anime.year },
            { label: "状态", value: anime.status },
          ],
          chips: (anime.genres || []).slice(0, 8).map((item) => item.name),
          sections: [{
            title: "相近条目",
            items: items.slice(1, 6).map((item) => ({
              label: compactJoin([item.type, item.year], " · "),
              value: item.title,
              meta: item.score ? `评分 ${item.score}` : item.status,
            })),
          }],
        });
      },
      news: async () => {
        const ids = await fetchJsonWithTimeout("https://hacker-news.firebaseio.com/v0/topstories.json?print=pretty");
        const topIds = Array.isArray(ids) ? ids.slice(0, 8) : [];
        if (!topIds.length) throw new Error("热榜暂时没有返回内容");
        const stories = (await Promise.all(topIds.map((id) => fetchJsonWithTimeout(`https://hacker-news.firebaseio.com/v0/item/${id}.json?print=pretty`).catch(() => null))))
          .filter((item) => item && item.title)
          .slice(0, 6);
        if (!stories.length) throw new Error("热榜详情加载失败");
        const top = stories[0];
        renderApiResult("news", {
          title: top.title,
          meta: "Hacker News · Top Stories",
          summary: top.url ? `来源域名：${formatHost(top.url)}` : "Ask HN / Show HN 讨论帖",
          rows: [
            { label: "热榜条目", value: `${stories.length} 条` },
            { label: "最高分", value: `${formatNumber(top.score, 0)} 分` },
            { label: "评论", value: `${formatNumber(top.descendants, 0)} 条` },
            { label: "时间", value: formatRelativeTime(top.time) },
          ],
          sections: [{
            title: "当前热榜",
            items: stories.map((item) => ({
              label: compactJoin([`${formatNumber(item.score, 0)} 分`, `${formatNumber(item.descendants, 0)} 评论`], " · "),
              value: item.title,
              meta: item.url ? formatHost(item.url) : "news.ycombinator.com",
            })),
          }],
        });
      },
      poetry: async (formData) => {
        const title = cleanText(formData.get("title"));
        if (!title) throw new Error("请输入英文诗题");
        const data = await fetchJsonWithTimeout(`https://poetrydb.org/title/${encodeURIComponent(title)}/title,author,lines,linecount`);
        const poems = Array.isArray(data) ? data : [];
        const poem = poems[0];
        if (!poem) throw new Error("没有找到诗歌");
        const lines = (poem.lines || []).filter(Boolean);
        renderApiResult("poetry", {
          title: poem.title || title,
          meta: compactJoin(["PoetryDB", poem.author], " · "),
          summary: lines.slice(0, 2).join(" / "),
          rows: [
            { label: "作者", value: poem.author },
            { label: "行数", value: poem.linecount ? `${poem.linecount} 行` : `${lines.length} 行` },
            { label: "匹配", value: `${poems.length} 首` },
          ],
          sections: [{
            title: "诗句摘录",
            items: lines.slice(0, 8).map((line, index) => ({
              label: `第 ${index + 1} 行`,
              value: line,
            })),
          }],
        });
      },
      words: async (formData) => {
        const term = cleanText(formData.get("term")).toLowerCase();
        const mode = cleanText(formData.get("mode")) || "ml";
        if (!term) throw new Error("请输入英文词");
        const modeNames = {
          ml: "语义联想",
          rel_rhy: "押韵",
          sl: "近似发音",
          sp: "拼写建议",
        };
        const data = await fetchJsonWithTimeout(`https://api.datamuse.com/words?${encodeURIComponent(mode)}=${encodeURIComponent(term)}&max=12&md=psf`);
        const words = Array.isArray(data) ? data : [];
        if (!words.length) throw new Error("没有找到词语结果");
        renderApiResult("words", {
          title: `${term} · ${modeNames[mode] || "词语结果"}`,
          meta: "Datamuse",
          rows: [
            { label: "结果数", value: `${words.length} 个` },
            { label: "最高分", value: words[0]?.score ? formatNumber(words[0].score, 0) : "" },
            { label: "模式", value: modeNames[mode] || mode },
          ],
          chips: words.slice(0, 10).map((item) => item.word),
          sections: [{
            title: "候选词",
            items: words.map((item) => ({
              label: (item.tags || []).slice(0, 3).join(" · ") || "word",
              value: item.word,
              meta: item.score ? `score ${formatNumber(item.score, 0)}` : "",
            })),
          }],
        });
      },
      holidays: async (formData) => {
        const year = Number(formData.get("year") || new Date().getFullYear());
        const country = cleanText(formData.get("country")).toUpperCase();
        if (!Number.isInteger(year) || year < 2000 || year > 2100) throw new Error("请输入 2000 到 2100 之间的年份");
        if (!/^[A-Z]{2}$/.test(country)) throw new Error("请选择两位国家代码");
        const data = await fetchJsonWithTimeout(`https://date.nager.at/api/v3/PublicHolidays/${encodeURIComponent(year)}/${encodeURIComponent(country)}`);
        const holidays = Array.isArray(data) ? data : [];
        if (!holidays.length) throw new Error("没有找到该国家/年份的公共假日");
        const next = holidays.find((item) => new Date(`${item.date}T23:59:59`) >= new Date()) || holidays[0];
        renderApiResult("holidays", {
          title: `${country} · ${year} 公共假日`,
          meta: "Nager.Date",
          rows: [
            { label: "假日数量", value: `${holidays.length} 天` },
            { label: "下一个/首个", value: next ? `${next.date} · ${next.name}` : "" },
            { label: "全国性", value: `${holidays.filter((item) => item.global).length} 天` },
          ],
          sections: [{
            title: "假日列表",
            items: holidays.slice(0, 10).map((item) => ({
              label: compactJoin([item.date, item.global ? "全国" : "地区"], " · "),
              value: item.localName || item.name,
              meta: item.name,
            })),
          }],
        });
      },
      network: async () => {
        const [geo, traceText] = await Promise.all([
          fetchJsonWithTimeout("https://get.geojs.io/v1/ip/geo.json"),
          fetchJsonWithTimeout("https://one.one.one.one/cdn-cgi/trace"),
        ]);
        const trace = typeof traceText === "string" ? parseTraceText(traceText) : {};
        renderApiResult("network", {
          title: geo?.ip || trace.ip || "当前网络",
          meta: compactJoin(["GeoJS", "Cloudflare Trace"], " · "),
          rows: [
            { label: "城市", value: compactJoin([geo?.city, geo?.region], " · ") },
            { label: "国家/地区", value: compactJoin([geo?.country, geo?.country_code], " · ") },
            { label: "ASN", value: geo?.asn ? `AS${geo.asn}` : "" },
            { label: "组织", value: geo?.organization_name },
            { label: "HTTP 协议", value: trace.http },
            { label: "TLS", value: trace.tls },
          ],
          chips: [trace.colo ? `Cloudflare ${trace.colo}` : "", trace.loc, trace.visit_scheme, trace.warp ? `WARP ${trace.warp}` : ""],
          note: "这是浏览器当前出口网络信息，可能受代理、CDN 或运营商出口影响。",
        });
      },
      emailcheck: async (formData) => {
        const domain = normalizeDomain(formData.get("email"));
        if (!domain || !domain.includes(".")) throw new Error("请输入邮箱地址或域名");
        const data = await fetchJsonWithTimeout(`https://open.kickbox.com/v1/disposable/${encodeURIComponent(domain)}`);
        renderApiResult("emailcheck", {
          title: domain,
          meta: "Kickbox Open",
          rows: [
            { label: "临时邮箱域名", value: boolText(data?.disposable) },
            { label: "检测结论", value: data?.disposable ? "不建议用于注册或联系" : "未命中临时邮箱库" },
          ],
          note: "此接口只判断域名是否出现在临时邮箱数据库，不验证邮箱账号是否真实存在。",
        });
      },
      colors: async () => {
        const data = await fetchJsonWithTimeout("https://x-colors.yurace.pro/api/random");
        if (!data?.hex) throw new Error("配色服务没有返回颜色");
        renderApiResult("colors", {
          title: data.hex,
          meta: "xColors",
          swatch: data.hex,
          rows: [
            { label: "HEX", value: data.hex },
            { label: "RGB", value: data.rgb },
            { label: "HSL", value: data.hsl },
          ],
        });
      },
      emoji: async () => {
        const data = await fetchJsonWithTimeout("https://emojihub.yurace.pro/api/random");
        const symbol = Array.isArray(data?.htmlCode) && data.htmlCode.length
          ? data.htmlCode.map((code) => {
              const span = document.createElement("span");
              span.innerHTML = code;
              return span.textContent || "";
            }).join("")
          : (data?.unicode || []).join(" ");
        if (!symbol) throw new Error("表情服务没有返回结果");
        renderApiResult("emoji", {
          title: `${symbol} ${data.name || "emoji"}`,
          meta: "EmojiHub",
          rows: [
            { label: "分类", value: data.category },
            { label: "分组", value: data.group },
            { label: "Unicode", value: (data.unicode || []).join(" / ") },
          ],
        });
      },
      qrcode: async (formData) => {
        const text = cleanText(formData.get("text"));
        if (!text) throw new Error("请输入要编码的文本或链接");
        if (text.length > 800) throw new Error("文本太长，建议控制在 800 字符以内");
        const src = `https://quickchart.io/qr?size=220&margin=2&text=${encodeURIComponent(text)}`;
        renderApiResult("qrcode", {
          title: "二维码已生成",
          meta: "QuickChart QR",
          summary: shortText(text, 180),
          image: { src, alt: "QR code" },
          link: { href: src, label: "打开二维码图片" },
          rows: [
            { label: "字符数", value: `${text.length} 个` },
            { label: "图片尺寸", value: "220 x 220" },
          ],
        });
      },
      jokes: async (formData) => {
        const category = cleanText(formData.get("category")) || "Programming";
        const type = cleanText(formData.get("type")) || "single";
        const params = new URLSearchParams({
          blacklistFlags: "nsfw,religious,political,racist,sexist,explicit",
          type,
        });
        const data = await fetchJsonWithTimeout(`https://v2.jokeapi.dev/joke/${encodeURIComponent(category)}?${params.toString()}`);
        if (data?.error) throw new Error(data.message || "笑话接口返回错误");
        const text = data.type === "twopart" ? `${data.setup}\n${data.delivery}` : data.joke;
        if (!text) throw new Error("没有拿到笑话文本");
        renderApiResult("jokes", {
          title: data.category || category,
          meta: "JokeAPI",
          summary: text,
          rows: [
            { label: "类型", value: data.type === "twopart" ? "问答" : "单句" },
            { label: "安全过滤", value: "已过滤敏感 flags" },
            { label: "语言", value: data.lang || "en" },
          ],
        });
      },
      randomuser: async (formData) => {
        const nat = cleanText(formData.get("nat")).toLowerCase() || "us";
        const data = await fetchJsonWithTimeout(`https://randomuser.me/api/?nat=${encodeURIComponent(nat)}&results=1&noinfo`);
        const user = data?.results?.[0];
        if (!user) throw new Error("没有生成用户资料");
        const fullName = [user.name?.title, user.name?.first, user.name?.last].filter(Boolean).join(" ");
        renderApiResult("randomuser", {
          title: fullName,
          meta: "RandomUser",
          image: user.picture?.large ? { src: user.picture.large, alt: fullName } : null,
          rows: [
            { label: "性别", value: user.gender },
            { label: "邮箱", value: user.email },
            { label: "城市", value: compactJoin([user.location?.city, user.location?.country], " · ") },
            { label: "用户名", value: user.login?.username },
          ],
          note: "生成的是测试资料，不代表真实身份。",
        });
      },
      nameprofile: async (formData) => {
        const name = cleanText(formData.get("name")).toLowerCase();
        if (!/^[a-z][a-z -]{0,40}$/i.test(name)) throw new Error("请输入英文名");
        const [age, gender, nation] = await Promise.all([
          fetchJsonWithTimeout(`https://api.agify.io?name=${encodeURIComponent(name)}`),
          fetchJsonWithTimeout(`https://api.genderize.io?name=${encodeURIComponent(name)}`),
          fetchJsonWithTimeout(`https://api.nationalize.io?name=${encodeURIComponent(name)}`),
        ]);
        const countries = (nation?.country || []).slice(0, 5);
        renderApiResult("nameprofile", {
          title: titleCase(name),
          meta: "Agify · Genderize · Nationalize",
          rows: [
            { label: "估计年龄", value: age?.age ? `${age.age} 岁` : "未返回" },
            { label: "年龄样本", value: age?.count ? `${formatNumber(age.count, 0)} 条` : "" },
            { label: "性别倾向", value: gender?.gender ? `${gender.gender} · ${formatNumber((gender.probability || 0) * 100, 1)}%` : "未返回" },
            { label: "国籍候选", value: countries[0]?.country_id ? `${countries[0].country_id} · ${formatNumber(countries[0].probability * 100, 1)}%` : "未返回" },
          ],
          sections: [{
            title: "国籍概率",
            items: countries.map((item) => ({
              label: item.country_id,
              value: `${formatNumber(item.probability * 100, 1)}%`,
            })),
          }],
          note: "这是按公开姓名统计做出的概率估计，不适合用于身份判断。",
        });
      },
      gamedeals: async (formData) => {
        const title = cleanText(formData.get("title"));
        const price = Number(formData.get("price") || 15);
        if (!title) throw new Error("请输入游戏名");
        if (!Number.isFinite(price) || price < 0) throw new Error("请输入有效价格");
        const data = await fetchJsonWithTimeout(`https://www.cheapshark.com/api/1.0/deals?storeID=1&title=${encodeURIComponent(title)}&upperPrice=${encodeURIComponent(price)}&pageSize=5`);
        const deals = Array.isArray(data) ? data : [];
        if (!deals.length) throw new Error("没有找到符合条件的折扣");
        const top = deals[0];
        renderApiResult("gamedeals", {
          title: top.title,
          meta: "CheapShark · Steam deals",
          image: top.thumb ? { src: top.thumb, alt: top.title } : null,
          rows: [
            { label: "现价", value: `$${top.salePrice}` },
            { label: "原价", value: `$${top.normalPrice}` },
            { label: "折扣", value: top.savings ? `${formatNumber(top.savings, 0)}%` : "" },
            { label: "评分", value: top.steamRatingPercent ? `${top.steamRatingPercent}%` : "" },
          ],
          sections: [{
            title: "候选折扣",
            items: deals.map((item) => ({
              label: `$${item.salePrice} / $${item.normalPrice}`,
              value: item.title,
              meta: item.savings ? `节省 ${formatNumber(item.savings, 0)}%` : "",
            })),
          }],
        });
      },
      freegames: async (formData) => {
        const platform = cleanText(formData.get("platform")) || "browser";
        const category = cleanText(formData.get("category")) || "shooter";
        const data = await fetchJsonWithTimeout(`https://www.freetogame.com/api/games?platform=${encodeURIComponent(platform)}&category=${encodeURIComponent(category)}`);
        const games = Array.isArray(data) ? data.slice(0, 6) : [];
        if (!games.length) throw new Error("没有找到免费游戏");
        const first = games[0];
        renderApiResult("freegames", {
          title: first.title,
          meta: `FreeToGame · ${titleCase(platform)} · ${titleCase(category)}`,
          summary: shortText(first.short_description, 180),
          image: first.thumbnail ? { src: first.thumbnail, alt: first.title } : null,
          link: first.game_url ? { href: first.game_url, label: "打开游戏页面" } : null,
          rows: [
            { label: "平台", value: first.platform },
            { label: "类型", value: first.genre },
            { label: "发行商", value: first.publisher },
            { label: "发布日期", value: first.release_date },
          ],
          sections: [{
            title: "更多免费游戏",
            items: games.map((item) => ({
              label: compactJoin([item.genre, item.platform], " · "),
              value: item.title,
              meta: shortText(item.short_description, 90),
            })),
          }],
        });
      },
      giveaways: async (formData) => {
        const platform = cleanText(formData.get("platform")) || "pc";
        const data = await fetchJsonWithTimeout(`https://www.gamerpower.com/api/giveaways?platform=${encodeURIComponent(platform)}&type=game`);
        const items = Array.isArray(data) ? data.slice(0, 6) : [];
        if (!items.length) throw new Error("没有找到当前限免赠品");
        const first = items[0];
        renderApiResult("giveaways", {
          title: first.title,
          meta: `GamerPower · ${platform}`,
          summary: shortText(first.description, 200),
          image: first.thumbnail ? { src: first.thumbnail, alt: first.title } : null,
          link: first.open_giveaway_url ? { href: first.open_giveaway_url, label: "打开领取页" } : null,
          rows: [
            { label: "价值", value: first.worth },
            { label: "平台", value: first.platforms },
            { label: "结束时间", value: first.end_date },
            { label: "状态", value: first.status },
          ],
          sections: [{
            title: "更多限免",
            items: items.map((item) => ({
              label: compactJoin([item.worth, item.platforms], " · "),
              value: item.title,
              meta: item.end_date ? `结束：${item.end_date}` : item.status,
            })),
          }],
        });
      },
      spaceNews: async (formData) => {
        const query = cleanText(formData.get("query"));
        if (!query) throw new Error("请输入航天新闻关键词");
        const data = await fetchJsonWithTimeout(`https://api.spaceflightnewsapi.net/v4/articles/?limit=5&search=${encodeURIComponent(query)}`);
        const articles = data?.results || [];
        if (!articles.length) throw new Error("没有找到航天新闻");
        const top = articles[0];
        renderApiResult("spaceNews", {
          title: top.title,
          meta: "Spaceflight News",
          summary: shortText(top.summary, 240),
          image: top.image_url ? { src: top.image_url, alt: top.title } : null,
          link: top.url ? { href: top.url, label: "打开原文" } : null,
          rows: [
            { label: "来源", value: top.news_site },
            { label: "发布时间", value: formatDateTime(top.published_at) },
            { label: "匹配数量", value: data?.count ? `${formatNumber(data.count, 0)} 条` : "" },
          ],
          sections: [{
            title: "相关新闻",
            items: articles.map((item) => ({
              label: compactJoin([item.news_site, formatDateTime(item.published_at)], " · "),
              value: item.title,
              meta: shortText(item.summary, 110),
            })),
          }],
        });
      },
      launches: async () => {
        const data = await fetchJsonWithTimeout("https://ll.thespacedevs.com/2.2.0/launch/upcoming/?limit=5&mode=list");
        const launches = data?.results || [];
        if (!launches.length) throw new Error("没有找到近期发射任务");
        const next = launches[0];
        renderApiResult("launches", {
          title: next.name,
          meta: "Launch Library 2",
          summary: next.mission?.description ? shortText(next.mission.description, 220) : "",
          rows: [
            { label: "窗口时间", value: formatDateTime(next.window_start || next.net) },
            { label: "状态", value: next.status?.name },
            { label: "发射服务商", value: next.launch_service_provider?.name },
            { label: "发射场", value: next.pad?.name },
          ],
          sections: [{
            title: "近期任务",
            items: launches.map((item) => ({
              label: compactJoin([formatDateTime(item.window_start || item.net), item.status?.name], " · "),
              value: item.name,
              meta: item.pad?.location?.name || item.launch_service_provider?.name,
            })),
          }],
        });
      },
      nobel: async (formData) => {
        const year = Number(formData.get("year") || 2024);
        const category = cleanText(formData.get("category"));
        if (!Number.isInteger(year) || year < 1901 || year > 2026) throw new Error("请输入 1901 到 2026 之间的年份");
        const params = new URLSearchParams({ nobelPrizeYear: String(year) });
        if (category) params.set("nobelPrizeCategory", category);
        const data = await fetchJsonWithTimeout(`https://api.nobelprize.org/2.1/nobelPrizes?${params.toString()}`);
        const prizes = data?.nobelPrizes || [];
        if (!prizes.length) throw new Error("没有找到该年份/奖项的诺贝尔奖记录");
        const first = prizes[0];
        const laureates = prizes.flatMap((prize) => prize.laureates || []);
        renderApiResult("nobel", {
          title: `${year} · ${first.categoryFullName?.en || first.category?.en}`,
          meta: "Nobel Prize API",
          rows: [
            { label: "奖项数", value: `${prizes.length} 项` },
            { label: "获奖者数", value: `${laureates.length} 位/组` },
            { label: "奖金", value: first.prizeAmount ? `${formatNumber(first.prizeAmount, 0)} SEK` : "" },
          ],
          sections: [{
            title: "获奖记录",
            items: prizes.map((prize) => ({
              label: prize.category?.en,
              value: (prize.laureates || []).map((item) => item.knownName?.en || item.orgName?.en || item.fullName?.en).filter(Boolean).join("、") || "未列出",
              meta: shortText((prize.laureates || []).map((item) => item.motivation?.en).filter(Boolean).join(" / "), 160),
            })),
          }],
        });
      },
      openalex: async (formData) => {
        const query = cleanText(formData.get("query"));
        if (!query) throw new Error("请输入学术关键词");
        const data = await fetchJsonWithTimeout(`https://api.openalex.org/works?search=${encodeURIComponent(query)}&per-page=5&select=id,display_name,publication_year,cited_by_count,authorships,primary_location`);
        const works = data?.results || [];
        if (!works.length) throw new Error("没有找到学术记录");
        const first = works[0];
        const authors = (first.authorships || []).map((item) => item.author?.display_name).filter(Boolean).slice(0, 3);
        renderApiResult("openalex", {
          title: first.display_name,
          meta: "OpenAlex",
          link: first.id ? { href: first.id, label: "打开 OpenAlex 记录" } : null,
          rows: [
            { label: "年份", value: first.publication_year },
            { label: "引用数", value: formatNumber(first.cited_by_count, 0) },
            { label: "作者", value: authors.join("、") },
            { label: "来源", value: first.primary_location?.source?.display_name },
          ],
          sections: [{
            title: "相关论文",
            items: works.map((item) => ({
              label: compactJoin([item.publication_year, item.cited_by_count ? `${formatNumber(item.cited_by_count, 0)} 引用` : ""], " · "),
              value: item.display_name,
              meta: (item.authorships || []).map((entry) => entry.author?.display_name).filter(Boolean).slice(0, 3).join("、"),
            })),
          }],
        });
      },
      species: async (formData) => {
        const query = cleanText(formData.get("query"));
        if (!query) throw new Error("请输入物种关键词");
        const data = await fetchJsonWithTimeout(`https://api.gbif.org/v1/species/search?q=${encodeURIComponent(query)}&limit=6`);
        const items = data?.results || [];
        if (!items.length) throw new Error("没有找到物种记录");
        const first = items[0];
        renderApiResult("species", {
          title: first.scientificName || first.canonicalName || query,
          meta: "GBIF",
          rows: [
            { label: "分类等级", value: first.rank },
            { label: "界", value: first.kingdom },
            { label: "科", value: first.family },
            { label: "状态", value: first.taxonomicStatus },
            { label: "匹配数量", value: data.count ? `${formatNumber(data.count, 0)} 条` : "" },
          ],
          chips: [first.phylum, first.class, first.order, first.genus, first.species].filter(Boolean),
          sections: [{
            title: "候选物种",
            items: items.map((item) => ({
              label: compactJoin([item.rank, item.taxonomicStatus], " · "),
              value: item.scientificName || item.canonicalName,
              meta: compactJoin([item.kingdom, item.family], " · "),
            })),
          }],
        });
      },
      radio: async (formData) => {
        const query = cleanText(formData.get("query"));
        if (!query) throw new Error("请输入电台关键词");
        const data = await fetchJsonWithTimeout(`https://de1.api.radio-browser.info/json/stations/search?name=${encodeURIComponent(query)}&limit=10&hidebroken=true&order=clickcount&reverse=true`);
        const stations = Array.isArray(data) ? data : [];
        const playable = stations.find((item) => cleanText(item.url_resolved || item.url).startsWith("https://")) || stations[0];
        if (!playable) throw new Error("没有找到电台");
        const audioUrl = cleanText(playable.url_resolved || playable.url);
        renderApiResult("radio", {
          title: playable.name,
          meta: "Radio Browser",
          rows: [
            { label: "国家", value: compactJoin([playable.country, playable.countrycode], " · ") },
            { label: "语言", value: playable.language },
            { label: "码率", value: playable.bitrate ? `${playable.bitrate} kbps` : "" },
            { label: "点击量", value: formatNumber(playable.clickcount, 0) },
          ],
          chips: cleanText(playable.tags).split(",").slice(0, 10),
          audio: audioUrl.startsWith("https://") ? audioUrl : "",
          link: playable.homepage ? { href: playable.homepage, label: "打开电台主页" } : null,
          sections: [{
            title: "候选电台",
            items: stations.slice(0, 6).map((item) => ({
              label: compactJoin([item.countrycode, item.bitrate ? `${item.bitrate} kbps` : ""], " · "),
              value: item.name,
              meta: cleanText(item.tags).split(",").slice(0, 4).join("、"),
            })),
          }],
          note: audioUrl.startsWith("https://") ? "音频不会自动播放，需要手动点击播放。" : "该电台只返回非 HTTPS 音频流，当前页面不直接播放以避免混合内容。",
        });
      },
      catfacts: async () => {
        const data = await fetchJsonWithTimeout("https://catfact.ninja/fact");
        if (!data?.fact) throw new Error("没有拿到猫冷知识");
        renderApiResult("catfacts", {
          title: "猫冷知识",
          meta: "Catfact Ninja",
          summary: data.fact,
          rows: [
            { label: "字符数", value: data.length ? `${data.length} 个` : "" },
            { label: "语言", value: "English" },
          ],
        });
      },
      sunlight: async (formData) => {
        const lat = Number(formData.get("lat"));
        const lng = Number(formData.get("lng"));
        const date = cleanText(formData.get("date")) || "today";
        if (!Number.isFinite(lat) || lat < -90 || lat > 90) throw new Error("纬度需要在 -90 到 90 之间");
        if (!Number.isFinite(lng) || lng < -180 || lng > 180) throw new Error("经度需要在 -180 到 180 之间");
        const data = await fetchJsonWithTimeout(`https://api.sunrise-sunset.org/json?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}&date=${encodeURIComponent(date)}&formatted=0`);
        const result = data?.results;
        if (data?.status !== "OK" || !result) throw new Error("日照服务没有返回可用数据");
        renderApiResult("sunlight", {
          title: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
          meta: "Sunrise Sunset",
          rows: [
            { label: "日出", value: formatDateTime(result.sunrise) },
            { label: "日落", value: formatDateTime(result.sunset) },
            { label: "正午", value: formatDateTime(result.solar_noon) },
            { label: "昼长", value: formatDuration(result.day_length) },
          ],
          sections: [{
            title: "晨昏线",
            items: [
              { label: "民用晨光", value: formatDateTime(result.civil_twilight_begin), meta: `结束 ${formatDateTime(result.civil_twilight_end)}` },
              { label: "航海晨光", value: formatDateTime(result.nautical_twilight_begin), meta: `结束 ${formatDateTime(result.nautical_twilight_end)}` },
              { label: "天文晨光", value: formatDateTime(result.astronomical_twilight_begin), meta: `结束 ${formatDateTime(result.astronomical_twilight_end)}` },
            ],
          }],
          note: "时间按当前浏览器时区显示。",
        });
      },
      uselessfacts: async () => {
        const data = await fetchJsonWithTimeout("https://uselessfacts.jsph.pl/api/v2/facts/random?language=en");
        if (!data?.text) throw new Error("没有拿到冷知识");
        renderApiResult("uselessfacts", {
          title: "无用冷知识",
          meta: "Useless Facts",
          summary: data.text,
          rows: [
            { label: "语言", value: data.language || "en" },
            { label: "来源", value: data.source },
          ],
          link: data.source_url ? { href: data.source_url, label: "查看来源" } : null,
        });
      },
      icefire: async (formData) => {
        const name = cleanText(formData.get("name"));
        if (!name) throw new Error("请输入角色名");
        const data = await fetchJsonWithTimeout(`https://anapioficeandfire.com/api/characters?name=${encodeURIComponent(name)}`);
        const characters = Array.isArray(data) ? data : [];
        const character = characters.find((item) => cleanText(item.name).toLowerCase() === name.toLowerCase()) || characters[0];
        if (!character) throw new Error("没有找到角色");
        const aliases = (character.aliases || []).map(cleanText).filter((item) => item && item !== character.name);
        const title = character.name || aliases[0] || name;
        renderApiResult("icefire", {
          title,
          meta: "An API of Ice and Fire",
          rows: [
            { label: "性别", value: character.gender },
            { label: "文化", value: character.culture },
            { label: "出生", value: character.born },
            { label: "死亡", value: character.died || "未列出" },
            { label: "登场书籍", value: character.books?.length ? `${character.books.length} 本` : "" },
          ],
          chips: [...(character.titles || []), ...aliases].filter(Boolean).slice(0, 12),
          sections: [{
            title: "更多匹配",
            items: characters.slice(0, 6).map((item) => ({
              label: item.gender || "角色",
              value: item.name || (item.aliases || []).find(Boolean) || "未命名角色",
              meta: compactJoin([item.culture, item.born], " · "),
            })),
          }],
          link: character.url ? { href: character.url, label: "打开 API 记录" } : null,
        });
      },
      rickmorty: async (formData) => {
        const query = cleanText(formData.get("query"));
        if (!query) throw new Error("请输入角色关键词");
        const data = await fetchJsonWithTimeout(`https://rickandmortyapi.com/api/character/?name=${encodeURIComponent(query)}`);
        const characters = data?.results || [];
        const character = characters[0];
        if (!character) throw new Error("没有找到角色");
        renderApiResult("rickmorty", {
          title: character.name,
          meta: "Rick and Morty API",
          image: character.image ? { src: character.image, alt: character.name } : null,
          rows: [
            { label: "状态", value: character.status },
            { label: "物种", value: character.species },
            { label: "性别", value: character.gender },
            { label: "来源", value: character.origin?.name },
            { label: "地点", value: character.location?.name },
            { label: "集数", value: character.episode?.length ? `${character.episode.length} 集` : "" },
          ],
          chips: characters.slice(1, 10).map((item) => item.name),
          sections: [{
            title: "候选角色",
            items: characters.slice(0, 6).map((item) => ({
              label: compactJoin([item.status, item.species], " · "),
              value: item.name,
              meta: item.location?.name,
            })),
          }],
          link: character.url ? { href: character.url, label: "打开 API 记录" } : null,
          note: data?.info?.count ? `共匹配 ${formatNumber(data.info.count, 0)} 个角色。` : "",
        });
      },
      musicSuggest: async (formData) => {
        const query = cleanText(formData.get("query"));
        if (!query) throw new Error("请输入音乐关键词");
        const data = await fetchJsonWithTimeout(`https://verome-api.deno.dev/api/search/suggestions?q=${encodeURIComponent(query)}`);
        const suggestions = Array.isArray(data?.suggestions) ? data.suggestions : [];
        if (!suggestions.length) throw new Error("没有找到音乐联想");
        renderApiResult("musicSuggest", {
          title: query,
          meta: "Verome API · suggestions",
          rows: [
            { label: "联想数量", value: `${suggestions.length} 条` },
            { label: "数据类型", value: "音乐搜索建议" },
          ],
          chips: suggestions.slice(0, 10),
          sections: [{
            title: "建议列表",
            items: suggestions.slice(0, 8).map((item, index) => ({
              label: `#${index + 1}`,
              value: item,
            })),
          }],
        });
      },
      virtualface: async () => {
        renderApiResult("virtualface", {
          title: "随机虚拟人像",
          meta: "This Person Does Not Exist",
          image: {
            src: `https://thispersondoesnotexist.com/?${Date.now()}`,
            alt: "AI generated face",
          },
          rows: [
            { label: "类型", value: "AI 生成图像" },
            { label: "尺寸", value: "通常 1024 × 1024" },
          ],
          note: "这是一张随机生成的人像。",
        });
      },
    };
    apiLab.addEventListener("click", (event) => {
      const translateButton = event.target.closest("[data-api-translate]");
      if (translateButton) {
        const result = translateButton.closest(".api-result");
        const output = result?.querySelector("[data-api-translation]");
        const text = result?.dataset.translateText || "";
        if (!result || !output || !text) return;
        output.hidden = false;
        output.classList.remove("is-error");
        output.innerHTML = "<span>正在翻译</span><p>请稍等。</p>";
        translateButton.disabled = true;
        translateButton.textContent = "翻译中";
        translateTextToChinese(text)
          .then((translation) => {
            output.innerHTML = `<span>${escapeHtml(translation.provider)} · 中文翻译</span><p>${escapeHtml(translation.text)}</p>`;
            translateButton.textContent = "重新翻译";
          })
          .catch((error) => {
            output.classList.add("is-error");
            output.innerHTML = `<span>翻译失败</span><p>${escapeHtml(error?.message || "翻译服务暂时不可用")}</p>`;
            translateButton.textContent = "重试翻译";
          })
          .finally(() => {
            translateButton.disabled = false;
          });
        return;
      }
      const choice = event.target.closest("[data-trivia-choice]");
      if (!choice) return;
      const result = choice.closest(".api-result");
      const group = choice.closest(".api-choice-grid");
      const feedback = result?.querySelector("[data-trivia-feedback]");
      const isCorrect = choice.dataset.correct === "true";
      group?.querySelectorAll("[data-trivia-choice]").forEach((button) => {
        button.disabled = true;
        button.classList.toggle("is-correct", button.dataset.correct === "true");
      });
      if (!isCorrect) choice.classList.add("is-wrong");
      if (feedback) feedback.textContent = isCorrect ? "答对了。" : "答错了，正确答案已标出。";
    });
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
    const cardVideo = card.querySelector(".post-card-video");
    if (cardVideo) {
      cardVideo.pause();
      cardVideo.currentTime = 0;
      const playCardVideo = () => {
        if (reduceMotion || coarsePointer) return;
        hydrateVideo(cardVideo);
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

  document.querySelectorAll(".post-hero-video[data-lazy-video='true'], .module-intro-video[data-lazy-video='true'], .search-panel-video[data-lazy-video='true']").forEach((video) => {
    if (reduceMotion || coarsePointer) return;
    const playAmbientVideo = () => {
      hydrateVideo(video);
      video.play().catch(() => {});
    };
    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          playAmbientVideo();
          observer.unobserve(video);
        });
      }, { rootMargin: "160px" });
      observer.observe(video);
    } else {
      playAmbientVideo();
    }
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
