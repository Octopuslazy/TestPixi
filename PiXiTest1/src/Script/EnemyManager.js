// EnemyManager.js (ĐÃ SỬA LỖI KHỞI TẠO NỔ)

import { ShooterEnemy } from './ShooterEnemy.js';
import { ExploderEnemy } from './ExploderEnemy.js';
import { ChargerEnemy } from './ChargerEnemy.js';
import { EnemyBullet } from './EnemyBullet.js';
import { GameConstants } from './GameConstants.js'; 
import { Graphics } from 'pixi.js';
import { ExplosionEffect } from './ExplosionEffect.js';
import { BloodEffect } from './BloodEffect.js';

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
    SCREEN3: [
        { type: 'Boss', x: 900, y: 0, count: 1 }
    ]
};

export class EnemyManager {
    // THAY ĐỔI: NHẬN allAnimations TỪ INDEX.JS
    constructor(app, currentScreen, enemyAnimations, bulletTexture, appScreenHeight, player, allAnimations) { 
        this.app = app;
        this.currentScreen = currentScreen;
        this.enemyAnimations = enemyAnimations;
        this.bulletTexture = bulletTexture;
        // Enemy/boss bullet texture: prefer a dedicated BossBulletTexture from allAnimations,
        // otherwise fall back to the provided bulletTexture.
        this.enemyBulletTexture = allAnimations?.BossBulletTexture || bulletTexture;
        this.appScreenHeight = appScreenHeight; 
        this.player = player;
        this.playerBullets = []; 
        this.enemies = [];
        this.enemyBullets = [];
        this.enemiesRemaining = 0;
        this.isWaveSpawned = false;
        this.timePerFrame = 1000 / 60; 
        
        // SỬA LỖI: Lấy frames nổ và frames máu từ tham số allAnimations
        this.explosionFrames = allAnimations?.effects?.Explosion_frames || null;
        this.bloodyFrames = allAnimations?.effects?.Bloody_frames || null;

        // helper to spawn blood effect at a point
        this.createBlood = (x, y, scale = 1) => {
            if (this.bloodyFrames && this.bloodyFrames.length > 0) {
                const fx = new BloodEffect(this.bloodyFrames);
                fx.x = x; fx.y = y;
                fx.scale.set(scale);
                this.currentScreen.addChild(fx);
            } else {
                // fallback: small red circle
                const gfx = new Graphics();
                gfx.beginFill(0x990000, 1).drawCircle(0, 0, 8 * scale).endFill();
                gfx.x = x; gfx.y = y;
                this.currentScreen.addChild(gfx);
                // fade out
                let life = 0; const duration = 20;
                const tick = (d) => {
                    life += d;
                    gfx.alpha = Math.max(0, 1 - life / duration);
                    if (life >= duration) {
                        this.app.ticker.remove(tick);
                        if (gfx.parent) gfx.parent.removeChild(gfx);
                        gfx.destroy();
                    }
                };
                this.app.ticker.add(tick);
            }
        };

        this.createBullet = (x, y, angle) => {
            const bullet = new EnemyBullet(this.enemyBulletTexture, angle);
            bullet.x = x;
            bullet.y = y;
            this.currentScreen.addChild(bullet);
            this.enemyBullets.push(bullet);
        };
        
        // Hàm tạo hiệu ứng nổ (được gán cho Exploder)
        this.createExplosion = (x, y) => {
            if (this.explosionFrames && this.explosionFrames.length > 0) {
                 const fx = new ExplosionEffect(this.explosionFrames);
                 fx.scale.set(2);
                 fx.x = x;
                 fx.y = y;
                 this.currentScreen.addChild(fx);
                 console.log('[EnemyManager] ExplosionEffect created and added.');
            } else {
                 // Fallback (Logic Graphics giữ nguyên)
                 const gfx = new Graphics();
                 gfx.fill({ color: 0xff6600, alpha: 0.9 }).circle(0, 0, GameConstants.EXPLOSION_RADIUS / 2);
                 gfx.x = x;
                 gfx.y = y;
                 this.currentScreen.addChild(gfx);
                 
                 let life = 0;
                 const duration = 20; // frames
                 const tick = (delta) => {
                     life += delta;
                     gfx.alpha = Math.max(0, 1 - life / duration);
                     if (life >= duration) {
                         this.app.ticker.remove(tick);
                         if (gfx.parent) gfx.parent.removeChild(gfx);
                         gfx.destroy();
                     }
                 };
                 this.app.ticker.add(tick);
                 console.log('[EnemyManager] Using Graphics Fallback for explosion.');
            }
        };
    }
    
