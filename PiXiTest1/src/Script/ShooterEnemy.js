// ShooterEnemy.js

import { Enemy } from './Enemy.js';
import { GameConstants } from './GameConstants.js'; 

export class ShooterEnemy extends Enemy {
    shootCooldown = 0;
    maxRange = 0;
    initialX = 0;
    currentDirection = 1;
    // Vị trí Y cố định
    fixedY = 0; 

    constructor(animations, initialX, initialHealth = GameConstants.ENEMY_SHOOTER_HEALTH, damage = GameConstants.ENEMY_COLLISION_DAMAGE) {
        super(animations, 'Shooter', initialHealth, damage);
        this.initialX = initialX;
        this.maxRange = GameConstants.SHOOTER_MOVEMENT_RANGE;
        this.x = initialX;
        this.scale.set(2);
        this.defaultScaleX = this.scale.x; 
    }
    
    // Phương thức bắn đạn (sẽ được gán từ EnemyManager)
    onShoot = (x, y, angle) => {}; 

    update(ticker, groundY, player, enemies, gameTime) {
        // KHÔNG GỌI super.update(ticker, groundY);
        // THAY ĐỔI: Shooter KHÔNG bị ảnh hưởng bởi trọng lực

        const dt = (typeof ticker?.deltaTime === 'number') ? ticker.deltaTime : 1; 

        // Giảm Cooldown
        if (this.shootCooldown > 0) {
            this.shootCooldown -= dt;
        }
        
        // --- LOGIC DI CHUYỂN LOOP VÀ NGHỈ ---
        
        // 1. Di chuyển trong khu vực nhất định (loop)
        const moveSpeed = GameConstants.ENEMY_SHOOTER_SPEED * this.currentDirection;
        this.x += moveSpeed * dt;
        
        // 2. Xử lý biên (giới hạn)
        if (this.x > this.initialX + this.maxRange || this.x < this.initialX - this.maxRange) {
            // Đặt lại vị trí và đổi hướng
            this.x = (this.x > this.initialX) ? this.initialX + this.maxRange : this.initialX - this.maxRange;
            this.currentDirection *= -1;
            this.scale.x = (this.currentDirection > 0) ? this.defaultScaleX : -this.defaultScaleX;
            
            // Chuyển sang trạng thái "Nghỉ" (2 giây)
            this.moveDuration = 0;
            this.isResting = true;
        }
        
        // Cần đảm bảo enemy di chuyển sau khi nghỉ 2s
        if (this.isResting) {
            this.x += 0; // Đứng yên
            if (this.moveDuration > 120) { // 120 frames tương đương 2s
                this.isResting = false;
            }
            this.moveDuration += dt;
        }

        // --- LOGIC BẮN ĐẠN (Mỗi 1 giây) ---
        if (player && !this.isResting && this.shootCooldown <= 0) {
            // 1. Tính toán góc bắn đến Player
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const angle = Math.atan2(dy, dx);
            
            // 2. Vị trí nòng súng
            const gunTipX = this.x + Math.cos(angle) * 30; // 30 là offset
            const gunTipY = this.y + Math.sin(angle) * 30;
            
            // 3. Gọi callback bắn
            this.onShoot(gunTipX, gunTipY, angle);
            
            // 4. Đặt cooldown
            this.shootCooldown = GameConstants.ENEMY_SHOOT_DELAY_MS / (1000/60); 
        }
        
        // Đảm bảo vị trí Y không bị thay đổi (nó sẽ ở groundY hoặc cố định ở giữa)
        this.y = groundY; // Shooter vẫn đứng trên mặt đất
    }
}