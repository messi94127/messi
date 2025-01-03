import GameObject from './GameObject.js';

export default class Player extends GameObject {
    constructor(element) {
        super(50, 100, 50, 80, element);
        this.velocityY = 0;
        this.isJumping = false;
        this.jumpCount = 0;
        this.isInvincible = false;
    }

    jump(maxJumps, jumpPower) {
        if (this.jumpCount < maxJumps) {
            this.isJumping = true;
            this.velocityY = jumpPower;
            this.jumpCount++;
        }
    }

    resetJump() {
        this.jumpCount = 0;
        this.isJumping = false;
    }

    setInvincible(duration) {
        if (this.isInvincible) return;

        this.isInvincible = true;
        this.element.classList.add('invincible');

        setTimeout(() => {
            this.isInvincible = false;
            this.element.classList.remove('invincible');
        }, duration);
    }
}
