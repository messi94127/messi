const player = document.getElementById('player');
const game = document.getElementById('game');
const background = document.getElementById('background');
const enemyContainer = document.getElementById('enemy-container');
const goal = document.getElementById('goal');
const scoreDisplay = document.getElementById('score');
const highScoreDisplay = document.getElementById('highScore');

let isJumping = false;
let gravity = 1.5;
let velocityY = 0;
let playerPosition = { left: 50, bottom: 100 };
const playerSpeed = 5;

// Fireオブジェクトとそれ以外の敵オブジェクトを分離 【変更点】
let enemies = [];
let fires = []; // Fireオブジェクトを格納する配列 【変更点】
const numEnemies = 1000;

let startTime;
let score = 0;
let backgroundPosition = 0;
const backgroundSpeed = 0.5;
let highScore = 0;

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

game.addEventListener('touchstart', handleTouchStart, { passive: false });
game.addEventListener('touchmove', handleTouchMove, { passive: false });
game.addEventListener('touchend', handleTouchEnd, { passive: false });

function handleTouchStart(e) { // 変更なし
    e.preventDefault();
    const touch = e.touches[0];
    touchControls.touchStartX = touch.clientX;
    touchStartY = touch.clientY;

    if (!isJumping) {
        isJumping = true;
        velocityY = -20;
    }
}

function handleTouchMove(e) { // 変更なし
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

function handleTouchEnd(e) { // 変更なし
    e.preventDefault();
    touchControls.isLeftPressed = false;
    touchControls.isRightPressed = false;
    touchControls.touchStartX = null;
    touchStartY = null;
}

document.addEventListener('keydown', (e) => { // 変更なし
    if (e.code === 'Space' && !isJumping) {
        isJumping = true;
        velocityY = -20;
    }
    keys[e.code] = true;
});

document.addEventListener('keyup', (e) => { // 変更なし
    keys[e.code] = false;
});

function checkCollision(rect1, rect2) { // 変更なし
    return !(
        rect1.right < rect2.left ||
        rect1.left > rect2.right ||
        rect1.bottom < rect2.top ||
        rect1.top > rect2.bottom
    );
}

if (localStorage.getItem('highScore')) { // 変更なし
    highScore = parseInt(localStorage.getItem('highScore'));
}

function updateHighScoreDisplay() { // 変更なし
    highScoreDisplay.textContent = `High Score: ${highScore}`;
}

class GameObject {
    constructor(x, y, width, height, element) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.element = element;
    }

    getRect() {
        if (this.element) {
            return this.element.getBoundingClientRect();
        } else {
            return {
                left: this.x,
                top: this.y,
                right: this.x + this.width,
                bottom: this.y + this.height,
                width: this.width,
                height: this.height
            };
        }
    }
    move() {
        //GameObject共通の移動処理
    }
}


function handleGameOver(playerRect) { // 変更なし
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('highScore', highScore);
        updateHighScoreDisplay();
    }

    const collidedWithEnemy = enemies.some(enemyObj => {
        if (!enemyObj.element) return false;
        const enemyRect = enemyObj.element.getBoundingClientRect();
        if (!enemyRect) return false;
        return checkCollision(playerRect, enemyRect);
    });

    if (collidedWithEnemy) {
        alert('ゲームオーバー！敵に触れました！');
    } else {
        alert('ゲームオーバー！火の玉に触れました！');
    }
    resetGame();
}

function handleGameClear() { // 変更なし
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('highScore', highScore);
        updateHighScoreDisplay();
    }
}

updateHighScoreDisplay();

function resetGame() { // 変更点：Fireオブジェクトのリセット処理を追加
    playerPosition = { left: 50, bottom: 100 };
    isJumping = false;
    velocityY = 0;

    startTime = Date.now();
    score = 0;
    scoreDisplay.textContent = `Score: ${score}`;

    enemies.forEach(enemyObj => {
        if (enemyObj.element) {
            enemyObj.element.remove();
        }
    });
    enemies = [];
    createEnemies();
    updatePositions();

    for (const key in keys) {
        keys[key] = false;
    }
    touchControls.isLeftPressed = false;
    touchControls.isRightPressed = false;
    touchControls.touchStartX = null;
    touchStartY = null;

    fires.forEach(fire => fire.element.remove()); // Fireオブジェクトのリセット 【追加】
    fires = []; // Fireオブジェクトのリセット 【追加】
}

