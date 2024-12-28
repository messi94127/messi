const player = document.getElementById('player');
const enemy = document.getElementById('enemy');
const goal = document.getElementById('goal');

let isJumping = false;
let gravity = 2;
let velocityY = 0;
let velocityX = 0;
let playerPosition = { left: 50, bottom: 100 }; // 初期位置
const speed = 5;

// キー入力の状態管理
const keys = {
  ArrowLeft: false,
  ArrowRight: false,
};

// キーイベントの設定
document.addEventListener('keydown', (e) => {
  if (e.code === 'Space' && !isJumping) {
    isJumping = true;
    velocityY = -28;
  }
  if (e.code === 'ArrowLeft') {
    keys.ArrowLeft = true;
  }
  if (e.code === 'ArrowRight') {
    keys.ArrowRight = true;
  }
});

document.addEventListener('keyup', (e) => {
  if (e.code === 'ArrowLeft') {
    keys.ArrowLeft = false;
  }
  if (e.code === 'ArrowRight') {
    keys.ArrowRight = false;
  }
});

// 衝突判定（`getBoundingClientRect`を使用）
function checkCollision(rect1, rect2) {
  return !(
    rect1.right < rect2.left || // rect1がrect2の左側にいる
    rect1.left > rect2.right || // rect1がrect2の右側にいる
    rect1.bottom < rect2.top || // rect1がrect2の上側にいる
    rect1.top > rect2.bottom // rect1がrect2の下側にいる
  );
}

// ゲームオーバー処理
function handleGameOver() {
  alert('ゲームオーバー！敵に触れました！');

  // プレイヤーの位置と状態をリセット
  playerPosition.left = 50;
  playerPosition.bottom = 100;
  isJumping = false;
  velocityY = 0;
  velocityX = 0;
  // プレイヤーの位置を更新
  player.style.left = `${playerPosition.left}px`;
  player.style.bottom = `${playerPosition.bottom}px`;
}

// ゲームループ
function gameLoop() {
  // 縦方向の処理
  if (isJumping) {
    velocityY += gravity;
    playerPosition.bottom -= velocityY;

    if (playerPosition.bottom <= 100) {
      playerPosition.bottom = 100;
      isJumping = false;
    }
  }

  // 横方向の処理
  if (keys.ArrowLeft) {
    velocityX = -speed;
  } else if (keys.ArrowRight) {
    velocityX = speed;
  } else {
    velocityX = 0;
  }
  playerPosition.left += velocityX;

  // 画面外に出ないよう制限
  if (playerPosition.left < 0) playerPosition.left = 0;
  if (playerPosition.left > window.innerWidth - 50) playerPosition.left = window.innerWidth - 50;

  // プレイヤー位置を更新
  player.style.bottom = `${playerPosition.bottom}px`;
  player.style.left = `${playerPosition.left}px`;

  // 衝突判定
  const playerRect = player.getBoundingClientRect();
  const enemyRect = enemy.getBoundingClientRect();
  const goalRect = goal.getBoundingClientRect();

  if (checkCollision(playerRect, enemyRect)) {
    handleGameOver();
  }

  if (checkCollision(playerRect, goalRect)) {
    alert('ゴール！おめでとうございます！');
    // ゲームクリア後にリセット
    playerPosition.left = 50;
    playerPosition.bottom = 100;
    player.style.left = `${playerPosition.left}px`;
    player.style.bottom = `${playerPosition.bottom}px`;
  }

  requestAnimationFrame(gameLoop);
}

// ゲーム開始
gameLoop();
