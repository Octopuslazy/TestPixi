import { Enemy } from './Enemy.js';
import { GameConstants } from './GameConstants.js'; 

export class ShooterEnemy extends Enemy {
    shootCooldown = 0;
    maxRange = 0;
    initialX = 0;
    currentDirection = 1;

    constructor(animations, initialX, initialHealth = GameConstants.ENEMY_SHOOTER_HEALTH, damage = GameConstants.ENEMY_COLLISION_DAMAGE) {
        super(animations, 'Shooter', initialHealth, damage);
        this.initialX = initialX;
        this.maxRange = GameConstants.SHOOTER_MOVEMENT_RANGE;
        this.x = initialX;
        
        this.scale.set(2);
        this.defaultScaleX = this.scale.x; 
        
        this.initialY = 0;
    }
    
    onShoot = (x, y, angle) => {}; 

    // THAY ĐỔI: Loại bỏ groundY, thay bằng screenHeight
    update(ticker, screenHeight, player, enemies, gameTime) { 
        if (this.isDead) return;

        const dt = (typeof ticker?.deltaTime === 'number') ? ticker.deltaTime : 1; 

        if (this.shootCooldown > 0) {
            this.shootCooldown -= dt;
        }
        
        // --- LOGIC DI CHUYỂN LOOP VÀ NGHỈ ---
        
        const moveSpeed = GameConstants.ENEMY_SHOOTER_SPEED * this.currentDirection;
        
        if (!this.isResting) {
            this.x += moveSpeed * dt;
        }
        
        // Xử lý biên (giới hạn)
        if (this.x > this.initialX + this.maxRange || this.x < this.initialX - this.maxRange) {
            this.x = (this.x > this.initialX) ? this.initialX + this.maxRange : this.initialX - this.maxRange;
            this.currentDirection *= -1;
            this.scale.x = (this.currentDirection > 0) ? this.defaultScaleX : -this.defaultScaleX;
            
            this.moveDuration = 0;
            this.isResting = true;
        }
        
        if (this.isResting) {
            if (this.moveDuration > 120) { 
                this.isResting = false;
            }
            this.moveDuration += dt;
        }

        // --- LOGIC BẮN ĐẠN ---
        if (player && player.health > 0 && !this.isResting && this.shootCooldown <= 0) {
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const angle = Math.atan2(dy, dx);
            
            const gunTipX = this.x + Math.cos(angle) * (30 * this.scale.x); 
            const gunTipY = this.y + Math.sin(angle) * (30 * this.scale.y); 
            
            this.onShoot(gunTipX, gunTipY, angle);
            
            this.shootCooldown = GameConstants.ENEMY_SHOOT_DELAY_MS / (1000/60); 
        }
    }
}