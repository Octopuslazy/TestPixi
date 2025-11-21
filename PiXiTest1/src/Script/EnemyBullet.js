// EnemyBullet.js

import { Sprite } from 'pixi.js';
import { GameConstants } from './GameConstants.js'; 

// THAY ĐỔI: Dùng tốc độ ổn định, không quá ngắn
const ENEMY_BULLET_SPEED = 12; 

export class EnemyBullet extends Sprite {
    constructor(texture, angle) {
        super(texture);
        this.anchor.set(0.5);
        this.damage = GameConstants.ENEMY_BULLET_DAMAGE;
        
        // Tính toán vận tốc X và Y dựa trên góc bắn
        this.vx = Math.cos(angle) * ENEMY_BULLET_SPEED;
        this.vy = Math.sin(angle) * ENEMY_BULLET_SPEED;
        
        this.scale.set(0.48);
    }

    update(ticker) {
        const dt = (typeof ticker?.deltaTime === 'number') ? ticker.deltaTime : 1; 
        
        this.x += this.vx * dt;
        this.y += this.vy * dt;
    }
    
    destroy() {
        if (this.parent) {
            this.parent.removeChild(this);
        }
    }
}