    setPlayerBullets(bullets) {
        this.playerBullets = bullets;
    }

    async spawnWave() {
        const screenRef = this.currentScreen?.label || 'SCREEN1'; 
        const waveData = SCREEN_WAVES[screenRef] || [];

        if (this.isWaveSpawned) return; 
        
        for (const data of waveData) {
            let rawFrames = this.enemyAnimations[`${data.type}_run`];
            const animationMap = { 'run': rawFrames };

            if (!rawFrames) {
                console.warn(`[EnemyManager] LỖI: Không tìm thấy frames cho ${data.type}_run. Kiểm tra AssetLoader.`);
                continue;
            }

            for (let i = 0; i < data.count; i++) {
                let enemy;
                const spawnX = data.x + (Math.random() * 100) - 50; 
                
                const spawnY = this.appScreenHeight * (0.3 + Math.random() * 0.4); 
                
                switch (data.type) {
                    case 'Shooter':
                        enemy = new ShooterEnemy(animationMap, spawnX); 
                        enemy.onShoot = this.createBullet; 
                        enemy.y = spawnY; 
                        break;
                    case 'Exploder':
                        enemy = new ExploderEnemy(animationMap);
                        enemy.x = spawnX;
                        enemy.y = spawnY;
                        enemy.onExplode = this.createExplosion; // GÁN CALLBACK NỔ
                        break;
                    case 'Charger':
                        enemy = new ChargerEnemy(animationMap);
                        enemy.x = spawnX;
                        enemy.y = spawnY;
                        break;
                    case 'Boss':
                        // dynamic import of BossEnemy
                        try {
                            const mod = await import('./BossEnemy.js');
                            const BossEnemy = mod.BossEnemy || mod.default || mod;
                            enemy = new BossEnemy(animationMap);
                            enemy.x = spawnX;
                            enemy.y = spawnY;
                        } catch (e) {
                            console.error('[EnemyManager] BossEnemy import failed', e);
                        }
                        break;
                    default:
                        return;
                }
                
                enemy.isGrounded = true; 
                if (enemy) {
                    enemy.manager = this;
                    this.currentScreen.addChild(enemy);
                    this.enemies.push(enemy);
                }
            }
        }
        
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
            if (!bullet || typeof bullet.update !== 'function') {
                this.enemyBullets.splice(i, 1);
                continue;
            }

            try { bullet.update(ticker); } catch (e) { console.warn('[EnemyManager] enemyBullet.update error', e); }

            if (typeof bullet.x !== 'number' || typeof bullet.y !== 'number' ||
                bullet.x < -100 || bullet.x > this.app.screen.width + 100 ||
                bullet.y < -100 || bullet.y > this.app.screen.height + 100) {
                if (bullet.destroy) bullet.destroy();
                this.enemyBullets.splice(i, 1);
            }
        }

        // --- 2. Cập nhật Kẻ thù ---
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            if (!enemy) continue;

            if (this.player && this.player.health > 0) {
                try { enemy.update(ticker, this.appScreenHeight, this.player, this.enemies, gameTime); } catch (e) { console.warn('[EnemyManager] enemy.update error', e); }
            }

