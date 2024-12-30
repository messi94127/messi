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
const numEnemies = 1000;

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

class GameObject {
    constructor(x, y, width, height, element) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.element = element; // DOM要素への参照を保持
    }

    getRect() {
        if (this.element) {
            const rect = this.element.getBoundingClientRect();
            return {
                left: rect.left,
                top: rect.top,
                right: rect.right,
                bottom: rect.bottom,
                width: rect.width,
                height: rect.height
            };
        } else {
            return {
                left: this.x,
                top: this.y,
                right: this.x + this.width,
                bottom: this.y + this.height,
                width: this.width,
                height: this.height
            }
        }
    }
    move() {
        //GameObject共通の移動処理
    }
}


function handleGameOver(playerRect) { // playerRectを引数として受け取る
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('highScore', highScore);
        updateHighScoreDisplay();
    }

    const collidedWithEnemy = enemies.some(enemyObj => {
        if (!enemyObj.element) return false;
        const enemyRect = enemyObj.element.getBoundingClientRect();
        if (!enemyRect) return false;
        return checkCollision(playerRect, enemyRect); // playerRectを使用
    });

    if (collidedWithEnemy) {
        alert('ゲームオーバー！敵に触れました！');
    } else {
        alert('ゲームオーバー！火の玉に触れました！');
    }
    resetGame();
}

function handleGameClear() { // ゴール時の処理
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

    startTime = Date.now();
    score = 0;
    scoreDisplay.textContent = `Score: ${score}`;

    // 敵と火の玉をリセット（修正）
    enemies.forEach(enemyObj => {
        if (enemyObj.element) { // elementが存在するか確認
            enemyObj.element.remove();
        }
    });
    enemies = [];
    createEnemies();
    updatePositions();

    // キー状態をリセット
    for (const key in keys) {
        keys[key] = false;
    }
    touchControls.isLeftPressed = false;
    touchControls.isRightPressed = false;
    touchControls.touchStartX = null;
    touchStartY = null;
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
        if (!this.element) {
            console.error("element is null");
        }
        this.element.classList.add('fire');
        this.element.style.position = 'absolute';
        this.element.style.left = `${x}px`;
        this.y = y - 20; // ★修正
        this.element.style.bottom = `${this.y}px`;
        this.x = x;
        this.speed = 2;
        this.direction = direction;
        enemyContainer.appendChild(this.element);
        console.log("element appended to enemyContainer:", this.element);
        if (!enemyContainer.contains(this.element)) {
            console.error("child was not appended to container", enemyContainer, this.element);
        }
    }

    move() {
        this.x += this.speed * this.direction;
        this.element.style.left = `${this.x}px`;

        if (this.x < 0 || this.x > game.offsetWidth) {
            this.element.remove();
            return true; // ★修正
        }
        return false;
    }

    getRect() {
        return {
            left: this.x,
            top: this.y + 20, // ★修正
            right: this.x + 20,
            bottom: this.y
        };
    }
}
class FireBreathingEnemy extends GameObject {
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
            const fire = new Fire(this.x, this.y + 20, -1);
            console.log("Fire object created:", fire); // ★追加 (Fireオブジェクトの中身を確認)
            console.log("Fire object element:", fire.element) //★追加 (Fireオブジェクトのelementを確認)
            enemies.push(fire);
            console.log("Enemies array after push:", enemies); // ★追加 (enemies配列全体を確認)
            this.lastFireBreathTime = Date.now();
        }
    }
}

class FastEnemy extends GameObject {
    constructor(x, y) {
        const element = document.createElement('div');
        element.classList.add('enemy', 'fast-enemy');
        element.style.position = 'absolute';
        element.style.left = `${x}px`;
        element.style.bottom = `${y}px`;
        enemyContainer.appendChild(element);
        super(x, y, 50, 50, element);
        this.speed = 8;
    }
    move() {
        this.x -= this.speed;
        this.element.style.left = `${this.x}px`;
        if (this.x < -100) {
            this.x = game.offsetWidth + Math.random() * 500;
        }
    }
}
class Enemy extends GameObject {
    constructor(x, y) {
        const element = document.createElement('div');
        element.classList.add('enemy');
        element.style.position = 'absolute';
        element.style.left = `${x}px`;
        element.style.bottom = `${y}px`;
        enemyContainer.appendChild(element);
        super(x, y, 50, 50, element); // 親クラスのコンストラクタを呼び出す
        this.speed = 10;
    }
    move() {
        this.x -= playerSpeed * backgroundSpeed;
        this.element.style.left = `${this.x}px`;
        if (this.x < -100) {
            this.x = game.offsetWidth + Math.random() * 500;
        }
    }
}



