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
    document.body.classList.remove("arcade-lock-scroll");
    document.documentElement.classList.remove("arcade-lock-scroll");
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

  const shuffle = (items) => {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };

  const startJump = () => {
    resetBoard("jump-board");
    const { canvas, ctx } = makeCanvas();
    let score = 0;
    let power = 0;
    let charging = false;
    let animating = false;
    let raf = 0;
    const base = { x: 170, y: 400, r: 58 };
    let player = { x: base.x, y: base.y - 20 };
    let target = nextPlatform();

    function nextPlatform() {
      return {
        x: 350 + Math.random() * 250,
        y: 320 + Math.random() * 96,
        r: 50 + Math.random() * 22,
      };
    }

    function drawPlatform(x, y, r, color) {
      ctx.fillStyle = "rgba(44,42,35,.12)";
      ctx.beginPath();
      ctx.ellipse(x + 5, y + 14, r * 1.16, r * .42, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.ellipse(x, y, r, r * .37, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(40,120,107,.28)";
      ctx.stroke();
    }

    function drawScene() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const bg = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      bg.addColorStop(0, "#f8fffb");
      bg.addColorStop(.55, "#eefcff");
      bg.addColorStop(1, "#fff5fb");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = "rgba(40,120,107,.1)";
      for (let x = 0; x < canvas.width; x += 40) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
      }
      drawPlatform(base.x, base.y, base.r, "#c7f5dc");
      drawPlatform(target.x, target.y, target.r, "#fff2fb");
      ctx.strokeStyle = "rgba(189,93,54,.38)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(target.x, target.y, target.r * .52, target.r * .18, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.lineWidth = 1;
      ctx.fillStyle = "rgba(40,120,107,.88)";
      ctx.beginPath();
      ctx.arc(player.x, player.y - (charging ? power * .12 : 0), 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(189,93,54,.86)";
      ctx.fillRect(46, 486, Math.min(power, 100) * 3, 12);
      ctx.fillStyle = "rgba(23,32,27,.62)";
      ctx.font = "700 18px system-ui";
      ctx.fillText("按住蓄力，松开起跳", 46, 462);
    }

    function drawCharge() {
      if (!charging) return;
      power += 1.05;
      if (power > 100) power = 100;
      setText(score, Math.round(power), "蓄力中，松开起跳。");
      drawScene();
      raf = requestAnimationFrame(drawCharge);
    }

    function animateJump(success, landing) {
      animating = true;
      const start = { ...player };
      const end = success ? { x: target.x, y: target.y - 20 } : landing;
      const startTime = performance.now();
      const duration = 520;
      const frame = (now) => {
        const t = Math.min(1, (now - startTime) / duration);
        const ease = 1 - Math.pow(1 - t, 2);
        player.x = start.x + (end.x - start.x) * ease;
        player.y = start.y + (end.y - start.y) * ease - Math.sin(t * Math.PI) * 120;
        drawScene();
        if (t < 1) {
          raf = requestAnimationFrame(frame);
          return;
        }
        animating = false;
        if (success) {
          window.setTimeout(() => {
            player = { x: base.x, y: base.y - 20 };
            target = nextPlatform();
            power = 0;
            drawScene();
          }, 260);
        } else {
          power = 0;
          score = 0;
          window.setTimeout(() => {
            player = { x: base.x, y: base.y - 20 };
            drawScene();
          }, 420);
        }
      };
      raf = requestAnimationFrame(frame);
    }

    function release() {
      if (!charging || animating) return;
      charging = false;
      canvas.dataset.charging = "false";
      cancelAnimationFrame(raf);
      const dx = target.x - base.x;
      const dy = target.y - base.y;
      const need = Math.sqrt(dx * dx + dy * dy) / 7.6;
      const diff = Math.abs(power - need);
      const tolerance = 22;
      const angle = Math.atan2(dy, dx);
      const travel = power * 7.6;
      const landing = {
        x: base.x + Math.cos(angle) * travel,
        y: base.y + Math.sin(angle) * travel - 20,
      };
      if (diff <= tolerance) {
        score += diff < 8 ? 2 : 1;
        saveBest(score);
        setText(score, `${Math.round(power)}/${Math.round(need)}`, diff < 8 ? "漂亮，落点很稳。" : "成功落地。");
        animateJump(true, landing);
      } else {
        setText(score, `${Math.round(power)}/${Math.round(need)}`, diff > tolerance + 18 ? "差得有点多，试试短按一点。" : "差一点点，再来。");
        animateJump(false, landing);
      }
    }

    const press = (event) => {
      event?.preventDefault?.();
      if (charging || animating) return;
      charging = true;
      canvas.dataset.charging = "true";
      power = 0;
      setText(score, 0, "蓄力中，松开起跳。");
      drawCharge();
    };
    canvas.addEventListener("pointerdown", press);
    canvas.addEventListener("mousedown", press);
    canvas.addEventListener("touchstart", press, { passive: false });
    canvas.addEventListener("pointercancel", release);
    window.addEventListener("pointerup", release);
    window.addEventListener("mouseup", release);
    window.addEventListener("touchend", release);
    cleanup = () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointerup", release);
      window.removeEventListener("mouseup", release);
      window.removeEventListener("touchend", release);
    };
    setText(0, 0, "判定已放宽。按住越久跳得越远。");
    drawScene();
  };

  const startSnake = () => {
    resetBoard("snake-board");
    document.body.classList.add("arcade-lock-scroll");
    document.documentElement.classList.add("arcade-lock-scroll");
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
    const lockedScrollY = window.scrollY;

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
      if (!["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(event.key)) return;
      event.preventDefault();
      event.stopPropagation();
      requestAnimationFrame(() => window.scrollTo(0, lockedScrollY));
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

    window.addEventListener("keydown", key, { capture: true, passive: false });
    document.addEventListener("keydown", key, { capture: true, passive: false });
    canvas.addEventListener("touchstart", touchStart, { passive: true });
    canvas.addEventListener("touchend", touchEnd, { passive: true });
    canvas.focus();
    timer = window.setInterval(tick, 150);
    cleanup = () => {
      document.body.classList.remove("arcade-lock-scroll");
      document.documentElement.classList.remove("arcade-lock-scroll");
      window.clearInterval(timer);
      window.removeEventListener("keydown", key, { capture: true });
      document.removeEventListener("keydown", key, { capture: true });
    };
    setText(score, "普通", "方向键不会再滚动页面。");
    draw();
  };

  const startLinkMatch = () => {
    resetBoard("link-board");
    const size = 8;
    const symbols = ["月", "星", "海", "云", "花", "书", "灯", "雨", "糖", "叶", "风", "梦"];
    let cells = [];
    let selected = -1;
    let matched = 0;
    let clearing = new Set();

    const index = (x, y) => y * size + x;
    const point = (i) => ({ x: i % size, y: Math.floor(i / size) });
    const empty = (i) => cells[i] === "";
    const playableIndexes = () => cells.map((value, i) => value && point(i).x && point(i).y && point(i).x < size - 1 && point(i).y < size - 1 ? i : -1).filter((i) => i >= 0);

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

    const findMove = () => {
      const items = playableIndexes();
      for (let a = 0; a < items.length; a += 1) {
        for (let b = a + 1; b < items.length; b += 1) {
          if (cells[items[a]] === cells[items[b]] && canConnect(items[a], items[b])) return [items[a], items[b]];
        }
      }
      return null;
    };

    const reshuffleRemaining = () => {
      const indexes = playableIndexes();
      const values = shuffle(indexes.map((i) => cells[i]));
      indexes.forEach((cellIndex, i) => { cells[cellIndex] = values[i]; });
      selected = -1;
    };

    const ensureMove = () => {
      let guard = 0;
      while (cells.some(Boolean) && !findMove() && guard < 60) {
        reshuffleRemaining();
        guard += 1;
      }
      return guard > 0;
    };

    const buildCells = () => {
      const values = [];
      while (values.length < 36) {
        const symbol = symbols[Math.floor(Math.random() * symbols.length)];
        values.push(symbol, symbol);
      }
      values.length = 36;
      const shuffled = shuffle(values);
      cells = Array.from({ length: size * size }, (_, i) => {
        const x = i % size;
        const y = Math.floor(i / size);
        if (!x || !y || x === size - 1 || y === size - 1) return "";
        return shuffled.shift();
      });
      ensureMove();
    };

    function render(hint) {
      board.innerHTML = "";
      board.style.setProperty("--link-size", size);
      const move = findMove();
      cells.forEach((value, i) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "link-tile";
        button.dataset.empty = value ? "false" : "true";
        button.dataset.selected = selected === i ? "true" : "false";
        button.dataset.clearing = clearing.has(i) ? "true" : "false";
        button.dataset.hintPair = move && move.includes(i) ? "true" : "false";
        button.textContent = value;
        button.disabled = !value || clearing.size > 0;
        button.addEventListener("click", () => pick(i));
        board.appendChild(button);
      });
      setText(matched / 2, cells.filter(Boolean).length, hint || "选择两张相同卡片。");
    }

    function removePair(a, b) {
      clearing = new Set([a, b]);
      render("连上了。");
      window.setTimeout(() => {
        cells[a] = "";
        cells[b] = "";
        clearing = new Set();
        matched += 2;
        selected = -1;
        saveBest(matched / 2);
        const shuffled = ensureMove();
        render(cells.some(Boolean) ? (shuffled ? "已自动洗牌，保证还有可连的牌。" : "继续找下一组。") : "全部消除完成。");
      }, 220);
    }

    function pick(i) {
      if (clearing.size || !cells[i]) return;
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
        removePair(selected, i);
      } else {
        selected = i;
        render("这两张暂时连不上，已切换选择。");
      }
    }

    buildCells();
    render("开局已检查，若无解会自动洗牌。");
  };

  const startQuiz = () => {
    resetBoard("quiz-board");
    const questions = [
      { q: "什么东西越洗越脏？", a: ["水", "毛巾", "肥皂"], ok: 0 },
      { q: "一只船最多能坐十个人，上来九个后又来一个，船为什么没沉？", a: ["因为船在岸上", "因为是潜水艇", "因为第十个是船长"], ok: 0 },
      { q: "哪一种书买不到？", a: ["秘书", "旧书", "电子书"], ok: 0 },
      { q: "什么门永远关不上？", a: ["球门", "木门", "校门"], ok: 0 },
      { q: "什么东西越分享越多？", a: ["秘密", "知识", "冰块"], ok: 1 },
      { q: "什么东西越用越少，但越少越亮？", a: ["蜡烛", "影子", "镜子"], ok: 0 },
      { q: "什么路最窄？", a: ["冤家路", "山路", "小路"], ok: 0 },
      { q: "什么东西有脚却不会走？", a: ["桌子", "地图", "钟表"], ok: 0 },
      { q: "什么东西越剪越长？", a: ["队伍", "头发", "布"], ok: 0 },
      { q: "什么人每天靠运气吃饭？", a: ["气象员", "司机", "厨师"], ok: 0 },
      { q: "什么字人人都会念错？", a: ["错", "难", "谜"], ok: 0 },
      { q: "什么东西看得见却摸不着？", a: ["影子", "玻璃", "水"], ok: 0 },
      { q: "哪种动物最安静？", a: ["睡着的动物", "乌龟", "鱼"], ok: 0 },
      { q: "什么东西不怕水，却怕太阳？", a: ["雪人", "雨伞", "船"], ok: 0 },
      { q: "什么东西越走越远却不会动？", a: ["时间", "钟", "路灯"], ok: 0 },
      { q: "什么东西能装下世界，却放不进抽屉？", a: ["地图", "箱子", "书包"], ok: 0 },
      { q: "什么东西白天看不见，晚上常出现？", a: ["星星", "云", "太阳"], ok: 0 },
      { q: "什么东西人人都需要，但没人想失去？", a: ["时间", "钱包", "作业"], ok: 0 },
      { q: "什么东西越擦越小？", a: ["橡皮", "桌子", "玻璃"], ok: 0 },
      { q: "什么东西没有嘴却会告诉你时间？", a: ["钟表", "书", "镜子"], ok: 0 },
      { q: "什么东西可以穿过玻璃却不会打碎它？", a: ["光", "石头", "雨"], ok: 0 },
      { q: "什么东西总在前面，却永远到不了？", a: ["未来", "影子", "终点"], ok: 0 },
      { q: "什么东西写出来是黑的，读起来是亮的？", a: ["知识", "墨水", "铅笔"], ok: 0 },
      { q: "什么东西一说出来就打破了？", a: ["沉默", "玻璃", "谜底"], ok: 0 },
      { q: "什么东西越冷越爱出来？", a: ["白气", "汗", "影子"], ok: 0 },
      { q: "什么东西你给别人后，自己仍然拥有？", a: ["建议", "钱", "钥匙"], ok: 0 },
      { q: "什么东西有城市、河流和山，却没有人？", a: ["地图", "照片", "游戏"], ok: 0 },
      { q: "什么东西越等越短？", a: ["倒计时", "路", "影子"], ok: 0 },
      { q: "什么东西没有翅膀却能飞？", a: ["时间", "纸飞机", "鸟"], ok: 0 },
      { q: "什么东西每天都在变，却从不说话？", a: ["天气", "石头", "尺子"], ok: 0 },
    ];
    const roundSize = 10;
    let order = shuffle(questions.map((_, i) => i)).slice(0, roundSize);
    let cursor = 0;
    let score = 0;

    function render(hint) {
      const item = questions[order[cursor]];
      board.innerHTML = "";
      const card = document.createElement("div");
      card.className = "quiz-card";
      card.innerHTML = `<p class="eyebrow">Question ${cursor + 1}/${roundSize}</p><h2>${item.q}</h2>`;
      item.a.forEach((answer, index) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "quiz-option";
        button.textContent = answer;
        button.addEventListener("click", () => choose(index));
        card.appendChild(button);
      });
      board.appendChild(card);
      setText(score, `${cursor + 1}/${roundSize}`, hint || "选择一个答案。");
    }

    function choose(index) {
      const item = questions[order[cursor]];
      const correct = index === item.ok;
      if (correct) score += 1;
      cursor += 1;
      if (cursor >= roundSize) {
        saveBest(score);
        board.innerHTML = `<div class="quiz-card"><p class="eyebrow">Result</p><h2>答对 ${score} / ${roundSize}</h2><p>题库已扩展，每轮随机抽 10 题。</p></div>`;
        setText(score, "完成", score >= 8 ? "不错，脑子醒了。" : "再来一轮会更顺。");
      } else {
        render(correct ? "答对了。" : `答案是：${item.a[item.ok]}`);
      }
    }

    render("题库已扩展，每轮随机抽 10 题。");
  };

  const startPianoTiles = () => {
    resetBoard("piano-board piano-canvas-board");
    const made = makeCanvas();
    const canvas = made.canvas;
    const ctx = made.ctx;
    const cols = 4;
    const visibleRows = 5;
    let score = 0;
    let running = true;
    let raf = 0;
    let lastTime = 0;
    let speed = 86;
    let offset = 0;
    let rows = [];

    const makeRow = (y) => ({ y, hit: false, col: Math.floor(Math.random() * cols) });

    const resetRows = () => {
      rows = [];
      for (let i = -2; i < visibleRows + 1; i += 1) rows.push(makeRow(i));
      rows.forEach((row) => {
        if (row.y >= visibleRows - 1) row.hit = true;
      });
      offset = 0;
    };

    const endGame = (message) => {
      running = false;
      cancelAnimationFrame(raf);
      saveBest(score);
      setText(score, "结束", message);
      draw();
    };

    const draw = () => {
      const w = canvas.width / cols;
      const h = canvas.height / visibleRows;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const bg = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      bg.addColorStop(0, "#fbfffd");
      bg.addColorStop(1, "#fff8fb");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = "rgba(40,120,107,.18)";
      ctx.lineWidth = 2;
      for (let c = 1; c < cols; c += 1) {
        ctx.beginPath(); ctx.moveTo(c * w, 0); ctx.lineTo(c * w, canvas.height); ctx.stroke();
      }
      rows.forEach((row) => {
        const y = (row.y * h) + offset;
        if (y < -h || y > canvas.height) return;
        ctx.fillStyle = row.hit ? "rgba(40,120,107,.18)" : "#14201c";
        ctx.fillRect(row.col * w + 6, y + 6, w - 12, h - 12);
        if (!row.hit) {
          const shine = ctx.createLinearGradient(row.col * w, y, row.col * w + w, y + h);
          shine.addColorStop(0, "rgba(255,255,255,.2)");
          shine.addColorStop(.45, "rgba(255,255,255,0)");
          shine.addColorStop(1, "rgba(1,205,253,.16)");
          ctx.fillStyle = shine;
          ctx.fillRect(row.col * w + 6, y + 6, w - 12, h - 12);
        }
      });
      ctx.fillStyle = "rgba(40,120,107,.82)";
      ctx.font = "700 18px system-ui";
      ctx.fillText("连续下落，只点深色块", 22, 34);
    };

    const step = (now) => {
      if (!running) return;
      if (!lastTime) lastTime = now;
      const dt = Math.min(48, now - lastTime);
      lastTime = now;
      offset += (speed * dt) / 1000;
      const h = canvas.height / visibleRows;
      if (offset >= h) {
        offset -= h;
        rows.forEach((row) => { row.y += 1; });
        const missed = rows.find((row) => row.y >= visibleRows && !row.hit);
        if (missed) {
          endGame("黑块滑到底了，点击开始重来。");
          return;
        }
        rows = rows.filter((row) => row.y < visibleRows + 1);
        while (rows.length < visibleRows + 3) rows.unshift(makeRow(rows[0].y - 1));
      }
      draw();
      raf = requestAnimationFrame(step);
    };

    const tap = (event) => {
      event.preventDefault();
      if (!running) return;
      const rect = canvas.getBoundingClientRect();
      const clientX = event.clientX || (event.touches && event.touches[0] && event.touches[0].clientX);
      const clientY = event.clientY || (event.touches && event.touches[0] && event.touches[0].clientY);
      const x = ((clientX - rect.left) / rect.width) * canvas.width;
      const y = ((clientY - rect.top) / rect.height) * canvas.height;
      const w = canvas.width / cols;
      const h = canvas.height / visibleRows;
      const col = Math.floor(x / w);
      const row = rows.find((item) => {
        const top = item.y * h + offset;
        return !item.hit && item.col === col && y >= top && y <= top + h;
      });
      if (!row) {
        endGame("点到白块了。");
        return;
      }
      row.hit = true;
      score += 1;
      speed = Math.min(260, 86 + score * 5);
      saveBest(score);
      setText(score, String(Math.round((speed / 86) * 10) / 10) + "x", "节奏不错，继续。");
      draw();
    };

    canvas.addEventListener("pointerdown", tap);
    canvas.addEventListener("touchstart", tap, { passive: false });
    cleanup = () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener("pointerdown", tap);
    };
    resetRows();
    setText(0, "1x", "黑块已加深，速度已放慢。");
    draw();
    raf = requestAnimationFrame(step);
  };

  const startTileStack = () => {
    resetBoard("stack-board layered-stack-board");
    const symbols = ["月", "星", "海", "云", "花", "灯", "书", "叶"];
    let cards = [];
    let tray = [];
    let cleared = 0;
    let locked = false;

    const layout = [
      { x: 1, y: 0, layer: 0 }, { x: 3, y: 0, layer: 0 }, { x: 5, y: 0, layer: 0 },
      { x: 0, y: 1, layer: 0 }, { x: 2, y: 1, layer: 0 }, { x: 4, y: 1, layer: 0 }, { x: 6, y: 1, layer: 0 },
      { x: 1, y: 2, layer: 0 }, { x: 3, y: 2, layer: 0 }, { x: 5, y: 2, layer: 0 },
      { x: 2, y: .65, layer: 1 }, { x: 4, y: .65, layer: 1 },
      { x: 1, y: 1.65, layer: 1 }, { x: 3, y: 1.65, layer: 1 }, { x: 5, y: 1.65, layer: 1 },
      { x: 2, y: 2.65, layer: 1 }, { x: 4, y: 2.65, layer: 1 },
      { x: 3, y: 1.25, layer: 2 }, { x: 2, y: 2.25, layer: 2 }, { x: 4, y: 2.25, layer: 2 },
      { x: 3, y: 2.05, layer: 3 },
    ];

    const buildCards = () => {
      const values = [];
      while (values.length < layout.length) {
        const symbol = symbols[Math.floor(Math.random() * symbols.length)];
        values.push(symbol, symbol, symbol);
      }
      const picked = shuffle(values).slice(0, layout.length);
      cards = layout.map((pos, index) => ({ id: index, symbol: picked[index], x: pos.x, y: pos.y, layer: pos.layer, removed: false }));
      tray = [];
      cleared = 0;
      locked = false;
    };

    const overlaps = (top, bottom) => {
      if (top.layer <= bottom.layer || top.removed || bottom.removed) return false;
      return Math.abs(top.x - bottom.x) < .95 && Math.abs(top.y - bottom.y) < .95;
    };

    const isBlocked = (card) => cards.some((other) => overlaps(other, card));

    const compactTray = () => {
      const counts = tray.reduce((map, item) => {
        map.set(item.symbol, (map.get(item.symbol) || 0) + 1);
        return map;
      }, new Map());
      let removed = false;
      counts.forEach((count, symbol) => {
        if (count >= 3) {
          let left = 3;
          tray = tray.filter((item) => {
            if (item.symbol === symbol && left > 0) {
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

    const pick = (id) => {
      if (locked) return;
      const card = cards.find((item) => item.id === id);
      if (!card || card.removed) return;
      if (isBlocked(card)) {
        render("这张被上层压住了，先拿上面的牌。");
        return;
      }
      card.removed = true;
      tray.push({ id: card.id, symbol: card.symbol });
      const removed = compactTray();
      if (cards.every((item) => item.removed) && tray.length === 0) {
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
      render(removed ? "三张相同已消除。" : "只能点没有被压住的亮牌。");
    };

    function render(hint) {
      board.innerHTML = "";
      const pile = document.createElement("div");
      pile.className = "stack-pile layered-stack-pile";
      cards.forEach((card) => {
        if (card.removed) return;
        const button = document.createElement("button");
        button.type = "button";
        button.className = "stack-card layered-stack-card";
        button.textContent = card.symbol;
        button.dataset.blocked = isBlocked(card) ? "true" : "false";
        button.style.setProperty("--stack-x", String(card.x));
        button.style.setProperty("--stack-y", String(card.y));
        button.style.setProperty("--stack-layer", String(card.layer));
        button.addEventListener("click", () => pick(card.id));
        pile.appendChild(button);
      });
      const trayEl = document.createElement("div");
      trayEl.className = "stack-tray";
      Array.from({ length: 7 }).forEach((_, index) => {
        const slot = document.createElement("span");
        slot.textContent = (tray[index] && tray[index].symbol) || "";
        slot.dataset.empty = tray[index] ? "false" : "true";
        trayEl.appendChild(slot);
      });
      board.append(pile, trayEl);
      setText(cleared, String(tray.length) + "/7", hint || "亮牌可点，暗牌被上层压住。");
    }

    buildCards();
    setText(0, "0/7", "新增层级遮挡，不能无脑点底牌。");
    render();
  };

  const startReaction = () => {
    resetBoard("brain-board reaction-board");
    let state = "waiting";
    let timer = 0;
    let startAt = 0;
    let best = Number(localStorage.getItem(bestKey) || 0);
    const pad = document.createElement("button");
    pad.type = "button";
    pad.className = "reaction-pad";
    board.appendChild(pad);

    const arm = () => {
      window.clearTimeout(timer);
      state = "waiting";
      pad.dataset.state = "waiting";
      pad.textContent = "等它变绿";
      setText(best || "-", "准备", "不要提前点。");
      timer = window.setTimeout(() => {
        state = "go";
        startAt = performance.now();
        pad.dataset.state = "go";
        pad.textContent = "点！";
        setText(best || "-", "现在", "立刻点击。");
      }, 1200 + Math.random() * 2600);
    };

    pad.addEventListener("click", () => {
      if (state === "waiting") {
        window.clearTimeout(timer);
        state = "early";
        pad.dataset.state = "early";
        pad.textContent = "太早了";
        setText(best || "-", "抢跑", "等颜色变化后再点。");
        return;
      }
      if (state === "go") {
        const ms = Math.round(performance.now() - startAt);
        best = best ? Math.min(best, ms) : ms;
        localStorage.setItem(bestKey, String(best));
        state = "done";
        pad.dataset.state = "done";
        pad.textContent = `${ms} ms`;
        setText(ms, "完成", "点击开始再测一次。");
      }
    });
    cleanup = () => window.clearTimeout(timer);
    arm();
  };

  const startPattern = () => {
    resetBoard("brain-board pattern-board");
    const cells = Array.from({ length: 9 }, (_, index) => index);
    let level = 1;
    let sequence = [];
    let input = [];
    let showing = false;

    const render = (hint) => {
      board.innerHTML = "";
      cells.forEach((index) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "pattern-cell";
        button.dataset.flash = "false";
        button.addEventListener("click", () => pick(index));
        board.appendChild(button);
      });
      setText(level - 1, `${input.length}/${sequence.length || level}`, hint || "记住亮起顺序。");
    };

    const flash = async () => {
      showing = true;
      input = [];
      sequence.push(Math.floor(Math.random() * 9));
      setText(level - 1, `0/${sequence.length}`, "看清顺序。");
      await new Promise((resolve) => window.setTimeout(resolve, 420));
      for (const index of sequence) {
        const cell = board.children[index];
        cell.dataset.flash = "true";
        await new Promise((resolve) => window.setTimeout(resolve, 360));
        cell.dataset.flash = "false";
        await new Promise((resolve) => window.setTimeout(resolve, 140));
      }
      showing = false;
      setText(level - 1, `0/${sequence.length}`, "按同样顺序点回来。");
    };

    const pick = (index) => {
      if (showing || !sequence.length) return;
      input.push(index);
      if (sequence[input.length - 1] !== index) {
        saveBest(level - 1);
        setText(level - 1, "失误", "顺序错了，点击开始重来。");
        sequence = [];
        return;
      }
      if (input.length === sequence.length) {
        level += 1;
        saveBest(level - 1);
        flash();
      } else {
        setText(level - 1, `${input.length}/${sequence.length}`, "继续。");
      }
    };

    render("记住亮起顺序。");
    flash();
  };

  const startAimTrainer = () => {
    resetBoard("brain-board aim-board");
    let hits = 0;
    let left = 20;
    let currentTarget = null;
    const field = document.createElement("div");
    field.className = "aim-field";
    board.appendChild(field);

    const spawn = () => {
      field.innerHTML = "";
      if (left <= 0) {
        saveBest(hits);
        setText(hits, "完成", "20 个目标结束。");
        return;
      }
      const target = document.createElement("button");
      target.type = "button";
      target.className = "aim-target";
      currentTarget = { x: 8 + Math.random() * 78, y: 8 + Math.random() * 74 };
      target.style.left = `${currentTarget.x}%`;
      target.style.top = `${currentTarget.y}%`;
      target.addEventListener("pointerdown", (event) => {
        event.preventDefault();
        event.stopPropagation();
        hits += 1;
        left -= 1;
        setText(hits, left, "命中。");
        spawn();
      });
      field.appendChild(target);
      setText(hits, left, "点击圆形目标。");
    };

    field.addEventListener("click", (event) => {
      if (!currentTarget || left <= 0) return;
      const rect = field.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 100;
      const y = ((event.clientY - rect.top) / rect.height) * 100;
      const dx = x - currentTarget.x;
      const dy = y - currentTarget.y;
      if (Math.sqrt(dx * dx + dy * dy) > 7.5) return;
      hits += 1;
      left -= 1;
      setText(hits, left, "命中。");
      spawn();
    });

    spawn();
  };

  const startCountdown = () => {
    resetBoard("brain-board countdown-board");
    const target = 5 + Math.floor(Math.random() * 6);
    let started = false;
    let startTime = 0;
    let raf = 0;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "countdown-button";
    button.textContent = "开始计时";
    board.appendChild(button);

    const tick = () => {
      if (!started) return;
      setText(Math.round((performance.now() - startTime) / 100) / 10, `${target}s`, "凭感觉停下。");
      raf = requestAnimationFrame(tick);
    };

    button.addEventListener("click", () => {
      if (!started) {
        started = true;
        startTime = performance.now();
        button.textContent = "停止";
        tick();
        return;
      }
      started = false;
      cancelAnimationFrame(raf);
      const elapsed = (performance.now() - startTime) / 1000;
      const diff = Math.round(Math.abs(elapsed - target) * 100) / 100;
      const score = Math.max(0, Math.round((10 - diff) * 100));
      saveBest(score);
      button.textContent = "再来一次";
      setText(`${diff}s`, `${target}s`, diff < .25 ? "非常准。" : "再校准一下时间感。");
    });
    cleanup = () => cancelAnimationFrame(raf);
    setText("-", `${target}s`, "点击开始，然后在目标秒数停下。");
  };

  const startCupBall = () => {
    resetBoard("brain-board cup-board");
    let ball = Math.floor(Math.random() * 3);
    let round = 1;
    let locked = true;
    const cups = [0, 1, 2];

    const render = (hint) => {
      board.innerHTML = "";
      const row = document.createElement("div");
      row.className = "cup-row";
      cups.forEach((cup, index) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "cup";
        button.textContent = locked ? "杯" : (cup === ball ? "球" : "杯");
        button.addEventListener("click", () => guess(index));
        row.appendChild(button);
      });
      board.appendChild(row);
      setText(Number(localStorage.getItem(bestKey) || 0), round, hint || "盯住有球的杯子。");
    };

    const shuffleCups = async () => {
      locked = false;
      render("先看球在哪。");
      await new Promise((resolve) => window.setTimeout(resolve, 900));
      locked = true;
      for (let i = 0; i < 7; i += 1) {
        const a = Math.floor(Math.random() * 3);
        let b = Math.floor(Math.random() * 3);
        if (a === b) b = (b + 1) % 3;
        [cups[a], cups[b]] = [cups[b], cups[a]];
        render("洗牌中。");
        await new Promise((resolve) => window.setTimeout(resolve, 220));
      }
      render("猜球在哪个杯子里。");
    };

    const guess = (index) => {
      if (!locked) return;
      const ok = cups[index] === ball;
      if (ok) {
        round += 1;
        saveBest(round - 1);
        ball = Math.floor(Math.random() * 3);
        shuffleCups();
      } else {
        render("猜错了，点击开始重来。");
      }
    };

    shuffleCups();
  };

  const starters = {
    jump: startJump,
    snake: startSnake,
    "link-match": startLinkMatch,
    quiz: startQuiz,
    "piano-tiles": startPianoTiles,
    "tile-stack": startTileStack,
    reaction: startReaction,
    pattern: startPattern,
    "aim-trainer": startAimTrainer,
    countdown: startCountdown,
    "cup-ball": startCupBall,
  };

  startBtn.addEventListener("click", () => starters[game]?.());
  modeBtn.addEventListener("click", () => {
    hintEl.textContent = "这个小游戏暂时只有普通模式。";
  });
  starters[game]?.();
})();
