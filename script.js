const player = document.getElementById('player');
const game = document.getElementById('game');
const background = document.getElementById('background');
const enemyContainer = document.getElementById('enemy-container');
const goal = document.getElementById('goal');
const scoreDisplay = document.getElementById('score');

let isJumping = false;
let isInvincible = false;
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

let enemySpacing = 300; // 敵の間隔デフォルト
let enemySpeedMultiplier = 1; // 敵スピードの倍率デフォルト

// ゲーム開始メッセージを管理
const startMessage = document.getElementById('startMessage');
let isGameStarted = false;

let isJumpBoosted = false;
let originalJumpPower = -20; // 元のジャンプ力
let boostedJumpPower = -60; // ジャンプ力3倍
let jumpBoostTimeout = null; // 効果終了タイマー

const difficultySettings = {
    easy: {
        enemySpacing: 500,
        enemySpeedMultiplier: 0.4,
        label: '低 (Easy)',
    },
    medium: {
        enemySpacing: 300,
        enemySpeedMultiplier: 0.45,
        label: '中 (Medium)',
    },
    hard: {
        enemySpacing: 200,
        enemySpeedMultiplier: 0.5,
        label: '高 (Hard)',
    },
};

// // メッセージをクリックまたはキー押下で非表示にしてゲーム開始
// startMessage.addEventListener('click', hideStartMessageAndStartGame);
// document.addEventListener('keydown', hideStartMessageAndStartGame);

// ゲームロード時に開始メッセージを表示
window.onload = () => {
    showStartMessage();
};

document.addEventListener('keydown', (event) => {
    console.log(`Key pressed: ${event.key}`);
    handleDifficultySelection(event);
});

document.addEventListener('touchstart', (event) => {
    console.log('Touch detected');
    handleTouchDifficultySelection(event);
});

// イベントリスナーの追加方法を変更 (touchstart、touchmove、touchendをgame要素に直接追加)
game.addEventListener('touchstart', handleTouchStart, { passive: false });
game.addEventListener('touchmove', handleTouchMove, { passive: false });
game.addEventListener('touchend', handleTouchEnd, { passive: false });

function showStartMessage() {
    const startMessage = document.getElementById('startMessage');
    if (!startMessage) {
        console.error('startMessage element not found');
        return;
    }

    startMessage.classList.add('visible');
    startMessage.innerHTML = `
        <p>ようこそ！ゲームの難易度を選択してください...</p>
        <div id="difficulty-buttons">
            <button id="easyButton" class="difficulty-button">1: 低 (Easy)</button>
            <button id="mediumButton" class="difficulty-button">2: 中 (Medium)</button>
            <button id="hardButton" class="difficulty-button">3: 高 (Hard)</button>
        </div>
    `;

    // 各ボタンにクリックとタッチイベントリスナーを登録
    const addButtonEvent = (buttonId, difficulty) => {
        const button = document.getElementById(buttonId);
        button.addEventListener('click', () => startGameWithDifficulty(difficulty));
        button.addEventListener('touchstart', () => startGameWithDifficulty(difficulty));
    };

    addButtonEvent('easyButton', 'easy');
    addButtonEvent('mediumButton', 'medium');
    addButtonEvent('hardButton', 'hard');
}

function applyJumpBoost(duration = 5000) {
    if (isJumpBoosted) {
        // 既に効果中の場合はタイマーをリセット
        clearTimeout(jumpBoostTimeout);
    } else {
        // 初回の効果適用
        isJumpBoosted = true;
        player.classList.add('boosted'); // 見た目の変化を付ける場合
    }

    // ジャンプ力を変更
    originalJumpPower = velocityY; // 現在のジャンプ力を保存
    velocityY = boostedJumpPower; // 強化されたジャンプ力を適用

    // 一定時間後にジャンプ力を元に戻す
    jumpBoostTimeout = setTimeout(() => {
        isJumpBoosted = false;
        velocityY = originalJumpPower; // ジャンプ力を元に戻す
        player.classList.remove('boosted'); // 見た目を元に戻す
    }, duration);
}
// function selectDifficulty(selectedDifficulty) {
//     difficulty = selectedDifficulty;

