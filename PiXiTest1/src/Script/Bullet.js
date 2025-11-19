import { Sprite } from 'pixi.js';

const BULLET_SPEED = 20; 
const BULLET_LIFETIME = 150; 

export class Bullet extends Sprite {
    /**
     * @param {import('pixi.js').Texture} texture - Texture của viên đạn.
     * @param {number} angle - Góc bắn (radian).
     */
    constructor(texture, angle) {
        super(texture);

        this.anchor.set(0.5); // Đặt neo ở giữa đạn
        this.angle = angle; 
        this.life = 0; 

        // Tính toán vận tốc X và Y dựa trên góc bắn
        this.vx = Math.cos(angle) * BULLET_SPEED;
        this.vy = Math.sin(angle) * BULLET_SPEED;
        
        this.scale.set(1.5); 
    }

    /**
     * Cập nhật vị trí và kiểm tra tuổi thọ của viên đạn.
     * @param {import('pixi.js').Ticker} ticker - PixiJS Ticker.
     * @returns {boolean} True nếu đạn cần bị hủy, False nếu vẫn hoạt động.
     */
    update(ticker) {
        const dt = (typeof ticker?.deltaTime === 'number') ? ticker.deltaTime : 1; 

        // Cập nhật vị trí
        this.x += this.vx * dt;
        this.y += this.vy * dt;

        // Tăng tuổi thọ và kiểm tra xem đạn có cần bị hủy không
        this.life += dt;
        if (this.life >= BULLET_LIFETIME) {
            this.destroy(); // Tự hủy (xóa khỏi parent)
            return true; // Báo hiệu game loop xóa khỏi mảng
        }
        return false; 
    }
    
    // Phương thức để loại bỏ đạn khỏi stage
    destroy() {
        if (this.parent) {
            this.parent.removeChild(this);
        }
    }
}