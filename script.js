const player = document.getElementById('player');
const game = document.getElementById('game');
const background = document.getElementById('background');
const enemyContainer = document.getElementById('enemy-container');
const goal = document.getElementById('goal');
const scoreDisplay = document.getElementById('score');

let isJumping = false;
let gravity = 1.5;
let velocityY = 0;
let playerPosition = { left: 50, bottom: 100 };
const playerSpeed = 5;

let enemies = [];
const numEnemies = 3;
const enemySpeed = 2;

let startTime;
let score = 0;
let gamePosition = 0; // ゲーム全体の横位置
let backgroundPosition = 0; // 背景の位置
const backgroundSpeed = 0.5; // 背景のスクロール速度（プレイヤー速度に対する比率）

const touchControls = {
  isLeftPressed: false,
  isRightPressed: false,
};

document.addEventListener('touchstart', (e) => {
  e.preventDefault(); // Prevent default touch behavior

  const touches = e.changedTouches;
  for (let i = 0; i < touches.length; i++) {
    const touch = touches[i];
    const halfWidth = window.innerWidth / 2;
    if (touch.clientX < halfWidth) {
      touchControls.isLeftPressed = true;
    } else {
      touchControls.isRightPressed = true;
    }
  }
});

document.addEventListener('touchend', (e) => {
  e.preventDefault();

  touchControls.isLeftPressed = false;
  touchControls.isRightPressed = false;
});

function checkCollision(rect1, rect2) {
  return !(
    rect1.right < rect2.left ||
    rect1.left > rect2.right ||
    rect1.bottom < rect2.top ||
    rect1.top > rect2.bottom
  );
}

function handleGameOver() {
  alert('ゲームオーバー！敵に触れました！');
  resetGame();
}

function resetGame() {
  playerPosition = { left: 50, bottom: 100 };
  isJumping = false;
  velocityY = 0;
  score = 0;
  scoreDisplay.textContent = `Score: ${score}`;
  startTime = Date.now();
  gamePosition = 0;
  game.style.transform = `translateX(${gamePosition}px)`;

  enemies.forEach(enemy => game.removeChild(enemy));
  enemies = [];
  createEnemies();
  updatePositions();
}

function updatePositions() {
  player.style.left = `${playerPosition.left}px`;
  player.style.bottom = `${playerPosition.bottom}px`;

  enemies.forEach(enemy => {
    enemy.style.left = `${enemy.x}px`;
  });
}

function moveBackground() {
  backgroundPosition -= playerSpeed * backgroundSpeed; // 背景をスクロール
  background.style.left = `${backgroundPosition}px`;

  // 背景が左端を超えたらリピート
  if (backgroundPosition <= -background.offsetWidth / 2) {
    backgroundPosition += background.offsetWidth / 2;
  }
}

function createEnemies() {
  for (let i = 0; i < numEnemies; i++) {
    const enemy = document.createElement('div');
    enemy.classList.add('enemy');
    // ... (敵のタイプ設定)
    enemy.x = 800 + i * 500;
    enemy.style.left = `${enemy.x}px`;
    enemyContainer.appendChild(enemy);
    enemies.push(enemy);
  }
}

function moveEnemies() {
  enemies.forEach(enemy => {
    enemy.x -= playerSpeed * backgroundSpeed;
    enemy.style.left = `${enemy.x}px`;
    if (enemy.x < -100) {
      enemy.x = game.offsetWidth + Math.random() * 500;
      enemy.passed = false; // リスポーン時にpassedフラグをリセット (optional)
    }
  });
}

function gameLoop() {
  if (isJumping) {
    velocityY += gravity;
    playerPosition.bottom -= velocityY;

    if (playerPosition.bottom <= 100)