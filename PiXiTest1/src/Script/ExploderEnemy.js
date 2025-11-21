import { Enemy } from './Enemy.js';
import { GameConstants } from './GameConstants.js'; 

export class ExploderEnemy extends Enemy {
    onExplode = (x, y, frames) => {};
    constructor(animations, initialHealth = GameConstants.ENEMY_EXPLODER_HEALTH, damage = GameConstants.EXPLOSION_DAMAGE) {
        super(animations, 'Exploder', initialHealth, damage);
        this.scale.set(2); 
        this.defaultScaleX = this.scale.x; 
        this.hasExploded = false;
    }

    // Phương thức phát nổ
    explode(player, enemies) {
        // Tránh nổ nhiều lần
        if (this.hasExploded) return;
        this.hasExploded = true;
        
        const radiusSq = GameConstants.EXPLOSION_RADIUS * GameConstants.EXPLOSION_RADIUS;
        enemies.forEach(enemy => {
            if (enemy === this || enemy.isDead || !enemy.parent) { 
                return;
            }
            
            // Sửa lỗi tiềm ẩn: Kiểm tra tính hợp lệ trước khi tính toán
            if (enemy && enemy.x !== undefined && this.x !== undefined) {
                const dx = enemy.x - this.x;
                const dy = enemy.y - this.y;
                if (dx * dx + dy * dy <= radiusSq) {
                    const dmg = (typeof this.collisionDamage === 'number') ? this.collisionDamage : GameConstants.EXPLOSION_DAMAGE;
                    console.log(`[Exploder] damaging ${enemy.enemyType} at (${enemy.x.toFixed(1)},${enemy.y.toFixed(1)}) before health=${enemy.health} dmg=${dmg}`);
                    const died = enemy.takeDamage(dmg);
                    console.log(`[Exploder] result: ${enemy.enemyType} died=${died}, after health=${enemy.health}`);
                }
            }
        });
        console.log(`[Exploder] exploded at (${this.x.toFixed(1)}, ${this.y.toFixed(1)}) with radius ${GameConstants.EXPLOSION_RADIUS}`);

        // Đánh dấu là đã chết và xóa khỏi stage
        // Request a larger explosion for Exploder enemies (double the default)
        try { this.onExplode(this.x, this.y, 4); } catch (e) { try { this.onExplode(this.x, this.y); } catch (e2) {} }
        
        this.isDead = true; 
        this.destroy(); // Tự hủy
    }

    update(ticker, groundY, player, enemies, gameTime) {
        // KIỂM TRA QUAN TRỌNG: Nếu đã chết, không làm gì cả
        if (this.isDead) return;
        
        const dt = (typeof ticker?.deltaTime === 'number') ? ticker.deltaTime : 1; 
        const moveSpeed = GameConstants.ENEMY_EXPLODER_SPEED;

        // Đảm bảo player tồn tại và còn sống trước khi di chuyển
        if (player && player.health > 0 && player.parent) { 
            
            // VỊ TRÍ LỖI CŨ: Dòng 38 (hoặc 47)
            const dx = player.x - this.x; // Lỗi xảy ra nếu this.x là null
            const dy = player.y - this.y;
            
            const angle = Math.atan2(dy, dx);
            
            this.x += Math.cos(angle) * moveSpeed * dt;
            this.y += Math.sin(angle) * moveSpeed * dt;
            
            // Lật hình theo hướng Player
            this.scale.x = (dx > 0) ? this.defaultScaleX : -this.defaultScaleX;
        }
    }
}