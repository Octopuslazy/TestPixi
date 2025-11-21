// src/sprites/Character.js

import { AnimatedSprite, Container } from 'pixi.js';

/**
 * Lớp cơ sở (Base Class) quản lý việc chuyển đổi giữa nhiều hoạt ảnh.
 * Thay vì kế thừa trực tiếp từ AnimatedSprite (không còn cho phép addChild),
 * Character giờ là một Container chứa một AnimatedSprite nội bộ.
 */
export class Character extends Container {
    /**
     * @param {Object} animations - Object chứa tất cả các frames đã được trích xuất.
     * Cấu trúc: { 'run': [Texture, ...], 'idle': [Texture, ...] }
     * @param {string} defaultAnimation - Tên hoạt ảnh mặc định để bắt đầu.
     * @param {number} defaultSpeed - Tốc độ hoạt ảnh mặc định (ví dụ: 0.15).
     */
    constructor(animations, defaultAnimation = 'idle', defaultSpeed = 0.2) {
        super();

        // Đảm bảo hoạt ảnh mặc định tồn tại
        const initialFrames = animations[defaultAnimation] || [];

        // Lưu trữ tất cả các frames hoạt ảnh đã được tải
        this.allAnimations = animations;
        this.currentAnimationName = defaultAnimation;

        // Tạo AnimatedSprite nội bộ
        this.sprite = new AnimatedSprite(initialFrames);
        this.sprite.anchor.set(0.5);
        this.sprite.animationSpeed = defaultSpeed;
        this.sprite.loop = true;

        // Thêm AnimatedSprite vào Container
        this.addChild(this.sprite);

        if (initialFrames.length > 0) {
            this.sprite.play();
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
            this.sprite.textures = [];
            return;
        }

        this.sprite.textures = newFrames;
        this.currentAnimationName = name;

        console.log(`[Character] switchAnimation -> ${name}, textures: ${this.sprite.textures?.length || 0}`);

        if (speed !== undefined) {
            this.sprite.animationSpeed = speed;
        }

        // Luôn phát animation mới
        this.sprite.gotoAndPlay(0);
        try { this.sprite.loop = true; this.sprite.play(); } catch (e) { /* ignore */ }
    }

    // Proxy / helper getters to keep compatibility with existing code
    get textures() { return this.sprite?.textures; }
    get playing() { return this.sprite?.playing; }
    gotoAndPlay(frame) { this.sprite.gotoAndPlay(frame); }
    play() { this.sprite.play(); }
    stop() { this.sprite.stop(); }

    update(ticker) {
        // Lớp cơ sở không làm gì trong update, logic sẽ nằm ở lớp con.
    }

    destroy(options) {
        if (this.sprite) {
            try { this.sprite.destroy(options); } catch (e) { /* ignore */ }
        }
        super.destroy(options);
    }
}