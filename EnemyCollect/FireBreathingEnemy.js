export default class FireBreathingEnemy extends GameObject {
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