// ExplosionEffect.js

import { AnimatedSprite } from 'pixi.js';

export class ExplosionEffect extends AnimatedSprite {
    /**
     * @param {import('pixi.js').Texture[]} frames - Mảng frames hoạt ảnh.
     */
    constructor(frames) {
        super(frames);
        this.animationSpeed = 0.5; // Tốc độ nhanh để hiệu ứng nổ nhanh chóng
        this.loop = false; // Chỉ chạy 1 lần
        this.anchor.set(0.5); 
        
        // Bắt đầu chạy animation
        this.play();
        
        // Lắng nghe sự kiện kết thúc
        this.onComplete = () => {
            this.removeAndDestroy();
        };
    }

    // Phương thức dọn dẹp an toàn
    removeAndDestroy() {
        if (this.parent) {
            this.parent.removeChild(this);
        }
        // Gọi super.destroy() sau khi xóa khỏi parent
        super.destroy({ children: true }); 
    }
    
    // Không cần hàm update, AnimatedSprite tự xử lý
}