function createEnemies() {
    for (let i = 0; i < numEnemies; i++) {
        const x = 800 + i * 500;
        const enemyType = Math.random();
        if (enemyType < 0.33) {
            enemies.push(new Enemy(x, 100)); // 通常の敵をインスタンスとして追加
        // } else if (enemyType < 0.66) {
        //     enemies.push(new FireBreathingEnemy(x, 100));
        } 
        else{
            enemies.push(new FastEnemy(x, 100));
        }
    }
}

function moveEnemies() {
    enemies.forEach(enemyObj => {
        // enemyObj が move メソッドを持っているか確認
        if (typeof enemyObj.move === 'function') {
            enemyObj.move();
        }

        // または、特定の敵の種類を反復処理する場合
        // if (enemyObj instanceof FireBreathingEnemy || enemyObj instanceof FastEnemy) {
        //   enemyObj.move();
        // }
    });
}

function checkXOverlap(playerRect, enemyRect) {
    const playerCenterX = playerRect.left + playerRect.width / 2;
    const enemyCenterX = enemyRect.left + enemyRect.width / 2;
    const overlapWidth = (playerRect.width + enemyRect.width) / 2;
    return Math.abs(playerCenterX - enemyCenterX) < overlapWidth * 0.8;//0.8は重なり具合の調整
}

function gameLoop() {
    if (isJumping) {
        velocityY += gravity;
        playerPosition.bottom -= velocityY;
        if (playerPosition.bottom <= 100) {
            playerPosition.bottom = 100;
            isJumping = false;
        }
        const airControl = 0.1;
        if (keys.ArrowRight || touchControls.isRightPressed) {
            playerPosition.left += playerSpeed * airControl;
        }
        if (keys.ArrowLeft || touchControls.isLeftPressed) {
            playerPosition.left -= playerSpeed * airControl;
        }
    } else { // 接地時のみの処理
        if (keys.ArrowRight || touchControls.isRightPressed) {
            playerPosition.left += playerSpeed;
        }
        if (keys.ArrowLeft || touchControls.isLeftPressed) {
            playerPosition.left -= playerSpeed;
        }
    }

    // 移動処理はここに集約
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

    // 敵の移動と火を吐く処理 (Fireオブジェクトの移動処理を追加)
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemyObj = enemies[i];
        if (enemyObj instanceof FireBreathingEnemy) {
            enemyObj.fireBreath();
        } else if (enemyObj instanceof Fire) { // Fireオブジェクトの移動
            if (enemyObj.move()) { //画面外に出たら削除
                enemies.splice(i, 1);
                enemyObj.element.remove();
            }
        }
    }
    updatePositions();

    if (playerPosition.left < 0) playerPosition.left = 0;
    if (playerPosition.left > game.offsetWidth - player.offsetWidth) playerPosition.left = game.offsetWidth - player.offsetWidth;

    moveEnemies();


    // 衝突判定ループ
    const playerRect = player.getBoundingClientRect();
    const enemiesToRemove = [];
    let gameOver = false;

    // 敵と火の玉の衝突判定
    for (const enemyObj of enemies) {
        if (!enemyObj) continue;

        const enemyRect = enemyObj.getRect();
        if (!enemyRect) continue;

        if (enemyObj instanceof Fire) {
            const fireRect = enemyObj.element.getBoundingClientRect();
            if (checkCollision(playerRect, fireRect)) {
                gameOver = true;
                enemyObj.element.remove(); // DOMから削除
            break;
            }
        }

        if (checkXOverlap(playerRect, enemyRect) &&
            playerRect.bottom >= enemyRect.top - 10 &&
            playerRect.bottom <= enemyRect.top + 10 &&
            velocityY > 0) {
            score += 100;
            scoreDisplay.textContent = `Score: ${score}`;
            enemiesToRemove.push(enemyObj);
            velocityY = -15;
        } else if(checkCollision(playerRect, enemyRect)) {
            // 通常の敵との衝突
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