//     switch (difficulty) {
//         case 'easy':
//             enemySpacing = 500; // 敵の間隔を広げる
//             enemySpeedMultiplier = 0.3; // 敵のスピードを低下
//             break;
//         case 'medium':
//             enemySpacing = 300; // デフォルトの間隔
//             enemySpeedMultiplier = 0.5; // デフォルトのスピード
//             break;
//         case 'hard':
//             enemySpacing = 150; // 敵の間隔を狭くする
//             enemySpeedMultiplier = 1.0; // 敵のスピードを速く
//             break;
//     }

//     // ゲームを開始
//     hideStartMessageAndStartGame();
// }
function applyDifficulty(difficultyKey) {
    const settings = difficultySettings[difficultyKey];
    if (!settings) {
        console.error('無効な難易度設定:', difficultyKey);
        return;
    }

    // 設定を適用
    enemySpacing = settings.enemySpacing;
    enemySpeedMultiplier = settings.enemySpeedMultiplier;

    console.log(`難易度設定: ${settings.label}`);
}

function handleDifficultySelection(event) {
    if (isGameStarted) return;

    let difficultyKey;
    switch (event.key) {
        case '1':
            difficultyKey = 'easy';
            break;
        case '2':
            difficultyKey = 'medium';
            break;
        case '3':
            difficultyKey = 'hard';
            break;
        default:
            return;
    }

    startGameWithDifficulty(difficultyKey);
}

function handleTouchDifficultySelection(event) {
    if (isGameStarted) return;

    const touchX = event.touches[0].clientX;
    const screenWidth = window.innerWidth;

    let difficultyKey;
    if (touchX < screenWidth / 3) {
        difficultyKey = 'easy';
    } else if (touchX < (screenWidth * 2) / 3) {
        difficultyKey = 'medium';
    } else {
        difficultyKey = 'hard';
    }

    startGameWithDifficulty(difficultyKey);
}

function startGameWithDifficulty(difficultyKey) {
    console.log(`Start game with difficulty: ${difficultyKey}`); // デバッグ用
    applyDifficulty(difficultyKey); // 難易度設定を適用
    displaySelectedDifficulty(difficultyKey); // 選択された難易度を表示

    setTimeout(() => {
        hideStartMessageAndStartGame(); // メッセージを削除してゲームを開始
    }, 1000);
}

function displaySelectedDifficulty(difficultyKey) {
    const settings = difficultySettings[difficultyKey];
    const startMessage = document.getElementById('startMessage');

    startMessage.innerHTML = `<p>選択された難易度: <span class="highlight">${settings.label}</span></p>`;
    startMessage.classList.add('fadeOut');
}

// メッセージを非表示にしてゲームを開始する関数
function hideStartMessageAndStartGame() {
    if (isGameStarted) return;
    isGameStarted = true;

    const startMessage = document.getElementById('startMessage');
    if (startMessage) {
        console.log('Removing start message...'); // デバッグ用ログ
        startMessage.classList.remove('visible');
        startMessage.remove(); // DOMから完全に削除
    } else {
        console.error('Start message element not found');
    }

    resetGame();
    requestAnimationFrame(gameLoop);
}


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
        this.speed = 16 * enemySpeedMultiplier;
        this.scoreValue = 100; // この敵を倒したときに加算するスコア
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
        this.scoreValue = 50; // この敵を倒したときに加算するスコア
    }
    move() {
        this.x -= playerSpeed * enemySpeedMultiplier;
        this.element.style.left = `${this.x}px`;
        if (this.x < -100) {
            this.x = game.offsetWidth + Math.random() * 500;
        }
    }
}

class JumpingEnemy extends GameObject {
    constructor(x, y) {
        const element = document.createElement('div');
        element.classList.add('enemy', 'jumping-enemy');
        element.style.position = 'absolute';
        element.style.left = `${x}px`;
        element.style.bottom = `${y}px`;
        enemyContainer.appendChild(element);
        super(x, y, 50, 50, element);
        this.jumpHeight = 5; // ジャンプの高さ
        this.isJumping = false;
        this.gravity = 1.5;
        this.velocityY = 0;
        this.groundY = y; // 初期の地面の高さ
        this.scoreValue = 200; // この敵を倒したときに加算するスコア
    }

