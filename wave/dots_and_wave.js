const canvas = document.getElementById("waveCanvas");
const ctx = canvas.getContext("2d");

// --- 점 상태 데이터 ---
let points = [];
let activePoint = null;
let fallingPoints = [];
let waves = []; // ← expandingCircles 대신 파동 데이터

function createPoints(n = 7) {
  points = [];
  for (let i = 0; i < n; i++) {
    points.push({
      x: 40 + Math.random() * 60,         // 캔버스 바깥쪽(좌측)
      y: 60 + i * 36 + Math.random() * 8, // 조금 흩뿌리기
      r: 10,
      color: "#2f2c2cff",
      dragging: false,
      offsetX: 0,
      offsetY: 0
    });
  }
}
createPoints();

function pointHitTest(point, mx, my) {
  return (mx - point.x) ** 2 + (my - point.y) ** 2 < point.r ** 2;
}

// --- 2. 드래그 & 드롭 ---
canvas.addEventListener("mousedown", function(e) {
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;

  for (let p of points) {
    if (pointHitTest(p, mx, my)) {
      activePoint = p;
      p.dragging = true;
      p.offsetX = mx - p.x;
      p.offsetY = my - p.y;
      break;
    }
  }
});

canvas.addEventListener("mousemove", function(e) {
  if (!activePoint) return;
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;
  activePoint.x = mx - activePoint.offsetX;
  activePoint.y = my - activePoint.offsetY;
});

canvas.addEventListener("mouseup", function(e) {
  if (!activePoint) return;
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;

  if (
    mx > 0 &&
    mx < canvas.width &&
    my > 0 &&
    my < canvas.height
  ) {
    fallingPoints.push({
      x: activePoint.x,
      y: activePoint.y,
      r: activePoint.r,
      vy: 3 + Math.random() * 2,
      color: activePoint.color
    });
    points = points.filter((p) => p !== activePoint);
  }
  activePoint.dragging = false;
  activePoint = null;
});

// --- 파동: 간섭 방식으로 그리기 ---
function drawWaves() {
  const img = ctx.createImageData(canvas.width, canvas.height);
  const data = img.data;
  const t = performance.now() / 1000; // 현재 시각(초)

  const grid = 2; // 해상도(값 작을수록 정밀, 느림)
  for (let y = 0; y < canvas.height; y += grid) {
    for (let x = 0; x < canvas.width; x += grid) {
      let v = 0; // 파동의 합
      for (let w of waves) {
        // 각 파동이 시작된 이후 시간
        let age = t - w.t0;
        if (age < w.delay) continue; // 아직 시작 전
        let dist = Math.hypot(x - w.x, y - w.y);
        let phase = 2 * Math.PI * ((dist - w.waveOffset - w.speed * (age - w.delay)) / w.wavelength);
        let damp = Math.exp(-dist / 180);
        v += Math.sin(phase) * w.amplitude * damp;
      }
      // 진폭 → 밝기(푸른색 강조)
      let blue = Math.floor(180 + v);
      let alpha = 160;
      for (let dy = 0; dy < grid; dy++) {
        for (let dx = 0; dx < grid; dx++) {
          let idx = ((y + dy) * canvas.width + (x + dx)) * 4;
          data[idx] = 180 + v * 0.13;   // R
          data[idx+1] = 220 + v * 0.13; // G
          data[idx+2] = blue;           // B
          data[idx+3] = alpha;
        }
      }
    }
  }
  ctx.putImageData(img, 0, 0);
}

// --- 애니메이션 (점 낙하/파동 시작) ---
function draw() {
  // 1. 파동 간섭 그리기
  drawWaves();

  // 2. 아직 드래그되지 않은 점 그리기 (캔버스 바깥)
  for (let p of points) {
    drawDot(p);
  }

  // 3. 드래그 중 점 그리기
  if (activePoint && activePoint.dragging) {
    drawDot(activePoint);
  }

  // 4. 낙하중인 점 업데이트 및 그리기
  for (let i = fallingPoints.length - 1; i >= 0; i--) {
    let p = fallingPoints[i];
    p.y += p.vy;
    p.r *= 0.99;
    drawDot(p);

    // 충분히 작아지면 파동 여러 개 생성 (간섭)
    if (p.r < 3) {
      const waveCount = 7; // 동심원 개수(파동)
      const delayStep = 0.16; // 파동 간 시작 간격(초)
      for (let w = 0; w < waveCount; w++) {
        waves.push({
          x: p.x,
          y: p.y,
          t0: performance.now() / 1000, // 시작 시각(초)
          amplitude: 16 - w * 1.2, // 점점 작은 진폭
          wavelength: 55 + w * 10, // 파장은 점점 큼
          speed: 1.48,             // 파동 진행 속도
          waveOffset: w * 18,      // 시작 반경(간격)
          delay: w * delayStep     // 시작 지연(초)
        });
      }
      fallingPoints.splice(i, 1);
    }
  }

  requestAnimationFrame(draw);
}
draw();

// --- 점 그리기 ---
function drawDot(p) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
  ctx.fillStyle = p.color;
  ctx.shadowColor = "#3333";
  ctx.shadowBlur = 8;
  ctx.globalAlpha = 0.93;
  ctx.fill();
  ctx.restore();
}
