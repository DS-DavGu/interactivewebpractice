const canvas = document.getElementById("myCanvas");
const ctx = canvas.getContext("2d");
let dots = [];
let lastMouseX = null;
let lastMouseY = null;

// 마우스가 움직이면 위치 저장
canvas.addEventListener("mousemove", function(event) {
  const rect = canvas.getBoundingClientRect();
  lastMouseX = event.clientX - rect.left;
  lastMouseY = event.clientY - rect.top;
});

// 근처 랜덤 위치 생성 함수
function randomNear(x, range = 20) {
  return x + (Math.random() - 0.5) * 2 * range;
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (lastMouseX !== null && lastMouseY !== null) {
    // 중심 1개
    dots.push({ x: lastMouseX, y: lastMouseY, radius: 3, speed: 1, alpha: 1 });
    // 주변 랜덤 3개
    for (let i = 0; i < 50; i++) {
      const rx = randomNear(lastMouseX, 500);
      const ry = randomNear(lastMouseY, 100);
      dots.push({ x: rx, y: ry, radius: 2, speed: 1, alpha: 0.7 });
    }
  }

  for (let i = dots.length - 1; i >= 0; i--) {
    const dot = dots[i];
    ctx.beginPath();
    ctx.arc(dot.x, dot.y, dot.radius, 0, Math.PI * 2);
    ctx.fillStyle = "white";
    ctx.globalAlpha = dot.alpha;
    ctx.fill();
    ctx.globalAlpha = 1;
    dot.y += dot.speed;
    dot.alpha -= 0.001;
    if (dot.alpha <= 0) {
      dots.splice(i, 1);
    }
  }

  requestAnimationFrame(draw);
}

draw();
