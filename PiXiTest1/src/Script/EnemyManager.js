// EnemyManager.js (ĐÃ SỬA LỖI VA CHẠM)

import { ShooterEnemy } from './ShooterEnemy.js';
import { ExploderEnemy } from './ExploderEnemy.js';
import { ChargerEnemy } from './ChargerEnemy.js';
import { EnemyBullet } from './EnemyBullet.js';
import { GameConstants } from './GameConstants.js'; 

// Định nghĩa các đợt kẻ thù cho từng màn hình
const SCREEN_WAVES = {
    SCREEN1: [
        { type: 'Shooter', x: 500, y: 0, count: 1 },
        { type: 'Exploder', x: 800, y: 0, count: 1 },
        { type: 'Charger', x: 1200, y: 0, count: 1 },
    ],
    SCREEN2: [
        { type: 'Shooter', x: 500, y: 0, count: 4 },
        { type: 'Exploder', x: 900, y: 0, count: 4 },
        { type: 'Charger', x: 1200, y: 0, count: 6 },
    ],
};

export class EnemyManager {
    constructor(app, currentScreen, enemyAnimations, bulletTexture, groundY, player) {
        this.app = app;
        this.currentScreen = currentScreen;
        this.enemyAnimations = enemyAnimations;
        this.bulletTexture = bulletTexture;
        this.groundY = groundY;
        this.player = player;
        this.playerBullets = []; 
        this.enemies = [];
        this.enemyBullets = [];
        this.enemiesRemaining = 0;
        this.isWaveSpawned = false;
        this.timePerFrame = 1000 / 60; 

        // Gán callback bắn đạn Enemy cho các Enemy Shooter
        this.createBullet = (x, y, angle) => {
            const bullet = new EnemyBullet(this.bulletTexture, angle);
            bullet.x = x;
            bullet.y = y;
            this.currentScreen.addChild(bullet);
            this.enemyBullets.push(bullet);
        };
    }
    
    setPlayerBullets(bullets) {
        this.playerBullets = bullets;
    }

    spawnWave() {
        const screenRef = this.currentScreen.name || 'SCREEN1'; 
        const waveData = SCREEN_WAVES[screenRef] || [];

        if (this.isWaveSpawned) return; 
        
        waveData.forEach(data => {
            
            let rawFrames = this.enemyAnimations[`${data.type}_run`];
            const animationMap = { 'run': rawFrames };

            if (!rawFrames) {
                console.warn(`[EnemyManager] LỖI: Không tìm thấy frames cho ${data.type}_run. Kiểm tra AssetLoader.`);
                return;
            }

            for (let i = 0; i < data.count; i++) {
                let enemy;
                const spawnX = data.x + (Math.random() * 100) - 50; 
                
                switch (data.type) {
                    case 'Shooter':
                        enemy = new ShooterEnemy(animationMap, spawnX); 
                        enemy.onShoot = this.createBullet; 
                        enemy.y = this.groundY; 
                        break;
                    case 'Exploder':
                        enemy = new ExploderEnemy(animationMap);
                        enemy.x = spawnX;
                        break;
                    case 'Charger':
                        enemy = new ChargerEnemy(animationMap);
                        enemy.x = spawnX;
                        break;
                    default:
                        return;
                }
                
                enemy.isGrounded = true; 
                this.currentScreen.addChild(enemy);
                this.enemies.push(enemy);
            }
        });
        
        this.enemiesRemaining = this.enemies.length;
        this.isWaveSpawned = true;
        console.log(`[EnemyManager] Spawned ${this.enemiesRemaining} enemies for ${screenRef}.`);
    }
    
    update(ticker) {
        const dt = (typeof ticker?.deltaTime === 'number') ? ticker.deltaTime : 1; 
        const gameTime = performance.now();

        // --- 1. Cập nhật và dọn dẹp Đạn của Kẻ thù ---
        for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
            const bullet = this.enemyBullets[i];
            bullet.update(ticker);
            
            if (bullet.x < 0 || bullet.x > this.app.screen.width || bullet.y > this.groundY + 100) {
                bullet.destroy();
                this.enemyBullets.splice(i, 1);
            }
        }

        // --- 2. Cập nhật Kẻ thù ---
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            
            // THAY ĐỔI: Nếu kẻ thù đã chết (do vụ nổ hoặc đạn)
            if (enemy.isDead) {
                // Đảm bảo Sprite bị hủy nếu chưa (đề phòng Exploder)
                enemy.destroy(); 
                this.enemies.splice(i, 1);
                this.enemiesRemaining--;
                continue; // Chuyển sang kẻ thù tiếp theo
            }
            
