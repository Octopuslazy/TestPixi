// src/sprites/Character.js

import { AnimatedSprite } from 'pixi.js';

/**
 * Lớp cơ sở (Base Class) quản lý việc chuyển đổi giữa nhiều hoạt ảnh.
 * Nó kế thừa từ PixiJS AnimatedSprite để xử lý logic hiển thị frame.
 */
export class Character extends AnimatedSprite {
    /**
     * @param {Object} animations - Object chứa tất cả các frames đã được trích xuất.
     * Cấu trúc: { 'run': [Texture, ...], 'idle': [Texture, ...] }
     * @param {string} defaultAnimation - Tên hoạt ảnh mặc định để bắt đầu.
     * @param {number} defaultSpeed - Tốc độ hoạt ảnh mặc định (ví dụ: 0.15).
     */
    constructor(animations, defaultAnimation = 'idle', defaultSpeed = 0.2) {
        // Đảm bảo hoạt ảnh mặc định tồn tại trước khi gọi super()
        const initialFrames = animations[defaultAnimation] || [];
        
        // V8: Khởi tạo AnimatedSprite với frames mặc định
        super(initialFrames); 
        
        // Lưu trữ tất cả các frames hoạt ảnh đã được tải
        this.allAnimations = animations;
        this.currentAnimationName = defaultAnimation;

        // Thiết lập các thuộc tính cơ bản
        this.anchor.set(0.5);
        this.animationSpeed = defaultSpeed; 
        this.loop = true;

        // Bắt đầu phát hoạt ảnh mặc định nếu có frames
        if (initialFrames.length > 0) {
            this.play();
        } else {
            console.warn(`[Character] Default animation "${defaultAnimation}" not found.`);
        }
    }
    
    /**
     * Chuyển đổi sang một hoạt ảnh mới.
     * Nếu hoạt ảnh mới trùng với hoạt ảnh hiện tại, sẽ không làm gì.
     * * @param {string} name - Tên của hoạt ảnh mới (VD: 'run', 'idle').
     * @param {number} [speed] - Tốc độ hoạt ảnh mới (tùy chọn).
     * @param {boolean} [restart=false] - Buộc bắt đầu lại từ frame 0, ngay cả khi animation không đổi.
     */
    switchAnimation(name, speed, restart = false) {
        if (this.currentAnimationName === name && !restart) {
            return;
        }

        const newFrames = this.allAnimations[name];

        if (!newFrames || newFrames.length === 0) {
            console.warn(`[Character] Animation set "${name}" not found or empty.`);
            // Đặt texture về null để hiển thị sprite rỗng nếu không tìm thấy
            this.textures = []; 
            return;
        }
        
        // 3. Thực hiện chuyển đổi
        this.textures = newFrames;
        this.currentAnimationName = name;

        if (speed !== undefined) {
            this.animationSpeed = speed;
        }
        
        // SỬA LỖI: Cần gọi play() sau khi đổi textures
        if (!this.playing || restart) {
            this.gotoAndPlay(0); 
        } else {
            this.play();
        }
    }
    /**
     * Hàm cập nhật logic game (được gọi bởi Ticker).
     * Hàm này được thiết kế để các lớp con (Player, Enemy) ghi đè (override).
     * @param {PIXI.Ticker} ticker - Đối tượng Ticker từ PixiJS V8.
     */
    update(ticker) {
        // Lớp cơ sở không làm gì trong update, logic sẽ nằm ở lớp con.
    }
}