    move() {
        // ジャンプロジック
        if (!this.isJumping) {
            this.isJumping = true;
            this.velocityY = -15; // ジャンプ初速度
        }

        if (this.isJumping) {
            this.velocityY += this.gravity; // 重力の影響を追加
            this.y -= this.velocityY;

            // 地面に戻ったらジャンプを終了
            if (this.y <= this.groundY) {
                this.y = this.groundY;
                this.isJumping = false;
                this.velocityY = 0;
            }
        }

        // 左方向への移動
        this.x -= playerSpeed * enemySpeedMultiplier;
        if (this.x < -100) {
            this.x = game.offsetWidth + Math.random() * 500; // 再配置
        }

        // DOMに反映
        this.element.style.left = `${this.x}px`;
        this.element.style.bottom = `${this.y}px`;
    }
}

class RandomMovingEnemy extends GameObject {
    constructor(x, y) {
        const element = document.createElement('div');
        element.classList.add('enemy', 'random-moving-enemy');
        element.style.position = 'absolute';
        element.style.left = `${x}px`;
        element.style.bottom = `${y}px`;
        enemyContainer.appendChild(element);
        super(x, y, 50, 50, element);

        // 左方向の基準速度
        this.baseSpeedX = -2; // 左方向への基準速度

        // 横方向ランダム速度を初期値として設定
        const maxRandomSpeedX = 0.2; // 横方向ランダム速度の上限
        this.randomSpeedX = Math.max(Math.min((Math.random() - 0.5) * 0.4, maxRandomSpeedX), -maxRandomSpeedX);

        // 縦方向の速度（縦移動が小さくなりすぎないように制御）
        const downProbability = 0.5; // 下に動く確率（95%に設定）
        const maxRandomSpeedY = 1.0; // 縦方向ランダム速度の上限（値を増加）
        const minSpeedY = 0.5; // 縦方向ランダム速度の最低値（絶対値を増加）

        if (Math.random() < downProbability) {
            // 下方向への速度（最低値以上に設定）
            this.speedY = -Math.max(Math.random() * maxRandomSpeedY, minSpeedY);
        } else {
            // 上方向の速度（最低値以上に設定）
            this.speedY = Math.max(Math.random() * maxRandomSpeedY, minSpeedY);
        }

        // 縦方向の速度が小さすぎないか最終確認
        if (Math.abs(this.speedY) < minSpeedY) {
            this.speedY = this.speedY > 0 ? minSpeedY : -minSpeedY; // 最小速度を適用
        }

        // ジャンプの高さと確率を初期値として設定
        const minJumpHeight = 5; // ジャンプ高さの下限
        const maxJumpHeight = 8; // ジャンプ高さの上限
        this.jumpHeight = Math.random() * (maxJumpHeight - minJumpHeight) + minJumpHeight;
        this.jumpProbability = Math.random() * 0.02; // ジャンプ確率をさらに減少

        // 制限値
        this.boundX = game.offsetWidth; // 水平方向の制限
        this.boundY = 300; // 垂直方向の制限

        // 倒したときのスコア
        this.scoreValue = 1000;
    }

    move() {
        // 左方向の基準速度にランダム成分を加えて移動（固定された初期値のみ使用）
        this.x += this.baseSpeedX + this.randomSpeedX;

        // 縦方向の移動（固定された初期値のみ使用）
        this.y += this.speedY;

        // 初期設定された確率でジャンプ（固定された初期値を使用）
        if (Math.random() < this.jumpProbability) {
            this.speedY = this.jumpHeight;
        }

        // 画面端で反転（必要に応じて調整）
        if (this.y < 0 || this.y > this.boundY) {
            this.speedY = -this.speedY; // 垂直方向の反転
        }

        // DOM に反映
        this.element.style.left = `${this.x}px`;
        this.element.style.bottom = `${this.y}px`;

        // 画面外に出たら削除フラグを返す
        if (this.x < -50) { // 画面外に出たら削除（左端）
            this.element.remove();
            return true; // 削除フラグ
        }
        return false;
    }
}

