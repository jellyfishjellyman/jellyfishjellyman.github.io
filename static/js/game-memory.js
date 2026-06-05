(function () {
  const board = document.getElementById("memoryBoard");
  const movesEl = document.getElementById("memoryMoves");
  const pairsEl = document.getElementById("memoryPairs");
  const bestEl = document.getElementById("memoryBest");
  const messageEl = document.getElementById("memoryMessage");
  const restart = document.getElementById("restartMemory");
  const modeButton = document.getElementById("memoryMode");

  if (!board || !movesEl || !pairsEl || !bestEl || !messageEl || !restart || !modeButton) return;

  const modes = [
    { name: "普通", pairs: 8, cols: 4 },
    { name: "进阶", pairs: 10, cols: 5 },
  ];
  const symbols = ["月", "星", "云", "电", "火", "水", "木", "石", "光", "梦"];
  let modeIndex = 0;
  let cards = [];
  let open = [];
  let locked = false;
  let moves = 0;
  let matched = 0;

  const currentMode = () => modes[modeIndex];
  const bestKey = () => `jellyfish-memory-best-${currentMode().pairs}`;

  const shuffle = (items) => {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };

  const updateStats = () => {
    movesEl.textContent = String(moves);
    pairsEl.textContent = `${matched}/${currentMode().pairs}`;
    bestEl.textContent = localStorage.getItem(bestKey()) || "-";
  };

  const render = () => {
    board.innerHTML = "";
    board.style.setProperty("--memory-cols", currentMode().cols);
    cards.forEach((card, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "memory-card";
      button.dataset.state = card.matched ? "matched" : card.open ? "open" : "closed";
      button.setAttribute("role", "gridcell");
      button.setAttribute("aria-label", card.open || card.matched ? `卡片 ${card.symbol}` : "未翻开卡片");
      button.textContent = card.open || card.matched ? card.symbol : "";
      button.addEventListener("click", () => flip(index));
      board.appendChild(button);
    });
    updateStats();
  };

  const finishIfDone = () => {
    if (matched !== currentMode().pairs) return;
    const best = Number(localStorage.getItem(bestKey()) || 0);
    if (!best || moves < best) localStorage.setItem(bestKey(), String(moves));
    messageEl.textContent = `全部配对完成，用了 ${moves} 步。`;
    updateStats();
  };

  const closeMismatch = (a, b) => {
    window.setTimeout(() => {
      cards[a].open = false;
      cards[b].open = false;
      open = [];
      locked = false;
      render();
    }, 620);
  };

  const flip = (index) => {
    const card = cards[index];
    if (locked || card.open || card.matched) return;
    card.open = true;
    open.push(index);
    if (open.length === 2) {
      moves += 1;
      const [a, b] = open;
      if (cards[a].symbol === cards[b].symbol) {
        cards[a].matched = true;
        cards[b].matched = true;
        matched += 1;
        open = [];
        messageEl.textContent = "配对成功。继续找下一组。";
        finishIfDone();
      } else {
        locked = true;
        messageEl.textContent = "没有配上，记住它们的位置。";
        closeMismatch(a, b);
      }
    } else {
      messageEl.textContent = "再翻一张。";
    }
    render();
  };

  const start = () => {
    const mode = currentMode();
    const deck = shuffle(symbols.slice(0, mode.pairs).flatMap((symbol) => [symbol, symbol]));
    cards = deck.map((symbol) => ({ symbol, open: false, matched: false }));
    open = [];
    locked = false;
    moves = 0;
    matched = 0;
    modeButton.textContent = mode.name;
    messageEl.textContent = "先翻开一张，再凭记忆找它的另一半。";
    render();
  };

  restart.addEventListener("click", start);
  modeButton.addEventListener("click", () => {
    modeIndex = (modeIndex + 1) % modes.length;
    start();
  });
  start();
})();