function updatePositions() { // 変更点：Fireオブジェクトの位置更新を追加
    player.style.left = `${playerPosition.left}px`;
    player.style.bottom = `${playerPosition.bottom}px`;
    enemies.forEach(enemyObj => {
        if (enemyObj.element) {
            enemyObj.element.style.left = `${enemyObj.x}px`;
        }
    });
    fires.forEach(fire => fire.element.style.left = `${fire.x}px`); // Fireオブジェクトの位置更新 【追加】
}

function moveBackground() { // 変更なし
    backgroundPosition -= playerSpeed * backgroundSpeed;
    background.style.left = `${backgroundPosition}px`;
    if (backgroundPosition <= -background.offsetWidth / 2) {
        backgroundPosition += background.offsetWidth / 2;
    }
}

// ... (前略)

class Fire extends GameObject {
    constructor(x, y, direction) {
        // super() を最初に呼び出す 【修正点】
        super(x, y, 20, 20); // Fireオブジェクトの幅と高さを設定 【修正点】

        this.element = document.createElement('div');
        if (!this.element) {
            console.error("element is null");
        }
        this.element.classList.add('fire');
        this.element.style.position = 'absolute';
        this.element.style.left = `${x}px`;
        this.y = y - 20;
        this.element.style.bottom = `${this.y}px`;
        this.x = x;
        this.speed = 5;
        this.direction = direction;
        enemyContainer.appendChild(this.element);
    }

    move() {
        this.x += this.speed * this.direction;
        this.element.style.left = `${this.x}px`;

        if (this.x < 0 || this.x > game.offsetWidth) {
            this.element.remove();
            return true;
        }
        return false;
    }

    getRect() {
        return {
            left: this.x,
            top: this.y,
            right: this.x + 20,
            bottom: this.y + 20
        };
    }
}


class FireBreathingEnemy extends GameObject { // 変更なし
    constructor(x, y) {
        const element = document.createElement('div');
        element.classList.add('enemy', 'fire-breathing-enemy');
        element.style.position = 'absolute';
        element.style.left = `${x}px`;
        element.style.bottom = `${y}px`;
        enemyContainer.appendChild(element);
        super(x, y, 50, 50, element);
        this.fireBreathInterval = 2000 + Math.random() * 2000;
        this.lastFireBreathTime = Date.now();
    }
    move() {
        this.x -= playerSpeed * backgroundSpeed;
        this.element.style.left = `${this.x}px`;
        if (this.x < -100) {
            this.x = game.offsetWidth + Math.random() * 500;
        }
    }
    fireBreath() {
        if (Date.now() - this.lastFireBreathTime > this.fireBreathInterval) {
            const fire = new Fire(this.x, this.y + 20, -1); // Fireオブジェクト生成
            fires.push(fire); // fires配列に追加
            this.lastFireBreathTime = Date.now();
        }
    }
}

class FastEnemy extends GameObject { // 変更なし
    constructor(x, y) {
        const element = document.createElement('div');
        element.classList.add('enemy', 'fast-enemy');
        element.style.position = 'absolute';
        element.style.left = `${x}px`;
        element.style.bottom = `${y}px`;
        enemyContainer.appendChild(element);
        super(x, y, 50, 50, element);
        this.speed = playerSpeed * backgroundSpeed * 2;
    }
    move() {
        this.x -= this.speed;
        this.element.style.left = `${this.x}px`;
        if (this.x < -100) {
            this.x = game.offsetWidth + Math.random() * 500;
        }
    }
}

class Enemy extends GameObject { // 変更なし
    constructor(x, y) {
        const element = document.createElement('div');
        element.classList.add('enemy');
        element.style.position = 'absolute';
        element.style.left = `${x}px`;
        element.style.bottom = `${y}px`;
        enemyContainer.appendChild(element);
        super(x, y, 50, 50, element);
    }
    move() {
        this.x -= playerSpeed * backgroundSpeed;
        this.element.style.left = `${this.x}px`;
        if (this.x < -100) {
            this.x = game.offsetWidth + Math.random() * 500;
        }
    }
}

function createEnemies() { // 変更なし
    for (let i = 0; i < numEnemies; i++) {
        const x = 800 + i * 500;
        const enemyType = Math.random();
        if (enemyType < 0.33) {
            enemies.push(new Enemy(x, 100));
        } else if (enemyType < 0.66) {
            enemies.push(new FireBreathingEnemy(x, 100));
        } else {
            enemies.push(new FastEnemy(x, 100));
        }
    }
}

function moveEnemies() { // 変更なし
    enemies.forEach(enemyObj => {
        if (typeof enemyObj.move === 'function') {
            enemyObj.move();
        }
    });
}

