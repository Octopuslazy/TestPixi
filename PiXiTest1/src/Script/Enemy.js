// Enemy.js

import { Character } from './Character.js';

export class Enemy extends Character {
    constructor(animations, type, health, damage) {
        super(animations, 'run', 0.1);
        this.enemyType = type;
        this.health = health;
        this.collisionDamage = damage;
        this.isDead = false;
        // LOẠI BỎ: isGrounded
        // this.isGrounded = false;
    }

    // Phương thức nhận sát thương
    takeDamage(amount) {
        const prevHealth = this.health;
        this.health -= amount;
        console.log(`[Enemy] ${this.enemyType} took ${amount} damage. Health: ${prevHealth} -> ${this.health}`);

        if (this.health <= 0) {
            this.isDead = true;
            console.log(`[Enemy] ${this.enemyType} died.`);
            return true; // Kẻ thù đã chết
        }
        return false; // Kẻ thù vẫn sống
    }

    // Phương thức để loại bỏ kẻ thù khỏi Stage và dọn dẹp
    destroy() {
        if (this.parent) {
            this.parent.removeChild(this);
        }
        super.destroy(); 
    }

    // THAY ĐỔI: Loại bỏ logic trọng lực/groundY
    update(ticker, screenHeight, player = null, enemies = null, gameTime = 0) {
        // Lớp cơ sở không làm gì (logic sẽ nằm ở lớp con)
    }
}