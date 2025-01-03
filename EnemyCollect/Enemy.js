export default class Enemy extends GameObject {
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