class JumpBoostItem extends GameObject {
    constructor(x, y) {
        const element = document.createElement('div');
        element.classList.add('jump-boost-item');
        element.style.position = 'absolute';

        // y座標をプレイヤーが届く高さに制限
        const minY = 100; // プレイヤーの地面の高さ
        const maxY = 200; // プレイヤーがジャンプで届く高さ
        y = Math.min(Math.max(y, minY), maxY);

        element.style.left = `${x}px`;
        element.style.bottom = `${y}px`;
        enemyContainer.appendChild(element);
        super(x, y, 30, 30, element); // サイズを小さめに設定
        this.scoreValue = 500; // この敵を倒したときに加算するスコア
    }

    move() {
        // 左方向への移動
        this.x -= playerSpeed * backgroundSpeed;
        this.element.style.left = `${this.x}px`;

        // 画面外に出たら削除
        if (this.x < -30) {
            this.element.remove();
            return true;
        }
        return false;
    }
}

function createEnemies() {
    for (let i = 0; i < numEnemies; i++) {
        const x = 800 + i * enemySpacing;
        const enemyType = Math.random();
        if (enemyType < 0.25) {
            enemies.push(new Enemy(x, 100));
        } else if (enemyType < 0.5) {
            enemies.push(new FastEnemy(x, 100));
        } else if (enemyType < 0.75) {
            enemies.push(new JumpingEnemy(x, 100));
        } else if (enemyType < 0.85) {
            enemies.push(new RandomMovingEnemy(x, Math.random() * 400));
        } else if (enemyType < 0.95) { // 確率を調整して追加
            enemies.push(new JumpBoostItem(x, Math.random() * 400)); // ジャンプブーストアイテム
        } else {
            enemies.push(new InvincibleItem(x, 100));
        }
    }
}

function moveEnemies() {
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemyObj = enemies[i];
        if (typeof enemyObj.move === 'function') {
            const shouldRemove = enemyObj.move(); // アイテムや敵を左に移動
            if (shouldRemove) {
                enemies.splice(i, 1); // 画面外の敵やアイテムをリストから削除
            }
        }
    }
}

class InvincibleItem extends GameObject {
    constructor(x, y) {
        const element = document.createElement('div');
        element.classList.add('invincible-item');
        element.style.position = 'absolute';
        element.style.left = `${x}px`;
        element.style.bottom = `${y}px`;
        enemyContainer.appendChild(element);
        super(x, y, 30, 30, element); // サイズを小さめに設定
        this.scoreValue = 500; // この敵を倒したときに加算するスコア
    }

    move() {
        this.x -= playerSpeed * backgroundSpeed; // 左に移動
        this.element.style.left = `${this.x}px`;

        // 画面外に出たら削除
        if (this.x < -30) {
            this.element.remove();
            return true; // 移動が終わった（削除が必要）ことを示す
        }
        return false;
    }
}
function setInvincible(duration = 5000) {
    if (isInvincible) {
        console.log('Already invincible: Extending duration');
        clearTimeout(invincibleTimeout); // 既存のタイマーをキャンセル
    } else {
        isInvincible = true;
        player.classList.add('invincible'); // クラスを追加して画像を切り替える
        console.log('Invincible activated');
    }

    invincibleTimeout = setTimeout(() => {
        isInvincible = false;
        player.classList.remove('invincible'); // クラスを削除して元の画像に戻す
        console.log('Invincible deactivated');
    }, duration);
}
function checkXOverlap(playerRect, enemyRect) {
    const playerCenterX = playerRect.left + playerRect.width / 2;
    const enemyCenterX = enemyRect.left + enemyRect.width / 2;
    const overlapWidth = (playerRect.width + enemyRect.width) / 2;

    // 高速な敵ほど余裕を持たせる
    const overlapThreshold = (enemyRect.speed && enemyRect.speed > 10) ? 0.9 : 0.8;

    return Math.abs(playerCenterX - enemyCenterX) < overlapWidth * overlapThreshold;
}
function stopOtherAudio(currentAudio) {
    const allAudioElements = document.querySelectorAll('audio');
    allAudioElements.forEach(audio => {
        if (audio !== currentAudio && !audio.paused) {
            audio.pause(); // 他の音声を停止
        }
    });
}

