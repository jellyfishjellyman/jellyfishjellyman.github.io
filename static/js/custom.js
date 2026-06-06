(function () {
  const root = document.documentElement;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
  const prefersNight = window.matchMedia("(prefers-color-scheme: dark)").matches;

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
  const renderSearch = async () => {
    if (!searchInput || !searchResults) return;
    const query = normalize(searchInput.value);
    if (!query) {
      searchResults.innerHTML = '<div class="search-empty">输入关键词后会在这里显示结果。</div>';
      return;
    }
    const items = await getSearchIndex();
    const terms = query.split(/\s+/).filter(Boolean);
    const matches = items
      .map((item) => {
        const haystack = normalize([item.title, item.section, item.summary, (item.tags || []).join(" ")].join(" "));
        const score = terms.reduce((sum, term) => sum + (haystack.includes(term) ? 1 : 0), 0);
        return { item, score };
      })
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score || String(b.item.date || "").localeCompare(String(a.item.date || "")))
      .slice(0, 6);
    if (!matches.length) {
      searchResults.innerHTML = '<div class="search-empty">暂时没有匹配结果，换个关键词试试。</div>';
      return;
    }
    searchResults.replaceChildren(...matches.map(({ item }) => {
      const link = document.createElement("a");
      const title = document.createElement("strong");
      const summary = document.createElement("span");
      link.className = "search-result";
      link.href = item.url;
      title.textContent = item.title;
      summary.textContent = item.summary || item.section || "站内页面";
      link.append(title, summary);
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
    const nicknameProxyUrl = document.querySelector('meta[name="nickname-proxy"]')?.content || "";
    const guestNamePrefixes = [
      "匿名用户", "路过水母", "云边访客", "夜航纸条", "小站旅人", "漂流星星",
      "月亮邮差", "晚风收藏家", "海盐小熊", "银河值班员", "橘子汽水", "松间听雨",
      "半颗薄荷糖", "玻璃水母", "夜航纸飞机", "小镇观星人", "雨后蘑菇", "蒲公英旅客",
      "星星保管员", "风铃便利店", "奶油小行星", "雾里看花人", "春日逃课生", "蓝莓气泡",
      "猫耳耳机", "雪糕巡逻员", "凌晨三点半", "芝士月球", "晴天备用伞", "不吃香菜星人",
      "便利店诗人", "软糖工程师", "海边旧信箱", "咖啡续命师", "树洞管理员", "云朵修理铺",
      "星河漫游者", "柠檬味晚霞", "蘑菇云游客", "西瓜小电台", "迷路的信号", "夏夜放映员",
      "纸船观察员", "奶茶不加冰", "宇宙小便签", "小熊不营业", "云端打字员", "汽水观察家"
    ];

    const refreshGuestbookStartedAt = () => {
      if (startedAtField) startedAtField.value = String(Date.now());
    };

    const randomGuestName = () => {
      const prefix = guestNamePrefixes[Math.floor(Math.random() * guestNamePrefixes.length)];
      const suffix = String(Math.floor(1000 + Math.random() * 9000));
      return `${prefix}${suffix}`;
    };

    const fetchNickname = async () => {
      if (!nicknameProxyUrl) return "";
      const response = await fetch(nicknameProxyUrl, { cache: "no-store", headers: { Accept: "application/json" } });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "nickname request failed");
      return cleanText(data?.nickname).slice(0, 20);
    };

    const fillRandomGuestName = async () => {
      if (!nameInput) return;
      if (randomNameButton) randomNameButton.disabled = true;
      try {
        nameInput.value = await fetchNickname() || randomGuestName();
      } catch (_) {
        nameInput.value = randomGuestName();
      } finally {
        if (randomNameButton) randomNameButton.disabled = false;
        nameInput.dispatchEvent(new Event("input", { bubbles: true }));
      }
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
