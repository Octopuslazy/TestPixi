// Enemy.js

import { Character } from './Character.js';

export class Enemy extends Character {
    constructor(animations, type, health, damage) {
        super(animations, 'run', 0.1);
        this.enemyType = type;
        this.health = health;
        this.collisionDamage = damage;
        this.isDead = false;
        this.isGrounded = false;
    }

    // Phương thức nhận sát thương
    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.isDead = true;
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

    update(ticker, groundY = 400, player = null, enemies = null, gameTime = 0) {
        // Logic vật lý chung (trọng lực, va chạm đất)
        const GRAVITY = 0.6;
        const dt = (typeof ticker?.deltaTime === 'number') ? ticker.deltaTime : 1; 

        if (!this.isGrounded) {
            this.y += GRAVITY * dt;
        }

        if (this.y >= groundY) {
            this.y = groundY;
            this.isGrounded = true;
        } else {
            this.isGrounded = false;
        }
    }
}