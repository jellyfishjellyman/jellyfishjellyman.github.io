(function () {
  const root = document.querySelector("[data-arcade-game]");
  const board = document.getElementById("arcadeBoard");
  const scoreEl = document.getElementById("arcadeScore");
  const statEl = document.getElementById("arcadeStat");
  const bestEl = document.getElementById("arcadeBest");
  const startBtn = document.getElementById("arcadeStart");
  const modeBtn = document.getElementById("arcadeMode");
  const hintEl = document.getElementById("arcadeHint");

  if (!root || !board || !scoreEl || !statEl || !bestEl || !startBtn || !modeBtn || !hintEl) return;

  const game = root.dataset.arcadeGame;
  const bestKey = `jellyfish-arcade-best-${game}`;
  let cleanup = () => {};

  const setText = (score, stat, hint) => {
    scoreEl.textContent = String(score);
    statEl.textContent = String(stat);
    bestEl.textContent = localStorage.getItem(bestKey) || "-";
    if (hint) hintEl.textContent = hint;
  };

  const saveBest = (value) => {
    const current = Number(localStorage.getItem(bestKey) || 0);
    if (!current || value > current) localStorage.setItem(bestKey, String(value));
    bestEl.textContent = localStorage.getItem(bestKey) || "-";
  };

  const resetBoard = (className) => {
    cleanup();
    board.className = `arcade-board ${className}`;
    board.innerHTML = "";
    cleanup = () => {};
  };

  const makeCanvas = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 900;
    canvas.height = 560;
    canvas.className = "arcade-canvas";
    board.appendChild(canvas);
    return { canvas, ctx: canvas.getContext("2d") };
  };

  const startJump = () => {
    resetBoard("jump-board");
    const { canvas, ctx } = makeCanvas();
    let score = 0;
    let power = 0;
    let charging = false;
    let player = { x: 170, y: 382 };
    let target = nextPlatform();
    let raf = 0;

    function nextPlatform() {
      return {
        x: 440 + Math.random() * 270,
        y: 300 + Math.random() * 140,
        r: 42 + Math.random() * 20,
      };
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const bg = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      bg.addColorStop(0, "#f8fffb");
      bg.addColorStop(.55, "#eefcff");
      bg.addColorStop(1, "#fff5fb");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = "rgba(40,120,107,.12)";
      for (let x = 0; x < canvas.width; x += 40) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
      }
      drawPlatform(170, 400, 52, "#c7f5dc");
      drawPlatform(target.x, target.y, target.r, "#fff2fb");
      ctx.fillStyle = "rgba(40,120,107,.85)";
      ctx.beginPath();
      ctx.arc(player.x, player.y - (charging ? power * .16 : 0), 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(189,93,54,.86)";
      ctx.fillRect(46, 486, Math.min(power, 100) * 3, 12);
      ctx.fillStyle = "rgba(23,32,27,.62)";
      ctx.font = "700 18px system-ui";
      ctx.fillText("按住蓄力，松开起跳", 46, 462);
      if (charging) {
        power = Math.min(100, power + 1.35);
        raf = requestAnimationFrame(draw);
      }
    }

    function drawPlatform(x, y, r, color) {
      ctx.fillStyle = "rgba(44,42,35,.12)";
      ctx.beginPath();
      ctx.ellipse(x + 4, y + 12, r * 1.15, r * .4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.ellipse(x, y, r, r * .36, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(40,120,107,.28)";
      ctx.stroke();
    }

    function release() {
      if (!charging) return;
      charging = false;
      cancelAnimationFrame(raf);
      const dx = target.x - 170;
      const dy = target.y - 400;
      const need = Math.sqrt(dx * dx + dy * dy) / 6.8;
      const diff = Math.abs(power - need);
      if (diff < 13) {
        score += diff < 5 ? 2 : 1;
        saveBest(score);
        player = { x: target.x, y: target.y - 18 };
        setText(score, Math.round(power), diff < 5 ? "漂亮，落在中心附近。" : "成功落地。");
        window.setTimeout(() => {
          player = { x: 170, y: 382 };
          target = nextPlatform();
          power = 0;
          draw();
        }, 360);
      } else {
        setText(score, Math.round(power), "力度偏了，重新开始。");
        score = 0;
        power = 0;
        window.setTimeout(draw, 360);
      }
    }

    const press = () => { if (!charging) { charging = true; power = 0; draw(); } };
    canvas.addEventListener("pointerdown", press);
    window.addEventListener("pointerup", release);
    cleanup = () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointerup", release);
    };
    setText(0, 0, "按住画面蓄力，松开跳跃。");
    draw();
  };

  const startSnake = () => {
    resetBoard("snake-board");
    const { canvas, ctx } = makeCanvas();
    const cols = 24;
    const rows = 15;
    let snake = [{ x: 6, y: 7 }, { x: 5, y: 7 }];
    let dir = { x: 1, y: 0 };
    let nextDir = dir;
    let food = spawnFood();
    let score = 2;
    let running = true;
    let timer = 0;
    let startTouch = null;

    function spawnFood() {
      let p;
      do {
        p = { x: Math.floor(Math.random() * cols), y: Math.floor(Math.random() * rows) };
      } while (snake.some((s) => s.x === p.x && s.y === p.y));
      return p;
    }

    function draw() {
      const w = canvas.width / cols;
      const h = canvas.height / rows;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#f8fffb";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = "rgba(40,120,107,.1)";
      for (let x = 0; x <= cols; x += 1) { ctx.beginPath(); ctx.moveTo(x * w, 0); ctx.lineTo(x * w, canvas.height); ctx.stroke(); }
      for (let y = 0; y <= rows; y += 1) { ctx.beginPath(); ctx.moveTo(0, y * h); ctx.lineTo(canvas.width, y * h); ctx.stroke(); }
      ctx.fillStyle = "#bd5d36";
      ctx.beginPath(); ctx.arc((food.x + .5) * w, (food.y + .5) * h, Math.min(w, h) * .28, 0, Math.PI * 2); ctx.fill();
      snake.forEach((s, i) => {
        ctx.fillStyle = i ? "rgba(40,120,107,.76)" : "#28786b";
        ctx.fillRect(s.x * w + 3, s.y * h + 3, w - 6, h - 6);
      });
    }

    function tick() {
      if (!running) return;
      dir = nextDir;
      const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
      const hitWall = head.x < 0 || head.y < 0 || head.x >= cols || head.y >= rows;
      const hitSelf = snake.some((s) => s.x === head.x && s.y === head.y);
      if (hitWall || hitSelf) {
        running = false;
        setText(score, "结束", "撞到了，点击开始重来。");
        saveBest(score);
        return;
      }
      snake.unshift(head);
      if (head.x === food.x && head.y === food.y) {
        score += 1;
        food = spawnFood();
      } else {
        snake.pop();
      }
      setText(score, "普通", "方向键或滑动控制。");
      draw();
    }

    function setDir(x, y) {
      if (dir.x + x === 0 && dir.y + y === 0) return;
      nextDir = { x, y };
    }

    const key = (event) => {
      if (event.key === "ArrowUp") setDir(0, -1);
      if (event.key === "ArrowDown") setDir(0, 1);
      if (event.key === "ArrowLeft") setDir(-1, 0);
      if (event.key === "ArrowRight") setDir(1, 0);
    };
    const touchStart = (event) => { startTouch = event.changedTouches[0]; };
    const touchEnd = (event) => {
      if (!startTouch) return;
      const t = event.changedTouches[0];
      const dx = t.clientX - startTouch.clientX;
      const dy = t.clientY - startTouch.clientY;
      if (Math.abs(dx) > Math.abs(dy)) setDir(dx > 0 ? 1 : -1, 0);
      else setDir(0, dy > 0 ? 1 : -1);
    };

    window.addEventListener("keydown", key);
    canvas.addEventListener("touchstart", touchStart, { passive: true });
    canvas.addEventListener("touchend", touchEnd, { passive: true });
    timer = window.setInterval(tick, 150);
    cleanup = () => {
      window.clearInterval(timer);
      window.removeEventListener("keydown", key);
    };
    setText(score, "普通", "方向键或滑动控制。");
    draw();
  };

  const startLinkMatch = () => {
    resetBoard("link-board");
    const size = 8;
    const symbols = ["月", "星", "海", "云", "花", "书", "灯", "雨", "糖", "叶", "风", "梦"];
    const inner = [];
    symbols.forEach((s) => inner.push(s, s));
    while (inner.length < 36) inner.push(...symbols.slice(0, 6));
    inner.length = 36;
    inner.sort(() => Math.random() - .5);
    let cells = Array.from({ length: size * size }, (_, i) => {
      const x = i % size;
      const y = Math.floor(i / size);
      if (!x || !y || x === size - 1 || y === size - 1) return "";
      return inner.shift();
    });
    let selected = -1;
    let matched = 0;

    const index = (x, y) => y * size + x;
    const point = (i) => ({ x: i % size, y: Math.floor(i / size) });
    const empty = (i) => cells[i] === "";
    const clearLine = (a, b) => {
      if (a.x !== b.x && a.y !== b.y) return false;
      const dx = Math.sign(b.x - a.x);
      const dy = Math.sign(b.y - a.y);
      let x = a.x + dx;
      let y = a.y + dy;
      while (x !== b.x || y !== b.y) {
        if (!empty(index(x, y))) return false;
        x += dx; y += dy;
      }
      return true;
    };
    const canConnect = (aIndex, bIndex) => {
      const a = point(aIndex);
      const b = point(bIndex);
      if (clearLine(a, b)) return true;
      const p1 = { x: a.x, y: b.y };
      const p2 = { x: b.x, y: a.y };
      if (empty(index(p1.x, p1.y)) && clearLine(a, p1) && clearLine(p1, b)) return true;
      if (empty(index(p2.x, p2.y)) && clearLine(a, p2) && clearLine(p2, b)) return true;
      for (let x = 0; x < size; x += 1) {
        const p = { x, y: a.y };
        const q = { x, y: b.y };
        if (empty(index(p.x, p.y)) && empty(index(q.x, q.y)) && clearLine(a, p) && clearLine(p, q) && clearLine(q, b)) return true;
      }
      for (let y = 0; y < size; y += 1) {
        const p = { x: a.x, y };
        const q = { x: b.x, y };
        if (empty(index(p.x, p.y)) && empty(index(q.x, q.y)) && clearLine(a, p) && clearLine(p, q) && clearLine(q, b)) return true;
      }
      return false;
    };

    function render(hint) {
      board.innerHTML = "";
      board.style.setProperty("--link-size", size);
      cells.forEach((value, i) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "link-tile";
        button.dataset.empty = value ? "false" : "true";
        button.dataset.selected = selected === i ? "true" : "false";
        button.textContent = value;
        button.disabled = !value;
        button.addEventListener("click", () => pick(i));
        board.appendChild(button);
      });
      setText(matched / 2, cells.filter(Boolean).length, hint || "选择两张相同卡片。");
    }

    function pick(i) {
      if (selected < 0) {
        selected = i;
        render("再选一张相同图案。");
        return;
      }
      if (selected === i) {
        selected = -1;
        render("已取消选择。");
        return;
      }
      if (cells[selected] === cells[i] && canConnect(selected, i)) {
        cells[selected] = "";
        cells[i] = "";
        matched += 2;
        selected = -1;
        saveBest(matched / 2);
        render(cells.some(Boolean) ? "连上了，继续找。" : "全部消除完成。");
      } else {
        selected = i;
        render("这两张暂时连不上。");
      }
    }

    render("选择两张相同卡片，路径最多两次转弯。");
  };

  const startQuiz = () => {
    resetBoard("quiz-board");
    const questions = [
      { q: "什么东西越洗越脏？", a: ["水", "毛巾", "肥皂"], ok: 0 },
      { q: "一只船最多能坐十个人，上来九个后又来一个，船为什么没沉？", a: ["因为是潜水艇", "因为船在岸上", "因为第十个是船长"], ok: 1 },
      { q: "哪一种书买不到？", a: ["秘书", "旧书", "电子书"], ok: 0 },
      { q: "什么门永远关不上？", a: ["球门", "木门", "校门"], ok: 0 },
      { q: "什么东西越分享越多？", a: ["秘密", "知识", "冰块"], ok: 1 },
    ];
    let order = questions.map((_, i) => i).sort(() => Math.random() - .5);
    let cursor = 0;
    let score = 0;

    function render(hint) {
      const item = questions[order[cursor]];
      board.innerHTML = "";
      const card = document.createElement("div");
      card.className = "quiz-card";
      card.innerHTML = `<p class=\"eyebrow\">Question ${cursor + 1}/${questions.length}</p><h2>${item.q}</h2>`;
      item.a.forEach((answer, index) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "quiz-option";
        button.textContent = answer;
        button.addEventListener("click", () => choose(index));
        card.appendChild(button);
      });
      board.appendChild(card);
      setText(score, `${cursor + 1}/${questions.length}`, hint || "选择一个答案。");
    }

    function choose(index) {
      const item = questions[order[cursor]];
      if (index === item.ok) score += 1;
      cursor += 1;
      if (cursor >= questions.length) {
        saveBest(score);
        board.innerHTML = `<div class=\"quiz-card\"><p class=\"eyebrow\">Result</p><h2>答对 ${score} / ${questions.length}</h2><p>点击开始可以换一组顺序再来。</p></div>`;
        setText(score, "完成", score >= 4 ? "不错，脑子醒了。" : "再来一轮会更顺。");
      } else {
        render(index === item.ok ? "答对了。" : `答案是：${item.a[item.ok]}`);
      }
    }

    render("选择一个答案。");
  };

  const startPianoTiles = () => {
    resetBoard("piano-board");
    const cols = 4;
    const rows = 6;
    let grid = [];
    let score = 0;
    let speed = 900;
    let running = true;
    let timer = 0;

    const makeRow = () => {
      const row = Array.from({ length: cols }, () => false);
      row[Math.floor(Math.random() * cols)] = true;
      return row;
    };

    const tick = () => {
      if (!running) return;
      const missed = grid[rows - 1]?.some(Boolean);
      if (missed) {
        running = false;
        saveBest(score);
        setText(score, "结束", "黑块滑到底了，点击开始重来。");
        render();
        return;
      }
      grid.pop();
      grid.unshift(makeRow());
      render();
    };

    const hit = (r, c) => {
      if (!running) return;
      if (!grid[r][c]) {
        running = false;
        saveBest(score);
        setText(score, "结束", "踩到白块了。");
        render();
        return;
      }
      grid[r][c] = false;
      score += 1;
      if (score % 8 === 0) {
        speed = Math.max(420, speed - 70);
        window.clearInterval(timer);
        timer = window.setInterval(tick, speed);
      }
      saveBest(score);
      setText(score, `${Math.round(1000 / speed * 10) / 10}x`, "保持节奏，只点深色块。");
      render();
    };

    function render() {
      board.innerHTML = "";
      board.style.setProperty("--piano-cols", cols);
      board.style.setProperty("--piano-rows", rows);
      grid.forEach((row, r) => {
        row.forEach((black, c) => {
          const button = document.createElement("button");
          button.type = "button";
          button.className = "piano-tile";
          button.dataset.black = black ? "true" : "false";
          button.addEventListener("click", () => hit(r, c));
          board.appendChild(button);
        });
      });
    }

    grid = Array.from({ length: rows }, (_, index) => (index < 3 ? makeRow() : Array.from({ length: cols }, () => false)));
    timer = window.setInterval(tick, speed);
    cleanup = () => window.clearInterval(timer);
    setText(0, "1x", "只点击深色块。");
    render();
  };

  const startTileStack = () => {
    resetBoard("stack-board");
    const symbols = ["月", "星", "海", "云", "花", "灯", "书"];
    let deck = [];
    let tray = [];
    let cleared = 0;
    let locked = false;

    const shuffle = (items) => {
      const copy = [...items];
      for (let i = copy.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    };

    const buildDeck = () => {
      const cards = [];
      symbols.forEach((symbol) => {
        cards.push(symbol, symbol, symbol);
        if (Math.random() > .35) cards.push(symbol, symbol, symbol);
      });
      return shuffle(cards).slice(0, 30);
    };

    const compactTray = () => {
      const counts = tray.reduce((map, symbol) => {
        map.set(symbol, (map.get(symbol) || 0) + 1);
        return map;
      }, new Map());
      let removed = false;
      counts.forEach((count, symbol) => {
        if (count >= 3) {
          let left = 3;
          tray = tray.filter((item) => {
            if (item === symbol && left > 0) {
              left -= 1;
              return false;
            }
            return true;
          });
          cleared += 1;
          removed = true;
        }
      });
      return removed;
    };

    const pick = (index) => {
      if (locked || !deck[index]) return;
      tray.push(deck[index]);
      deck.splice(index, 1);
      const removed = compactTray();
      if (deck.length === 0 && tray.length === 0) {
        locked = true;
        saveBest(cleared);
        render("全部清空了。");
        return;
      }
      if (tray.length >= 7) {
        locked = true;
        saveBest(cleared);
        render("槽位满了，点击开始重来。");
        return;
      }
      saveBest(cleared);
      render(removed ? "三张相同已消除。" : "继续凑三张相同。");
    };

    function render(hint) {
      board.innerHTML = "";
      const pile = document.createElement("div");
      pile.className = "stack-pile";
      deck.forEach((symbol, index) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "stack-card";
        button.textContent = symbol;
        button.style.setProperty("--stack-x", `${(index % 6) * 12}px`);
        button.style.setProperty("--stack-y", `${Math.floor(index / 6) * 18}px`);
        button.addEventListener("click", () => pick(index));
        pile.appendChild(button);
      });
      const trayEl = document.createElement("div");
      trayEl.className = "stack-tray";
      Array.from({ length: 7 }).forEach((_, index) => {
        const slot = document.createElement("span");
        slot.textContent = tray[index] || "";
        slot.dataset.empty = tray[index] ? "false" : "true";
        trayEl.appendChild(slot);
      });
      board.append(pile, trayEl);
      setText(cleared, `${tray.length}/7`, hint || "从牌堆取牌，槽位凑三消。");
    }

    deck = buildDeck();
    tray = [];
    cleared = 0;
    setText(0, "0/7", "从牌堆取牌，槽位凑三消。");
    render();
  };

  const starters = {
    jump: startJump,
    snake: startSnake,
    "link-match": startLinkMatch,
    quiz: startQuiz,
    "piano-tiles": startPianoTiles,
    "tile-stack": startTileStack,
  };

  startBtn.addEventListener("click", () => starters[game]?.());
  modeBtn.addEventListener("click", () => {
    hintEl.textContent = "这个小游戏暂时只有普通模式。";
  });
  starters[game]?.();
})();