            // CHỈ update nếu Player còn sống
            if (this.player.health > 0) { 
                enemy.update(ticker, this.groundY, this.player, this.enemies, gameTime);
            }
        }
        
        // --- 3. Xử lý Va chạm ---
        this.handlePlayerBulletCollision(gameTime);
        const playerDied = this.handleEnemyPlayerCollision(gameTime); 
        
        if (playerDied) {
            if (this.player.parent) {
                this.player.parent.removeChild(this.player);
            }
        }
        
        return this.enemiesRemaining;
    }
    
    handlePlayerBulletCollision(gameTime) {
        for (let i = this.playerBullets.length - 1; i >= 0; i--) {
            const bullet = this.playerBullets[i];
            
            // KIỂM TRA ĐẠN ĐÃ BỊ HỦY CHƯA (Sửa lỗi bắn xuyên sau reset)
            if (!bullet.parent) {
                 this.playerBullets.splice(i, 1);
                 continue;
            }
            
            for (let j = this.enemies.length - 1; j >= 0; j--) {
                const enemy = this.enemies[j];
                
                // Bỏ qua kẻ thù đã chết
                if (enemy.isDead) continue;
                
                const dx = bullet.x - enemy.x;
                const dy = bullet.y - enemy.y;
                const distanceSq = dx * dx + dy * dy;
                const hitRadiusSq = (bullet.width/2 + enemy.width/2) * (bullet.width/2 + enemy.width/2);
                
                if (distanceSq < hitRadiusSq) {
                    const enemyDied = enemy.takeDamage(GameConstants.PLAYER_BULLET_DAMAGE); 
                    
                    // 1. Hủy đạn
                    bullet.destroy();
                    this.playerBullets.splice(i, 1);
                    
                    // 2. Xử lý cái chết của Exploder
                    if (enemyDied && enemy.enemyType === 'Exploder') {
                        // Exploder tự hủy bên trong explode()
                        enemy.explode(this.player, this.enemies); 
                        this.player.takeDamage(GameConstants.EXPLOSION_DAMAGE, gameTime); 
                    }
                    
                    // Nếu kẻ thù bị tiêu diệt, dừng vòng lặp enemies
                    if (enemyDied) { break; } 
                    // Dừng vòng lặp enemies (chỉ trúng một viên đạn)
                    break;
                }
            }
        }
    }
    
    handleEnemyPlayerCollision(gameTime) {
        if (!this.player || this.player.health <= 0) return false;

        let playerKilled = false;

        this.enemies.forEach(enemy => {
            const dx = enemy.x - this.player.x;
            const dy = enemy.y - this.player.y;
            const distanceSq = dx * dx + dy * dy;
            const hitRadiusSq = (enemy.width/2 + this.player.width/2) * (enemy.width/2 + this.player.width/2);
            
            if (distanceSq < hitRadiusSq) {
                
                if (enemy.enemyType === 'Exploder') {
                    playerKilled = this.player.takeDamage(GameConstants.EXPLOSION_DAMAGE, gameTime);
                    enemy.explode(this.player, this.enemies); 
                    return;
                }
                
                if (this.player.isInvulnerable) return;

                if (enemy.enemyType === 'Charger' && !enemy.isStunned) {
                    playerKilled = this.player.takeDamage(GameConstants.ENEMY_COLLISION_DAMAGE, gameTime);
                    enemy.stun(); 
                    return;
                }
                
                if (enemy.enemyType === 'Shooter') {
                    playerKilled = this.player.takeDamage(GameConstants.ENEMY_COLLISION_DAMAGE, gameTime);
                    return;
                }
            }
        });
        
        // --- 2. Va chạm Enemy Bullet vs Player ---
        for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
            const bullet = this.enemyBullets[i];
            
            const dx = bullet.x - this.player.x;
            const dy = bullet.y - this.player.y;
            const distanceSq = dx * dx + dy * dy;
            const hitRadiusSq = (bullet.width/2 + this.player.width/2) * (bullet.width/2 + this.player.width/2);
            
            if (distanceSq < hitRadiusSq) {
                
                if (this.player.isInvulnerable) {
                    bullet.destroy();
                    this.enemyBullets.splice(i, 1);
                    continue; 
                }
                
                playerKilled = this.player.takeDamage(bullet.damage, gameTime);
                
                bullet.destroy();
                this.enemyBullets.splice(i, 1);
            }
        }
        
        return playerKilled;
    }
}