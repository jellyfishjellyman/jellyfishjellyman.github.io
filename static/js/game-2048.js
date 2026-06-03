(function () {
  const size = 4;
  const board = document.getElementById("board2048");
  const scoreEl = document.getElementById("score2048");
  const bestEl = document.getElementById("best2048");
  const messageEl = document.getElementById("message2048");
  const restart = document.getElementById("restart2048");

  if (!board || !scoreEl || !bestEl || !messageEl || !restart) return;

  let grid = [];
  let score = 0;
  let won = false;
  let best = Number(localStorage.getItem("jellyfish-2048-best") || 0);
  bestEl.textContent = String(best);

  const emptyGrid = () => Array.from({ length: size }, () => Array(size).fill(0));

  const randomEmptyCell = () => {
    const empty = [];
    grid.forEach((row, y) => row.forEach((value, x) => {
      if (!value) empty.push({ x, y });
    }));
    return empty[Math.floor(Math.random() * empty.length)];
  };

  const addTile = () => {
    const cell = randomEmptyCell();
    if (!cell) return;
    grid[cell.y][cell.x] = Math.random() < 0.9 ? 2 : 4;
  };

  const render = () => {
    board.innerHTML = "";
    board.style.setProperty("--board-size", size);
    grid.forEach((row) => {
      row.forEach((value) => {
        const tile = document.createElement("div");
        tile.className = "tile-2048";
        tile.dataset.value = value || "empty";
        tile.textContent = value ? String(value) : "";
        board.appendChild(tile);
      });
    });
    scoreEl.textContent = String(score);
    best = Math.max(best, score);
    localStorage.setItem("jellyfish-2048-best", String(best));
    bestEl.textContent = String(best);
  };

  const compress = (line) => {
    const values = line.filter(Boolean);
    const merged = [];
    let gained = 0;
    for (let i = 0; i < values.length; i += 1) {
      if (values[i] === values[i + 1]) {
        const next = values[i] * 2;
        merged.push(next);
        gained += next;
        if (next === 2048) won = true;
        i += 1;
      } else {
        merged.push(values[i]);
      }
    }
    while (merged.length < size) merged.push(0);
    return { line: merged, gained };
  };

  const transpose = (matrix) => matrix[0].map((_, col) => matrix.map((row) => row[col]));
  const reverseRows = (matrix) => matrix.map((row) => [...row].reverse());
  const sameGrid = (a, b) => JSON.stringify(a) === JSON.stringify(b);

  const move = (direction) => {
    const before = grid.map((row) => [...row]);
    let working = grid.map((row) => [...row]);
    let gained = 0;

    if (direction === "up" || direction === "down") working = transpose(working);
    if (direction === "right" || direction === "down") working = reverseRows(working);

    working = working.map((row) => {
      const result = compress(row);
      gained += result.gained;
      return result.line;
    });

    if (direction === "right" || direction === "down") working = reverseRows(working);
    if (direction === "up" || direction === "down") working = transpose(working);

    if (sameGrid(before, working)) return;

    grid = working;
    score += gained;
    addTile();
    render();
    updateStateMessage();
  };

  const canMove = () => {
    if (randomEmptyCell()) return true;
    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        const value = grid[y][x];
        if (grid[y][x + 1] === value || grid[y + 1]?.[x] === value) return true;
      }
    }
    return false;
  };

  const updateStateMessage = () => {
    if (won) {
      messageEl.textContent = "已经合成 2048。可以继续冲更高。";
      return;
    }
    if (!canMove()) {
      messageEl.textContent = "没有可移动的格子了。再来一局。";
      return;
    }
    messageEl.textContent = "方向键、WASD 或滑动棋盘。";
  };

  const start = () => {
    grid = emptyGrid();
    score = 0;
    won = false;
    addTile();
    addTile();
    render();
    updateStateMessage();
    board.focus({ preventScroll: true });
  };

  const keyToDirection = {
    ArrowUp: "up",
    ArrowDown: "down",
    ArrowLeft: "left",
    ArrowRight: "right",
    w: "up",
    W: "up",
    s: "down",
    S: "down",
    a: "left",
    A: "left",
    d: "right",
    D: "right",
  };

  window.addEventListener("keydown", (event) => {
    const direction = keyToDirection[event.key];
    if (!direction) return;
    event.preventDefault();
    move(direction);
  });

  let touchStart = null;
  board.addEventListener(
    "touchstart",
    (event) => {
      const touch = event.touches[0];
      touchStart = { x: touch.clientX, y: touch.clientY };
    },
    { passive: true }
  );

  board.addEventListener(
    "touchend",
    (event) => {
      if (!touchStart) return;
      const touch = event.changedTouches[0];
      const dx = touch.clientX - touchStart.x;
      const dy = touch.clientY - touchStart.y;
      touchStart = null;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 28) return;
      move(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : (dy > 0 ? "down" : "up"));
    },
    { passive: true }
  );

  restart.addEventListener("click", start);
  start();
})();
