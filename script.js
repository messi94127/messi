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

// ゲーム開始メッセージを管理
const startMessage = document.getElementById('startMessage');
let isGameStarted = false;

// メッセージをクリックまたはキー押下で非表示にしてゲーム開始
startMessage.addEventListener('click', hideStartMessageAndStartGame);
document.addEventListener('keydown', hideStartMessageAndStartGame);

// ゲームロード時に開始メッセージを表示
window.onload = () => {
    showStartMessage();
};

// イベントリスナーの追加方法を変更 (touchstart、touchmove、touchendをgame要素に直接追加)
game.addEventListener('touchstart', handleTouchStart, { passive: false });
game.addEventListener('touchmove', handleTouchMove, { passive: false });
game.addEventListener('touchend', handleTouchEnd, { passive: false });

// メッセージを表示する関数
function showStartMessage() {
    startMessage.classList.add('visible');
}

// メッセージを非表示にしてゲームを開始する関数
function hideStartMessageAndStartGame() {
    if (isGameStarted) return; // ゲームが既に開始されている場合は何もしない
    isGameStarted = true;
    startMessage.classList.remove('visible');
    resetGame();
    gameLoop();
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
        this.x -= playerSpeed * backgroundSpeed;
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

        // 横方向ランダム速度
        const maxRandomSpeedX = 0.2; // 横方向ランダム速度の上限
        this.randomSpeedX = Math.max(Math.min((Math.random() - 0.5) * 0.4, maxRandomSpeedX), -maxRandomSpeedX); // -0.2 ～ +0.2

        // 下方向の確率を大幅に増やす
        const downProbability = 0.9; // 下に動く確率（90%）
        const maxRandomSpeedY = 0.5; // 縦方向ランダム速度の上限

        if (Math.random() < downProbability) {
            this.speedY = -Math.random() * maxRandomSpeedY; // 下方向への速度
        } else {
            this.speedY = Math.random() * (maxRandomSpeedY / 4); // 上方向の速度を半分に制限
        }

        // ジャンプの高さと確率（調整）
        const minJumpHeight = 5; // ジャンプ高さの下限
        const maxJumpHeight = 8; // ジャンプ高さの上限
        this.jumpHeight = Math.random() * (maxJumpHeight - minJumpHeight - 1) + minJumpHeight; // 高さは 5 ～ 10
        this.jumpProbability = Math.random() * 0.05; // 確率は 5%（減少）

        this.boundX = game.offsetWidth; // 水平方向の制限
        this.boundY = 300; // 垂直方向の制限
    }

    move() {
        // 左方向の基準速度にランダム成分を加えて移動
        this.x += this.baseSpeedX + this.randomSpeedX;

        // 縦方向の移動
        this.y += this.speedY;

        // 初期設定された確率でジャンプ
        if (Math.random() < this.jumpProbability) {
            this.speedY = this.jumpHeight; // 初期設定されたジャンプ高さ
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





function createEnemies() {
    for (let i = 0; i < numEnemies; i++) {
        const x = 800 + i * 300; // 敵の間隔を 500 から 300 に変更
        const enemyType = Math.random();
        if (enemyType < 0.25) {
            enemies.push(new Enemy(x, 100));
        } else if (enemyType < 0.5) {
            enemies.push(new FastEnemy(x, 100));
        } else if (enemyType < 0.75) {
            enemies.push(new JumpingEnemy(x, 100));
        } else if (enemyType < 0.9) {
            enemies.push(new RandomMovingEnemy(x, Math.random() * 400));
        } else {
            enemies.push(new InvincibleItem(x, 100)); // 無敵アイテムを少量追加
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
    return Math.abs(playerCenterX - enemyCenterX) < overlapWidth * 0.8;//0.8は重なり具合の調整
}
function stopOtherAudio(currentAudio) {
    const allAudioElements = document.querySelectorAll('audio');
    allAudioElements.forEach(audio => {
        if (audio !== currentAudio && !audio.paused) {
            audio.pause(); // 他の音声を停止
        }
    });
}

function gameLoop() {
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
            playerRect.bottom >= enemyRect.top - 10 &&
            playerRect.bottom <= enemyRect.top + 10 &&
            velocityY > 0) {
            score += 100;
            scoreDisplay.textContent = `Score: ${score}`;
            enemiesToRemove.push(enemyObj);

            // 効果音を再生
            jumpOnEnemySound.currentTime = 0; // 再生位置をリセット
            jumpOnEnemySound.play();
            velocityY = -15;
            if(isInvincible){
                break;
            }
        } else if(isInvincible){
            //何もしない
        }
        else if(checkCollision(playerRect, enemyRect)) {
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