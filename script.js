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
let highScore = 0;
const highScoreDisplay = document.getElementById('highScore');

const keys = {
    ArrowLeft: false,
    ArrowRight: false,
};

const touchControls = {
    isLeftPressed: false,
    isRightPressed: false,
    touchStartX: null,
};

let touchStartY = null;

// イベントリスナーの追加方法を変更 (touchstart、touchmove、touchendをgame要素に直接追加)
game.addEventListener('touchstart', handleTouchStart, { passive: false });
game.addEventListener('touchmove', handleTouchMove, { passive: false });
game.addEventListener('touchend', handleTouchEnd, { passive: false });

function handleTouchStart(e) {
    e.preventDefault();
    const touch = e.touches[0];
    touchControls.touchStartX = touch.clientX;
    touchStartY = touch.clientY;

    if (!isJumping) {
        isJumping = true;
        velocityY = -20;
    }
}

function handleTouchMove(e) {
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

    if (touchStartY !== null) {
        const touch = e.touches[0];
        const deltaY = touch.clientY - touchStartY;
        if (Math.abs(deltaY) > 50) {
            touchStartY = null;
        }
    }
}

function handleTouchEnd(e) {
    e.preventDefault();
    touchControls.isLeftPressed = false;
    touchControls.isRightPressed = false;
    touchControls.touchStartX = null;
    touchStartY = null;
}

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

function checkCollision(rect1, rect2) {
    return !(
        rect1.right < rect2.left ||
        rect1.left > rect2.right ||
        rect1.bottom < rect2.top ||
        rect1.top > rect2.bottom
    );
}
if (localStorage.getItem('highScore')) {
    highScore = parseInt(localStorage.getItem('highScore'));
}

function updateHighScoreDisplay() {
    highScoreDisplay.textContent = `High Score: ${highScore}`;
}



function handleGameOver() {
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('highScore', highScore);
        updateHighScoreDisplay();
    }
    alert('ゲームオーバー！敵に触れました！');
    resetGame();
}

function handleGameClear() { // ゴール時の処理
    // ... ゴール処理
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('highScore', highScore);
        updateHighScoreDisplay();
    }
}

updateHighScoreDisplay(); // ページ読み込み時に表示

