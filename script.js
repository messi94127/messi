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

let startTime;
let score = 0;
let backgroundPosition = 0;
const backgroundSpeed = 0.5;

const keys = {
    ArrowLeft: false,
    ArrowRight: false,
};

const touchControls = {
    isLeftPressed: false,
    isRightPressed: false,
    touchStartX: null,
};

let touchStartY = null; // タッチ開始時のY座標を記録 (ジャンプ用)

// キーボードイベントリスナー
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && !isJumping) {
        isJumping = true;
        velocityY = -20;
    }
    keys[e.code] = true;
});

document.addEventListener('keyup', (e) => {
    keys[e.code] = false;
});

// タッチイベントリスナー (横移動用)
game.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    touchControls.touchStartX = touch.clientX;

    // ジャンプ処理 (タッチ開始時)
    touchStartY = touch.clientY;
    if (!isJumping) {
        isJumping = true;
        velocityY = -20;
    }
});

game.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (touchControls.touchStartX !== null) {
        const touch = e.touches[0];
        const deltaX = touch.clientX - touchControls.touchStartX;

        if (deltaX > 20) {
            touchControls.isRightPressed = true;
            touchControls.isLeftPressed = false;
        } else if (deltaX < -20) {
            touchControls.isLeftPressed = true;
            touchControls.isRightPressed = false;
        } else {
          touchControls.isLeftPressed = false;
          touchControls.isRightPressed = false;
        }
    }
    // スワイプ判定 (ジャンプ抑制)
    if (touchStartY !== null) {
        const touch = e.touches[0];
        const deltaY = touch.clientY - touchStartY;
        if (Math.abs(deltaY) > 50) { // Y方向の移動量が50px以上ならスワイプとみなす
            touchStartY = null; // スワイプと判断してジャンプさせない
        }
    }
});

game.addEventListener('touchend', (e) => {
    e.preventDefault();
    touchControls.isLeftPressed = false;
    touchControls.isRightPressed = false;
    touchControls.touchStartX = null;
    touchStartY = null; // タッチ終了でリセット (ジャンプ用)
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

    enemies.forEach(enemyObj => enemyContainer.removeChild(enemyObj.element));
    enemies = [];
    createEnemies();
    updatePositions();
}

function updatePositions() {
    player.style.left = `${playerPosition.left}px`;
    player.style.bottom = `${playerPosition.bottom}px`;
    enemies.forEach(enemyObj => {
        enemyObj.element.style.left = `${enemyObj.x}px`;
    });
}

function moveBackground() {
    backgroundPosition -= playerSpeed * backgroundSpeed;
    background.style.left = `${backgroundPosition}px`;
    if (backgroundPosition <= -background.offsetWidth / 2) {
        backgroundPosition += background.offsetWidth / 2;
    }
}

function createEnemies() {
    for (let i = 0; i < numEnemies; i++) {
        const enemy = document.createElement('div');
        enemy.classList.add('enemy');
        enemy.x = 800 + i * 500;
        enemy.style.left = `${enemy.x}px`;
        enemyContainer.appendChild(enemy);
        enemies.push({
            element: enemy,
            x: enemy.x,
            passed: false
        });
    }
}

function moveEnemies() {
    enemies.forEach(enemyObj => {
        enemyObj.x -= playerSpeed * backgroundSpeed;
        enemyObj.element.style.left = `${enemyObj.x}px`;
        if (enemyObj.x < -100) {
            enemyObj.x = game.offsetWidth + Math.random() * 500;
            enemyObj.passed = false;
        }
    });
}

function gameLoop() {
    if (isJumping) {
        velocityY += gravity;
        playerPosition.bottom -= velocityY;
        if (playerPosition.bottom <= 100) {
            playerPosition.bottom = 100;
            isJumping = false;
        }
    }

    let playerMoved = false;
    if (keys.ArrowRight || touchControls.isRightPressed) {
        playerPosition.left += playerSpeed;
        playerMoved = true;
    }
    if (keys.ArrowLeft || touchControls.isLeftPressed) {
        playerPosition.left -= playerSpeed;
        playerMoved = true;
    }

    if (playerMoved) {
        moveBackground();
    }

    moveEnemies();

    if (playerPosition.left < 0) playerPosition.left = 0;
    if (playerPosition.left > game.offsetWidth - player.offsetWidth) playerPosition.left = game.offsetWidth - player.offsetWidth;

    updatePositions();

    const playerRect = player.getBoundingClientRect();

    for (const enemyObj of enemies) {
        const enemyRect = enemyObj.element.getBoundingClientRect();
        if (!enemyObj.passed && playerPosition.left > enemyObj.x) {
            score += 100;
            scoreDisplay.textContent = `Score: ${score}`;
            enemyObj.passed = true;
        }
        if (checkCollision(playerRect, enemyRect)) {
            handleGameOver();
            break;
        }
    }

    const goalRect = goal.getBoundingClientRect();
    if (checkCollision(playerRect, goalRect)) {
        const endTime = Date.now();
        score = Math.floor((endTime - startTime) / 1000);
        alert(`ゴール！おめでとうございます！スコア: ${score}秒`);
        resetGame();
    }

    requestAnimationFrame(gameLoop);
}

resetGame();
gameLoop();