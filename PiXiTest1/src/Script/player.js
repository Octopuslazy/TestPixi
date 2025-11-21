import { Character } from './Character.js';
import { GameConstants } from './GameConstants.js'; 

const MOVE_SPEED = 6; 
const DRAG_FACTOR = 0.9; // Hệ số kéo/giảm tốc (giúp dừng mượt hơn)

export class Player extends Character {
    // Thuộc tính Game State
    health = GameConstants.PLAYER_BASE_HEALTH;
    currentAmmo = GameConstants.PLAYER_CLIP_SIZE;
    isReloading = false;
    reloadTimer = 0;
    aimAngle = 0; 
    
    // Sát thương và Cooldown
    isInvulnerable = false; 
    lastDamageTime = 0;    
    
    onShoot = () => {};
    shootCooldown = 0;
    SHOOT_DELAY = 10;
    
    // Vận tốc và lực tác động
    vx = 0;
    vy = 0; 
    inputVx = 0;
    inputVy = 0;
    
    constructor(animations, gunSprite) { 
        super(animations, 'idle', 0.15); 
        
        this.vx = 0;
        this.vy = 0; 
        
        // Track inner sprite scale so we can flip the visual AnimatedSprite without
        // affecting child objects like the gun.
        this.spriteDefaultScale = this.sprite?.scale?.x || 1;
        this.defaultScaleX = this.scale.x; 

        // [1. Gắn súng]
        this.gun = gunSprite;
    // Use centered anchor so rotation looks consistent; orbit will position muzzle.
    this.gun.anchor.set(0.5, 0.5);
    this.gun.x = 20;
    this.gun.y = 0;
        
        this.addChild(this.gun);
    }

    // Phương thức xử lý sát thương
    takeDamage(amount, gameTime) {
        if (this.isInvulnerable || this.health <= 0) return false;

        this.health -= amount;
        this.lastDamageTime = gameTime;
        
        this.isInvulnerable = true; 
        
        console.log(`Player took ${amount} damage. Health: ${this.health}`);
        
        if (this.health <= 0) {
            this.health = 0;
            this.stop(); // Dừng hoạt ảnh khi chết
            return true; // Đã chết
        }
        return false;
    }
    
    // Hàm reset chỉ số Player
    resetStats() {
        this.health = GameConstants.PLAYER_BASE_HEALTH;
        this.currentAmmo = GameConstants.PLAYER_CLIP_SIZE;
        this.isReloading = false;
        this.reloadTimer = 0;
        this.isInvulnerable = false;
        this.lastDamageTime = 0;
        this.gotoAndPlay(0); // Bắt đầu lại animation
    }
    
    reload() {
        if (this.isReloading) return;
        this.isReloading = true;
        this.reloadTimer = GameConstants.PLAYER_RELOAD_TIME_MS / (1000 / 60); 
        console.log("Bắt đầu thay đạn (Reloading)...");
    }

    shoot() {
        if (this.isReloading || this.shootCooldown > 0 || this.health <= 0) {
            return;
        }
        
        if (this.currentAmmo <= 0) {
            this.reload();
            return;
        }
        
        // Use the global aim angle (world space) so bullets always travel toward cursor
        const angle = this.aimAngle;

        // Calculate bullet spawn position using the gun's global position so flips don't invert the barrel
        const gunGlobalPos = this.gun.getGlobalPosition();
        const gunRenderWidth = (this.gun.width && this.gun.width > 0) ? this.gun.width : (this.gun.texture?.width ? this.gun.texture.width * Math.abs(this.gun.scale.x || 1) : 20);
        const offset = gunRenderWidth + 10; // small extra gap so bullet spawns ahead of the sprite
        const gunTipGlobalPos = {
            x: gunGlobalPos.x + Math.cos(angle) * offset,
            y: gunGlobalPos.y + Math.sin(angle) * offset
        };
        
        this.shootCooldown = this.SHOOT_DELAY;
        this.currentAmmo--; // Giảm số lượng đạn
        
        this.onShoot(gunTipGlobalPos.x, gunTipGlobalPos.y, angle);
        
        if (this.currentAmmo === 0) {
            this.reload();
        }
    }

    // THAY ĐỔI: Gán lực di chuyển, không gán vận tốc trực tiếp
    setMovement(directionX, directionY = 0) {
        if (this.health <= 0) return;
        this.inputVx = directionX; 
        this.inputVy = directionY; 
    }

