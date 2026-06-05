(function () {
  const board = document.getElementById("mineBoard");
  const mineCountEl = document.getElementById("mineCount");
  const timerEl = document.getElementById("mineTimer");
  const stateEl = document.getElementById("mineState");
  const messageEl = document.getElementById("mineMessage");
  const restart = document.getElementById("restartMines");
  const difficulty = document.getElementById("difficultyMines");

  if (!board || !mineCountEl || !timerEl || !stateEl || !messageEl || !restart || !difficulty) return;

  const levels = [
    { name: "普通", size: 9, mines: 10 },
    { name: "进阶", size: 12, mines: 22 },
  ];
  let levelIndex = 0;
  let cells = [];
  let started = false;
  let finished = false;
  let revealed = 0;
  let flags = 0;
  let seconds = 0;
  let timer = 0;

  const currentLevel = () => levels[levelIndex];
  const indexOf = (x, y) => y * currentLevel().size + x;
  const neighborsOf = (x, y) => {
    const size = currentLevel().size;
    const result = [];
    for (let yy = y - 1; yy <= y + 1; yy += 1) {
      for (let xx = x - 1; xx <= x + 1; xx += 1) {
        if (xx === x && yy === y) continue;
        if (xx >= 0 && xx < size && yy >= 0 && yy < size) result.push(indexOf(xx, yy));
      }
    }
    return result;
  };

  const startTimer = () => {
    if (timer) return;
    timer = window.setInterval(() => {
      seconds += 1;
      timerEl.textContent = String(seconds);
    }, 1000);
  };

  const stopTimer = () => {
    window.clearInterval(timer);
    timer = 0;
  };

  const placeMines = (safeIndex) => {
    const { size, mines } = currentLevel();
    const blocked = new Set([safeIndex, ...neighborsOf(safeIndex % size, Math.floor(safeIndex / size))]);
    let placed = 0;
    while (placed < mines) {
      const index = Math.floor(Math.random() * cells.length);
      if (blocked.has(index) || cells[index].mine) continue;
      cells[index].mine = true;
      placed += 1;
    }
    cells.forEach((cell) => {
      cell.nearby = neighborsOf(cell.x, cell.y).filter((index) => cells[index].mine).length;
    });
  };

  const render = () => {
    board.innerHTML = "";
    board.style.setProperty("--mine-size", currentLevel().size);
    cells.forEach((cell, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "mine-cell";
      button.dataset.state = cell.revealed ? "open" : cell.flagged ? "flag" : "closed";
      button.dataset.nearby = cell.nearby || "";
      button.setAttribute("role", "gridcell");
      button.setAttribute("aria-label", cell.revealed ? `已打开，周围 ${cell.nearby} 颗雷` : "未打开");
      button.textContent = cell.revealed ? (cell.mine ? "＊" : cell.nearby || "") : cell.flagged ? "!" : "";
      button.addEventListener("click", () => reveal(index));
      button.addEventListener("contextmenu", (event) => {
        event.preventDefault();
        toggleFlag(index);
      });
      let pressTimer = 0;
      button.addEventListener("touchstart", () => {
        pressTimer = window.setTimeout(() => toggleFlag(index), 420);
      }, { passive: true });
      button.addEventListener("touchend", () => window.clearTimeout(pressTimer), { passive: true });
      board.appendChild(button);
    });
    mineCountEl.textContent = String(Math.max(0, currentLevel().mines - flags));
  };

  const revealFlood = (startIndex) => {
    const queue = [startIndex];
    const seen = new Set();
    while (queue.length) {
      const index = queue.shift();
      if (seen.has(index)) continue;
      seen.add(index);
      const cell = cells[index];
      if (!cell || cell.revealed || cell.flagged) continue;
      cell.revealed = true;
      revealed += 1;
      if (cell.nearby === 0) queue.push(...neighborsOf(cell.x, cell.y));
    }
  };

  const finish = (won) => {
    finished = true;
    stopTimer();
    stateEl.textContent = won ? "胜利" : "爆雷";
    messageEl.textContent = won ? "安全区全部打开，推理成功。" : "踩到雷了，重新开一局。";
    cells.forEach((cell) => {
      if (cell.mine) cell.revealed = true;
    });
    render();
  };

  const checkWin = () => {
    if (revealed === cells.length - currentLevel().mines) finish(true);
  };

  const reveal = (index) => {
    if (finished || cells[index].flagged || cells[index].revealed) return;
    if (!started) {
      started = true;
      stateEl.textContent = "进行中";
      placeMines(index);
      startTimer();
    }
    if (cells[index].mine) {
      finish(false);
      return;
    }
    revealFlood(index);
    messageEl.textContent = "数字越大，周围越危险。右键或长按可以插旗。";
    render();
    checkWin();
  };

  const toggleFlag = (index) => {
    if (finished || cells[index].revealed) return;
    cells[index].flagged = !cells[index].flagged;
    flags += cells[index].flagged ? 1 : -1;
    render();
  };

  const start = () => {
    stopTimer();
    const { size, name } = currentLevel();
    cells = Array.from({ length: size * size }, (_, index) => ({
      x: index % size,
      y: Math.floor(index / size),
      mine: false,
      nearby: 0,
      revealed: false,
      flagged: false,
    }));
    started = false;
    finished = false;
    revealed = 0;
    flags = 0;
    seconds = 0;
    timerEl.textContent = "0";
    stateEl.textContent = "待命";
    difficulty.textContent = name;
    messageEl.textContent = "第一下不会爆。先打开一块，再根据数字推理。";
    render();
  };

  restart.addEventListener("click", start);
  difficulty.addEventListener("click", () => {
    levelIndex = (levelIndex + 1) % levels.length;
    start();
  });
  start();
})();