async function submitHighScore(username, score) {
    const data = { username, score };
    await fetch('https://api.github.com/repos/messi94127/messi/contents/highscores.json', {
        method: 'PUT',
        headers: {
            'Authorization': `token YOUR_PERSONAL_ACCESS_TOKEN`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            message: 'Update high scores',
            content: btoa(JSON.stringify(data)), // Base64エンコード
            sha: CURRENT_FILE_SHA // 現在のファイルSHAを取得して使用
        })
    });
}
async function fetchHighScores() {
    const response = await fetch('https://raw.githubusercontent.com/messi94127/messi/main/highscores.json');
    if (response.ok) {
        const highScores = await response.json();
        displayHighScores(highScores);
    } else {
        console.error("ハイスコアの取得に失敗しました");
    }
}
function displayHighScores(highScores) {
    const scoreList = document.getElementById('highScoreList');
    scoreList.innerHTML = '';
    highScores.forEach((score, index) => {
        const listItem = document.createElement('li');
        listItem.textContent = `${index + 1}. ${score.username}: ${score.score}`;
        scoreList.appendChild(listItem);
    });
}

// ページロード時にハイスコアを取得して表示
fetchHighScores();

function gameLoop() {
    console.log('Game loop running'); // デバッグ用ログ
    if (!isGameStarted) {
        // ゲームが開始されていない間は、次のフレームを待機
        // requestAnimationFrame(gameLoop);
        return;
    }
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

        // ジャンプブーストアイテムに触れた場合
        if (enemyObj instanceof JumpBoostItem) {
            if (checkCollision(playerRect, enemyRect)) {
                applyJumpBoost(); // ジャンプ力を増加
                enemiesToRemove.push(enemyObj); // アイテムを削除対象に追加
                break;
            }
        }

        // 効果音オーディオ要素を取得
        const kuririSound = document.getElementById('kuririSound');
        // console.log(kuririSound);
        if (enemyObj instanceof InvincibleItem) {
            // アイテムに当たった場合
            if (checkCollision(playerRect, enemyRect)) {
                setInvincible(); // 無敵状態を有効化
                enemiesToRemove.push(enemyObj); // アイテムを削除対象に追加

                // 再生中フラグをチェック
                if (!kuririSound.paused && !kuririSound.ended) {
                    console.warn('kuririSound is already playing, skipping new play() request.');
                } else {
                    kuririSound.currentTime = 0; // 再生位置をリセット
                    kuririSound.play().catch(error => {
                        console.error('Playback error:', error.message); // エラーの詳細をログ
                    });
                }

                break; // 複数同時取得を防ぐ
            }
        }
        // if (!isInvincible) {
        //     // if (checkCollision(playerRect, enemyRect)) {
        //     //     gameOver = true; // 無敵状態でない場合にゲームオーバー
        //     //     break;
        //     // }
        // } else {
        //     console.log('Invincible: No collision effect'); // デバッグ用ログ
        //     break;
        // }
        // if (!isInvincible && checkCollision(playerRect, enemyRect)) {
        //     gameOver = true; // 無敵状態でない場合のみゲームオーバーになる
        //     break;
        // }

        // if (enemyObj instanceof Fire) {
        //     const fireRect = enemyObj.element.getBoundingClientRect();
        //     if (checkCollision(playerRect, fireRect)) {
        //         gameOver = true;
        //         enemyObj.element.remove(); // DOMから削除
        //     break;
        //     }
        // }
        // 効果音オーディオ要素を取得
        const jumpOnEnemySound = document.getElementById('jumpOnEnemySound');

        if (checkXOverlap(playerRect, enemyRect) &&
            playerRect.bottom >= enemyRect.top - Math.abs(velocityY * 1.5) && // プレイヤーの底面が敵の上面に近い (速度依存の範囲)
            playerRect.bottom <= enemyRect.top + Math.abs(velocityY * 1.5) && // 許容範囲内 (速度依存の範囲)
            velocityY > -10) {
            score += enemyObj.scoreValue;
            scoreDisplay.textContent = `Score: ${score}`;
            enemiesToRemove.push(enemyObj);

            // 効果音を再生
            jumpOnEnemySound.currentTime = 0; // 再生位置をリセット
            jumpOnEnemySound.play();
            velocityY = -20;
            if (isInvincible) {
                break;
            }
        } else if (isInvincible) {
            //何もしない
        }
        else if (checkCollision(playerRect, enemyRect)) {
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