    update(ticker, screenHeight, mouseGlobalPos = null, minPlayerX = 0, maxPlayerX = Infinity) {
        
        if (this.health <= 0) {
            this.vx = 0;
            this.vy = 0;
            return;
        }
        
        const dt = (typeof ticker?.deltaTime === 'number') ? ticker.deltaTime : 1; 
        const gameTime = performance.now(); 
        
        // Xử lý Cooldown miễn nhiễm
        if (this.isInvulnerable && gameTime - this.lastDamageTime > GameConstants.ENEMY_COLLISION_COOLDOWN_MS) {
            this.isInvulnerable = false;
        }
        
        // Giảm Cooldown bắn
        if (this.shootCooldown > 0) {
            this.shootCooldown -= dt;
        }
        
        // --- 1. VẬT LÝ VÀ LÀM MƯỢT DI CHUYỂN ---
        
        // TÍNH TOÁN LỰC:
        // Áp dụng lực input
        this.vx += (this.inputVx * MOVE_SPEED - this.vx) * 0.2; 
        this.vy += (this.inputVy * MOVE_SPEED - this.vy) * 0.2; 

        // Áp dụng Drag (Làm chậm khi không có input)
        if (this.inputVx === 0 && this.inputVy === 0) {
            this.vx *= DRAG_FACTOR; 
            this.vy *= DRAG_FACTOR; 
        }

        this.x += this.vx * dt;
        this.y += this.vy * dt;
        
        // --- KHÓA BIÊN MÀN HÌNH (Y) ---
        const topBoundary = 50; 
        const bottomBoundary = screenHeight - 50; 
        
        if (this.y < topBoundary) {
            this.y = topBoundary;
            if (this.vy < 0) { this.vy = 0; }
        }
        if (this.y > bottomBoundary) {
            this.y = bottomBoundary;
            if (this.vy > 0) { this.vy = 0; }
        }
        
        // --- KHÓA BIÊN MÀN HÌNH (X) ---
        if (this.x < minPlayerX) {
            this.x = minPlayerX; 
            if (this.vx < 0) { this.vx = 0; }
        }
        if (this.x > maxPlayerX) {
             this.x = maxPlayerX;
             if (this.vx > 0) { this.vx = 0; }
        }

        // --- LOGIC THAY ĐẠN ---
        if (this.isReloading) {
            this.reloadTimer -= dt;
            const totalFrames = GameConstants.PLAYER_RELOAD_TIME_MS / (1000 / 60); 
            const rotationProgress = (totalFrames - this.reloadTimer) / totalFrames;
            this.gun.rotation = rotationProgress * Math.PI * 2; 

            if (this.reloadTimer <= 0) {
                this.isReloading = false;
                this.currentAmmo = GameConstants.PLAYER_CLIP_SIZE; 
                // leave rotation to the normal pointer update in the next tick
                console.log("Thay đạn hoàn tất. Ammo: " + this.currentAmmo);
            }
        }

        // --- 3. ANIMATION VÀ LẬT HÌNH NHÂN VẬT ---
        // Use a small threshold so drag/residual velocity doesn't keep the run anim playing
        const moveThreshold = 0.1;
        if (Math.abs(this.vx) > moveThreshold || Math.abs(this.vy) > moveThreshold) {
            this.switchAnimation('run', 0.15);
            if (this.vx > 0) this.sprite.scale.x = Math.abs(this.spriteDefaultScale);
            else if (this.vx < 0) this.sprite.scale.x = -Math.abs(this.spriteDefaultScale);
        } else {
            this.switchAnimation('idle', 0.1);
        }

        // --- 4. XOAY VÀ LẬT SÚNG THEO CHUỘT ---
        if (this.gun && mouseGlobalPos) {
            // Compute the global angle from the gun's world position to the mouse. This is the
            // direction bullets should travel in world-space and avoids issues when the player
            // container is flipped.
            const gunGlobalPos = this.gun.getGlobalPosition();
            const dxG = mouseGlobalPos.x - gunGlobalPos.x;
            const dyG = mouseGlobalPos.y - gunGlobalPos.y;
            const globalAngle = Math.atan2(dyG, dxG);

            this.aimAngle = globalAngle;

            if (!this.isReloading) {
                // Orbit the gun around the player center using the global aiming angle so
                // the muzzle always sits on the side toward the cursor and points at it.
                const orbitRadius = GameConstants.PLAYER_GUN_ORBIT_RADIUS;
                this.gun.x = Math.cos(globalAngle) * orbitRadius;
                this.gun.y = Math.sin(globalAngle) * orbitRadius;

                // Use the true global aiming angle so the muzzle points at the cursor/bullets.
                // Keep the gun texture upright (positive scale.y). If your gun art faces the
                // opposite direction, change `PLAYER_GUN_ROTATION_OFFSET` in `GameConstants`.
                const rotationOffset = GameConstants.PLAYER_GUN_ROTATION_OFFSET || 0;
                this.gun.scale.y = Math.abs(this.gun.scale.y);
                this.gun.rotation = globalAngle + rotationOffset;
            }
        }
    }
}