            if (enemy.isDead) {
                if (enemy.destroy) enemy.destroy();
                this.enemies.splice(i, 1);
                this.enemiesRemaining--;
            }
        }
        
        // --- 3. Xử lý Va chạm ---
        this.handlePlayerBulletCollision(gameTime);
        const playerDied = this.handleEnemyPlayerCollision(gameTime); 

        // Return number of remaining enemies so caller can decide when to change screens
        return this.enemiesRemaining;
    }
    
    handlePlayerBulletCollision(gameTime) {
        for (let i = this.playerBullets.length - 1; i >= 0; i--) {
            const bullet = this.playerBullets[i];
            
            if (!bullet || !bullet.parent || typeof bullet.x !== 'number') { 
                 this.playerBullets.splice(i, 1);
                 continue;
            }
            
            for (let j = this.enemies.length - 1; j >= 0; j--) {
                const enemy = this.enemies[j];

                // Defensive checks: ensure enemy is valid before reading properties
                if (!enemy) continue;
                if (enemy.isDead) continue;
                if (typeof enemy.x !== 'number' || typeof enemy.y !== 'number') continue;
                
                const dx = bullet.x - enemy.x;
                const dy = bullet.y - enemy.y;
                const distanceSq = dx * dx + dy * dy;
                const hitRadiusSq = (bullet.width/2 + enemy.width/2) * (bullet.width/2 + enemy.width/2);
                
                if (distanceSq < hitRadiusSq) {
                    const enemyDied = enemy.takeDamage(GameConstants.PLAYER_BULLET_DAMAGE); 
                    
                    bullet.destroy();
                    this.playerBullets.splice(i, 1);
                    
                    if (enemyDied && enemy.enemyType === 'Exploder') {
                        const ex = (enemy && typeof enemy.x === 'number') ? enemy.x : null;
                        const ey = (enemy && typeof enemy.y === 'number') ? enemy.y : null;

                        try { enemy.explode(this.player, this.enemies); } catch (e) { console.error('[EnemyManager] explode() threw', e); }

                        if (this.player && typeof this.player.x === 'number' && ex !== null && ey !== null) {
                            const dxp = ex - this.player.x;
                            const dyp = ey - this.player.y;
                            const distSqPlayer = dxp * dxp + dyp * dyp;
                            const radiusSq = GameConstants.EXPLOSION_RADIUS * GameConstants.EXPLOSION_RADIUS;
                            if (distSqPlayer <= radiusSq) {
                                this.player.takeDamage(GameConstants.EXPLOSION_DAMAGE, gameTime);
                            }
                        }
                    }
                    
                    if (enemyDied) { break; }
                    break;
                }
            }
        }
    }
    
    handleEnemyPlayerCollision(gameTime) {
        try {
            if (!this.player || this.player.health <= 0) return false;
            if (typeof this.player.x !== 'number' || typeof this.player.y !== 'number') return false;

            let playerKilled = false;

            for (let i = this.enemies.length - 1; i >= 0; i--) {
                const enemy = this.enemies[i];
                try {
                    // Defensive checks: skip if enemy is missing or doesn't have numeric position/size
                    if (!enemy) continue;
                    if (typeof enemy.x !== 'number' || typeof enemy.y !== 'number') continue;
                    if (typeof enemy.width !== 'number' || typeof this.player.width !== 'number') continue;

                    const dx = enemy.x - this.player.x;
                    const dy = enemy.y - this.player.y;
                    const distanceSq = dx * dx + dy * dy;
                    const hitRadiusSq = (enemy.width/2 + this.player.width/2) * (enemy.width/2 + this.player.width/2);
                    
                    if (distanceSq < hitRadiusSq) {
                        
                        if (enemy.enemyType === 'Exploder') {
                            playerKilled = this.player.takeDamage(GameConstants.EXPLOSION_DAMAGE, gameTime);
                            
                            const ex = (enemy && typeof enemy.x === 'number') ? enemy.x : null;
                            const ey = (enemy && typeof enemy.y === 'number') ? enemy.y : null;
                            
                            try { enemy.explode(this.player, this.enemies); } catch (e) { console.error('[EnemyManager] Exploder explosion error:', e); }

                            // VÌ EXPLODE ĐƯỢC XỬ LÝ Ở ĐÂY, TA CẦN CHUYỂN LOGIC SÁT THƯƠNG PLAYER VÀO TRONG EXPLODE()
                            // Nhưng để giữ logic sát thương Player ở đây, ta chỉ cần gọi explode()
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
                } catch (err) {
                    
                    // continue to next enemy instead of crashing
                    continue;
                }
            }
            
            for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
                const bullet = this.enemyBullets[i];
                
                if (!bullet || typeof bullet.x !== 'number' || typeof bullet.y !== 'number') {
                    // remove invalid bullet
                    if (bullet && bullet.destroy) bullet.destroy();
                    this.enemyBullets.splice(i, 1);
                    continue;
                }

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
        } catch (fatalErr) {
            const snapshot = this.enemies.map((e, idx) => ({ idx, exists: !!e, type: e?.enemyType, x: e?.x, y: e?.y, isDead: e?.isDead }));
            console.error('[EnemyManager] FATAL handleEnemyPlayerCollision error', fatalErr, { player: { x: this.player?.x, y: this.player?.y, health: this.player?.health }, enemiesSnapshot: snapshot });
            return false;
        }
    }
}