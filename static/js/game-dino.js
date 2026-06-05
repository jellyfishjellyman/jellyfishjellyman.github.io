(function () {
  const canvas = document.getElementById("dinoCanvas");
  const scoreEl = document.getElementById("dinoScore");
  const bestEl = document.getElementById("dinoBest");
  const messageEl = document.getElementById("dinoMessage");
  const restart = document.getElementById("restartDino");

  if (!canvas || !scoreEl || !bestEl || !messageEl || !restart) return;

  const ctx = canvas.getContext("2d");
  const ground = 292;
  const player = { x: 92, y: ground - 54, w: 42, h: 54, vy: 0, grounded: true };
  let obstacles = [];
  let clouds = [];
  let speed = 6;
  let score = 0;
  let best = Number(localStorage.getItem("jellyfish-dino-best") || 0);
  let running = false;
  let gameOver = false;
  let lastTime = 0;
  let spawnTimer = 0;
  let frameId = 0;

  bestEl.textContent = String(best);

  const reset = () => {
    player.y = ground - player.h;
    player.vy = 0;
    player.grounded = true;
    obstacles = [{ x: 720, w: 28, h: 52 }];
    clouds = [{ x: 520, y: 62 }, { x: 860, y: 104 }];
    speed = 6;
    score = 0;
    running = true;
    gameOver = false;
    lastTime = performance.now();
    spawnTimer = 0;
    messageEl.textContent = "跳过障碍，速度会慢慢变快。";
    window.cancelAnimationFrame(frameId);
    frameId = window.requestAnimationFrame(tick);
  };

  const jump = () => {
    if (gameOver) {
      reset();
      return;
    }
    if (!running) reset();
    if (!player.grounded) return;
    player.vy = -15.8;
    player.grounded = false;
  };

  const intersects = (a, b) => (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );

  const drawDino = () => {
    ctx.fillStyle = "#17201b";
    ctx.fillRect(player.x + 8, player.y + 12, 28, 32);
    ctx.fillRect(player.x + 25, player.y, 24, 22);
    ctx.fillRect(player.x + 4, player.y + 36, 12, 18);
    ctx.fillRect(player.x + 27, player.y + 36, 12, 18);
    ctx.fillStyle = "#fffaf2";
    ctx.fillRect(player.x + 40, player.y + 7, 4, 4);
  };

  const draw = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, "#f8f6ef");
    gradient.addColorStop(0.52, "#edf8f4");
    gradient.addColorStop(1, "#fff2fb");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = "rgba(40,120,107,.36)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, ground + 2);
    ctx.lineTo(canvas.width, ground + 2);
    ctx.stroke();

    clouds.forEach((cloud) => {
      ctx.fillStyle = "rgba(40,120,107,.14)";
      ctx.beginPath();
      ctx.ellipse(cloud.x, cloud.y, 42, 14, 0, 0, Math.PI * 2);
      ctx.ellipse(cloud.x + 28, cloud.y + 4, 32, 10, 0, 0, Math.PI * 2);
      ctx.fill();
    });

    drawDino();
    obstacles.forEach((obstacle) => {
      ctx.fillStyle = "#bd5d36";
      ctx.fillRect(obstacle.x, ground - obstacle.h, obstacle.w, obstacle.h);
      ctx.fillStyle = "rgba(255,250,242,.78)";
      ctx.fillRect(obstacle.x + 7, ground - obstacle.h + 9, 5, 9);
      ctx.fillRect(obstacle.x + obstacle.w - 12, ground - obstacle.h + 18, 5, 9);
    });

    if (gameOver) {
      ctx.fillStyle = "rgba(23,32,27,.72)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#fffaf2";
      ctx.font = "700 34px system-ui";
      ctx.textAlign = "center";
      ctx.fillText("撞到了，按空格再来", canvas.width / 2, canvas.height / 2);
    }
  };

  const tick = (time) => {
    if (!running) {
      draw();
      return;
    }
    const dt = Math.min(34, time - lastTime) / 16.67;
    lastTime = time;
    score += dt;
    speed += 0.0026 * dt;
    spawnTimer -= dt;

    player.vy += 0.82 * dt;
    player.y += player.vy * dt;
    if (player.y >= ground - player.h) {
      player.y = ground - player.h;
      player.vy = 0;
      player.grounded = true;
    }

    if (spawnTimer <= 0) {
      const h = 38 + Math.random() * 42;
      obstacles.push({ x: canvas.width + 30, w: 24 + Math.random() * 20, h });
      spawnTimer = 52 + Math.random() * 58;
    }
    obstacles.forEach((obstacle) => { obstacle.x -= speed * dt; });
    obstacles = obstacles.filter((obstacle) => obstacle.x + obstacle.w > -20);
    clouds.forEach((cloud) => {
      cloud.x -= speed * 0.22 * dt;
      if (cloud.x < -80) {
        cloud.x = canvas.width + 80;
        cloud.y = 54 + Math.random() * 78;
      }
    });

    const hitBox = { x: player.x + 7, y: player.y + 7, w: player.w - 12, h: player.h - 8 };
    if (obstacles.some((obstacle) => intersects(hitBox, { x: obstacle.x, y: ground - obstacle.h, w: obstacle.w, h: obstacle.h }))) {
      running = false;
      gameOver = true;
      best = Math.max(best, Math.floor(score));
      localStorage.setItem("jellyfish-dino-best", String(best));
      bestEl.textContent = String(best);
      messageEl.textContent = "撞到障碍了。按空格或点重新开始。";
    }

    scoreEl.textContent = String(Math.floor(score));
    draw();
    frameId = window.requestAnimationFrame(tick);
  };

  window.addEventListener("keydown", (event) => {
    if ([" ", "ArrowUp", "w", "W"].includes(event.key)) {
      event.preventDefault();
      jump();
    }
  });
  canvas.addEventListener("pointerdown", jump);
  restart.addEventListener("click", reset);
  messageEl.textContent = "按空格或点击画面开始。";
  draw();
})();
