import { Enemy } from './Enemy.js';
import { GameConstants } from './GameConstants.js'; 

export class ChargerEnemy extends Enemy {
    isStunned = false;
    stunTimer = 0;

    constructor(animations, initialHealth = GameConstants.ENEMY_CHARGER_HEALTH, damage = GameConstants.ENEMY_COLLISION_DAMAGE) {
        super(animations, 'Charger', initialHealth, damage);
        this.scale.set(1.5);
        this.defaultScaleX = this.scale.x; 
    }

    // Phương thức kích hoạt trạng thái Choáng
    stun() {
        if (this.isDead) return;
        this.isStunned = true;
        this.stunTimer = GameConstants.CHARGER_STUN_TIME_MS / (1000/60);
    }

    update(ticker, groundY, player, enemies, gameTime) {
        // KIỂM TRA QUAN TRỌNG: Nếu đã chết, không làm gì cả
        if (this.isDead) return; 

        const dt = (typeof ticker?.deltaTime === 'number') ? ticker.deltaTime : 1; 
        const moveSpeed = GameConstants.ENEMY_CHARGER_SPEED;

        // Xử lý Choáng (Stun)
        if (this.isStunned) {
            this.stunTimer -= dt;
            if (this.stunTimer <= 0) {
                this.isStunned = false;
            }
            return; // Đứng yên nếu đang choáng
        }

        // Đảm bảo player còn sống trước khi di chuyển
        if (player && player.health > 0 && player.parent) { 
            // Di chuyển thẳng về phía Player (đâm thẳng)
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            
            const angle = Math.atan2(dy, dx);
            
            this.x += Math.cos(angle) * moveSpeed * dt;
            this.y += Math.sin(angle) * moveSpeed * dt;
            
            // Lật hình theo hướng Player
            this.scale.x = (dx > 0) ? this.defaultScaleX : -this.defaultScaleX;
        }
    }
}