function resetGame() {
    // プレイヤーの初期位置をリセット
    playerPosition = { left: 50, bottom: 100 };
    isJumping = false;
    velocityY = 0;

    // スコアと時間をリセット
    score = 0;
    scoreDisplay.textContent = `Score: ${score}`;
    startTime = Date.now();

    // 敵と火の玉をリセット
    enemies.forEach(enemyObj => enemyObj.element.remove());
    enemies = [];
    createEnemies();

    // キー状態をリセット
    for (const key in keys) {
        keys[key] = false;
    }
    touchControls.isLeftPressed = false;
    touchControls.isRightPressed = false;
    touchControls.touchStartX = null;
    touchStartY = null;

    // 背景をリセット
    backgroundPosition = 0;
    background.style.left = `${backgroundPosition}px`;

    // プレイヤーの位置を更新
    updatePositions();

    // ゲームループを再開
    requestAnimationFrame(gameLoop);
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
class Fire {
    constructor(x, y, direction) {
        this.element = document.createElement('div');
        this.element.classList.add('fire');
        this.element.style.position = 'absolute';
        this.element.style.left = `${x}px`;
        this.element.style.bottom = `${y}px`;
        this.x = x;
        this.y = y;
        this.speed = 10;
        this.direction = direction; // -1: 左方向、1: 右方向
        enemyContainer.appendChild(this.element);
    }

    update() {
        this.x += this.speed * this.direction;
        this.element.style.left = `${this.x}px`;

        // 画面外に出たら削除
        if (this.x < 0 || this.x > game.offsetWidth) {
            this.element.remove();
            return true; // 削除する場合、trueを返す
        }
        return false; // 削除しない場合、falseを返す
    }
}

class FireBreathingEnemy {
    constructor(x, y) {
        this.element = document.createElement('div');
        this.element.classList.add('enemy', 'fire-breathing-enemy');
        this.element.style.position = 'absolute';
        this.element.style.left = `${x}px`;
        this.element.style.bottom = `${y}px`;
        this.x = x;
        this.y = y;
        this.fireBreathInterval = 2000 + Math.random() * 2000; // ランダムで火を吐く間隔
        this.lastFireBreathTime = Date.now();
        enemyContainer.appendChild(this.element);
    }

    move() {
        this.x -= playerSpeed * backgroundSpeed;
        this.element.style.left = `${this.x}px`;

        // 画面外に出たら位置をリセット
        if (this.x < -100) {
            this.x = game.offsetWidth + Math.random() * 500;
        }
    }

    fireBreath() {
        if (Date.now() - this.lastFireBreathTime > this.fireBreathInterval) {
            // 火を生成
            const fire = new Fire(this.x, this.y + 20, -1);
            enemies.push(fire); // 火の玉も敵リストに追加
            this.lastFireBreathTime = Date.now();
        }
    }
}


function createEnemies() {
    for (let i = 0; i < numEnemies; i++) {
        const x = 800 + i * 500;
        if (Math.random() < 0.5) {
            // 火を吐く敵を追加
            enemies.push(new FireBreathingEnemy(x, 100));
        } else {
            // 通常の敵を追加
            const enemy = document.createElement('div');
            enemy.classList.add('enemy');
            enemy.style.position = 'absolute';
            enemy.style.left = `${x}px`;
            enemy.style.bottom = '100px';
            enemy.x = x;
            enemy.y = 100;
            enemyContainer.appendChild(enemy);
            enemies.push({ element: enemy, x: x, y: 100 });
        }
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
    // 敵の移動と火を吐く処理
    enemies.forEach((enemyObj, index) => {
        if (enemyObj instanceof FireBreathingEnemy) {
            enemyObj.move();
            enemyObj.fireBreath();
        } else if (enemyObj instanceof Fire) {
            if (enemyObj.update()) {
                // 画面外に出た火の玉を削除
                enemies.splice(index, 1);
            }
        } else {
            // 通常の敵
            enemyObj.x -= playerSpeed * backgroundSpeed;
            enemyObj.element.style.left = `${enemyObj.x}px`;
            if (enemyObj.x < -100) {
                enemyObj.x = game.offsetWidth + Math.random() * 500;
                enemyObj.passed = false;
            }
        }
    });

    if (keys.ArrowRight || touchControls.isRightPressed) {
        playerPosition.left += playerSpeed;
        console.log("Moving right. Player position:", playerPosition, "Keys:", keys, "Touch Controls:", touchControls);
        playerMoved = true;
    }
    if (keys.ArrowLeft || touchControls.isLeftPressed) {
        playerPosition.left -= playerSpeed;
        console.log("Moving left. Player position:", playerPosition, "Keys:", keys, "Touch Controls:", touchControls);
        playerMoved = true;
    }

    moveEnemies();

    if (playerPosition.left < 0) playerPosition.left = 0;
    if (playerPosition.left > game.offsetWidth - player.offsetWidth) playerPosition.left = game.offsetWidth - player.offsetWidth;

    updatePositions();

     // プレイヤーと火の玉の衝突判定
    const playerRect = player.getBoundingClientRect();
    for (const enemyObj of enemies) {
        if (enemyObj instanceof Fire) {
            const fireRect = enemyObj.element.getBoundingClientRect();
            if (checkCollision(playerRect, fireRect)) {
                handleGameOver();
                return;
            }
        } else if (enemyObj.element) {
            const enemyRect = enemyObj.element.getBoundingClientRect();
            if (checkCollision(playerRect, enemyRect)) {
                handleGameOver();
                return;
            }
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