function checkXOverlap(playerRect, enemyRect) { // 変更なし
    const playerCenterX = playerRect.left + playerRect.width / 2;
    const enemyCenterX = enemyRect.left + enemyRect.width / 2;
    const overlapWidth = (playerRect.width + enemyRect.width) / 2;
    return Math.abs(playerCenterX - enemyCenterX) < overlapWidth * 0.8;
}

// ... (前略)

function gameLoop() {
    // ... (ジャンプ、移動処理は変更なし)
    if (isJumping) {
        velocityY += gravity; // 重力を加算
        playerPosition.bottom -= velocityY;

        // 地面との衝突判定を追加 【重要な修正】
        if (playerPosition.bottom <= 100) {
            playerPosition.bottom = 100;
            isJumping = false;
            velocityY = 0; // 着地時にvelocityYをリセット 【重要な修正】
        }

        // 空中での左右移動をスムーズにするため、係数を追加
        const airControl = 0.1;
        if (keys.ArrowRight || touchControls.isRightPressed) {
            playerPosition.left += playerSpeed * airControl;
        }
        if (keys.ArrowLeft || touchControls.isLeftPressed) {
            playerPosition.left -= playerSpeed * airControl;
        }
    } else {
        // 地上にいるときの左右移動
        if (keys.ArrowRight || touchControls.isRightPressed) {
            playerPosition.left += playerSpeed;
        }
        if (keys.ArrowLeft || touchControls.isLeftPressed) {
            playerPosition.left -= playerSpeed;
        }
    }

    let playerMoved = false;
    // ... (移動処理は変更なし)

    if (playerMoved) {
        moveBackground();
    }

    // 敵とFireオブジェクトの移動と処理を分離 【変更点】
    for (let i = enemies.length - 1; i >= 0; i--) {
        enemies[i].move();
        if (enemies[i] instanceof FireBreathingEnemy) {
            enemies[i].fireBreath();
        }
    }

    for (let i = fires.length - 1; i >= 0; i--) { // Fireオブジェクトの移動と削除 【変更点】
        if (fires[i].move()) {
            fires.splice(i, 1);
            i--; // spliceで配列の要素が削除されたので、インデックスを調整
        }
    }

    updatePositions();

    if (playerPosition.left < 0) playerPosition.left = 0; // 変更なし
    if (playerPosition.left > game.offsetWidth - player.offsetWidth) playerPosition.left = game.offsetWidth - player.offsetWidth; // 変更なし

    moveEnemies(); // 変更なし

    // 衝突判定の最適化 【変更点】
    const playerRect = player.getBoundingClientRect(); // キャッシュではなく毎フレーム取得 【変更点】
    const enemiesToRemove = [];
    let gameOver = false;

    // 敵との衝突判定 【変更点】
    for (const enemyObj of enemies) {
        const enemyRect = enemyObj.getRect();
        if (checkXOverlap(playerRect, enemyRect) &&
            playerRect.bottom >= enemyRect.top - 10 &&
            playerRect.bottom <= enemyRect.top + 10 &&
            velocityY > 0) {
            score += 100;
            scoreDisplay.textContent = `Score: ${score}`;
            enemiesToRemove.push(enemyObj);
            velocityY = -15;
        } else if (checkCollision(playerRect, enemyRect)) {
            gameOver = true;
            break;
        }
    }

    if (gameOver) {
        handleGameOver(playerRect);
    } else {
        enemies = enemies.filter(enemyObj => !enemiesToRemove.includes(enemyObj));
        enemiesToRemove.forEach(enemyObj => {
            if (enemyObj.element) {
                enemyObj.element.remove();
            }
        });
    }

    // Fireオブジェクトとの衝突判定 【変更点】
    for (let i = fires.length - 1; i >= 0; i--) {
        const fire = fires[i];
        const fireRect = fire.getRect();
        if (checkCollision(playerRect, fireRect)) {
            gameOver = true;
            fires.splice(i, 1);
            fire.element.remove();
            break;
        }
    }

    if (gameOver) {
        handleGameOver(playerRect);
    }

    const goalRect = goal.getBoundingClientRect(); // 変更なし
    if (checkCollision(playerRect, goalRect)) {
        const endTime = Date.now();
        score = Math.floor((endTime - startTime) / 1000);
        alert(`ゴール！おめでとうございます！スコア: ${score}秒`);
        resetGame();
    }

    requestAnimationFrame(gameLoop);
}

resetGame(); // 変更なし
gameLoop(); // 変更なし