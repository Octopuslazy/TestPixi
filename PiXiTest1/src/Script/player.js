import { Character } from './Character.js';
import { GameConstants } from './GameConstants.js'; 

const MOVE_SPEED = 4; 
const JUMP_VELOCITY = 15; 
const GRAVITY = 0.6;      

export class Player extends Character {
    health = GameConstants.PLAYER_BASE_HEALTH;
    currentAmmo = GameConstants.PLAYER_CLIP_SIZE;
    isReloading = false;
    reloadTimer = 0;
    aimAngle = 0; 
    
    isInvulnerable = false; 
    lastDamageTime = 0;    
    
    onShoot = () => {};
    shootCooldown = 0;
    SHOOT_DELAY = 10;
    
    constructor(animations, gunSprite) { 
        super(animations, 'idle', 0.15); 
        
        this.vx = 0;
        this.vy = 0;
        this.isJumping = false; 
        this.defaultScaleX = this.scale.x; 

        // [1. Gắn súng]
        this.gun = gunSprite;
        this.gun.anchor.set(0.1, 0.5); 
        this.gun.x = 20; 
        this.gun.y = 0; 
        
        this.addChild(this.gun);
    }

    // BỔ SUNG: Hàm reset chỉ số Player
    resetStats() {
        this.health = GameConstants.PLAYER_BASE_HEALTH;
        this.currentAmmo = GameConstants.PLAYER_CLIP_SIZE;
        this.isReloading = false;
        this.reloadTimer = 0;
        this.isInvulnerable = false;
        this.lastDamageTime = 0;
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
            return true; 
        }
        return false;
    }

    reload() {
        if (this.isReloading) return;
        this.isReloading = true;
        this.reloadTimer = GameConstants.PLAYER_RELOAD_TIME_MS / (1000 / 60); 
        console.log("Bắt đầu thay đạn (Reloading)...");
    }

    shoot() {
        if (this.isReloading || this.shootCooldown > 0) {
            return;
        }
        
        if (this.currentAmmo <= 0) {
            this.reload();
            return;
        }
        
        // --- LOGIC BẮN ---
        const gunTipLocalPos = { x: this.gun.texture.width, y: 0 };
        const gunTipGlobalPos = this.gun.toGlobal(gunTipLocalPos); 
        const angle = this.aimAngle; 
        
        this.shootCooldown = this.SHOOT_DELAY;
        this.currentAmmo--; // Giảm số lượng đạn
        
        this.onShoot(gunTipGlobalPos.x, gunTipGlobalPos.y, angle);
        
        if (this.currentAmmo === 0) {
            this.reload();
        }
    }

    setMovement(direction) {
        this.vx = direction * MOVE_SPEED;
    }

    jump() {
        if (!this.isJumping) {
            this.vy = -JUMP_VELOCITY;
            this.isJumping = true;
        }
    }

    update(ticker, groundY = 400, mouseGlobalPos = null, minPlayerX = 0, maxPlayerX = Infinity) {
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
        
        // --- 1. VẬT LÝ ---
        this.vy += GRAVITY * dt;
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        
        // --- KHÓA DI CHUYỂN NGANG ---
        if (this.x < minPlayerX) {
            this.x = minPlayerX; 
            if (this.vx < 0) { this.vx = 0; }
        }
        if (this.x > maxPlayerX) {
             this.x = maxPlayerX;
             if (this.vx > 0) { this.vx = 0; }
        }

        // --- 2. XỬ LÝ VA CHẠM MẶT ĐẤT ---
        if (this.y >= groundY) {
            this.y = groundY; 
            this.vy = 0;            
            this.isJumping = false; 
        } else {
            this.isJumping = true;
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
                this.gun.rotation = this.aimAngle; 
                console.log("Thay đạn hoàn tất. Ammo: " + this.currentAmmo);
            }
        }

        // --- 3. ANIMATION VÀ LẬT HÌNH NHÂN VẬT ---
        if (!this.isJumping) {
            if (this.vx !== 0) {
                this.switchAnimation('run', 0.15);
                if (this.vx > 0) this.scale.x = this.defaultScaleX;
                else if (this.vx < 0) this.scale.x = -this.defaultScaleX;
            } else {
                this.switchAnimation('idle', 0.1);
            }
        }

        // --- 4. XOAY VÀ LẬT SÚNG THEO CHUỘT ---
        if (this.gun && mouseGlobalPos) {
            const playerGlobalPos = this.position; 
            const dx = mouseGlobalPos.x - playerGlobalPos.x;
            const dy = mouseGlobalPos.y - playerGlobalPos.y;
            let angle = Math.atan2(dy, dx); 
            
            this.aimAngle = angle; 

            if (!this.isReloading) {
                const mouseIsLeft = dx < 0; 
                this.gun.x = 20;

                if (mouseIsLeft) {
                    this.gun.scale.y = -1;
                    this.gun.rotation = Math.PI - this.aimAngle; 
                } else {
                    this.gun.scale.y = 1; 
                    this.gun.rotation = this.aimAngle; 
                }
            }
        }
    }
}