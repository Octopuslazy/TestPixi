import { Enemy } from './Enemy.js';
import { GameConstants } from './GameConstants.js';
import { BossBullet } from './BossBullet.js';
import { ExplosionEffect } from './ExplosionEffect.js';
import { Graphics } from 'pixi.js';
import { ShooterEnemy } from './ShooterEnemy.js';
import { ExploderEnemy } from './ExploderEnemy.js';
import { ChargerEnemy } from './ChargerEnemy.js';

export class BossEnemy extends Enemy {
    constructor(animations) {
        const hp = GameConstants.BOSS_HEALTH || 2000;
        super(animations, 'Boss', hp, GameConstants.BOSS_DAMAGE || 20);
        this.maxHealth = hp;
        this.enemyType = 'Boss';
        this.teleportCooldown = GameConstants.BOSS_TELEPORT_COOLDOWN || 5000; // ms
        this.lastTeleport = performance.now();
        this.lastAttack = performance.now();
        this.attackInterval = GameConstants.BOSS_ATTACK_COOLDOWN || 1500; // ms between attacks
        this.attackModes = ['triple', 'circle', 'homing'];
        this.manager = null; // will be set by EnemyManager when spawned
        this.attackCount = 0;
        this.isBoss = true;
        this.scale.set(2);
    }

    teleportRandom(appWidth, appHeight) {
        const padding = 100;
        const x = padding + Math.random() * (appWidth - padding * 2);
        const y = padding + Math.random() * (appHeight - padding * 2);
        this.x = x;
        this.y = y;
    }

    pickRandomAttack() {
        const idx = Math.floor(Math.random() * this.attackModes.length);
        return this.attackModes[idx];
    }

    performAttack(mode) {
        if (!this.manager || !this.manager.currentScreen) return;
        const screen = this.manager.currentScreen;
        const player = this.manager.player;
        const bulletTex = this.manager.enemyBulletTexture || this.manager.bulletTexture;

        if (mode === 'triple') {
            // middle aimed at player, sides +/- 18 degrees
            if (!player) return;
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const base = Math.atan2(dy, dx);
            const angles = [base, base + (18 * Math.PI / 180), base - (18 * Math.PI / 180)];
            angles.forEach(a => {
                const b = new BossBullet(bulletTex, a, { speed: 10, damage: GameConstants.ENEMY_BULLET_DAMAGE * 2 });
                b.x = this.x; b.y = this.y;
                screen.addChild(b);
                this.manager.enemyBullets.push(b);
            });
        } else if (mode === 'circle') {
            const count = 10;
            for (let i = 0; i < count; i++) {
                const a = (i / count) * Math.PI * 2;
                const b = new BossBullet(bulletTex, a, { speed: 6, damage: GameConstants.ENEMY_BULLET_DAMAGE * 2 });
                b.x = this.x; b.y = this.y;
                screen.addChild(b);
                this.manager.enemyBullets.push(b);
            }
        } else if (mode === 'homing') {
            // spawn a single slow homing projectile that persists until collision
            const a = 0; // initial angle doesn't matter much
            const homing = new BossBullet(bulletTex, a, { mode: 'homing', speed: 3, damage: GameConstants.ENEMY_BULLET_DAMAGE * 2, target: player, persistent: true });
            homing.x = this.x; homing.y = this.y;
            screen.addChild(homing);
            this.manager.enemyBullets.push(homing);
        }

        // After each attack, summon 3 random enemies
        this.summonMinions(3);
    }

    summonMinions(n) {
        if (!this.manager) return;
        const types = ['Shooter', 'Exploder', 'Charger'];
        for (let i = 0; i < n; i++) {
            const type = types[Math.floor(Math.random() * types.length)];
            // create via manager to keep consistency
            const spawnX = this.x + (Math.random() * 200 - 100);
            const spawnY = this.y + (Math.random() * 200 - 100);
            let enemy;
            const animationMap = { 'run': this.manager.enemyAnimations[`${type}_run`] };
            switch (type) {
                case 'Shooter':
                    enemy = new ShooterEnemy(animationMap, spawnX);
                    enemy.onShoot = this.manager.createBullet;
                    break;
                case 'Exploder':
                    enemy = new ExploderEnemy(animationMap);
                    enemy.onExplode = this.manager.createExplosion;
                    break;
                case 'Charger':
                    enemy = new ChargerEnemy(animationMap);
                    break;
            }
            if (enemy) {
                enemy.x = spawnX; enemy.y = spawnY;
                enemy.manager = this.manager;
                this.manager.currentScreen.addChild(enemy);
                this.manager.enemies.push(enemy);
            }
        }
    }

    update(ticker, screenHeight, player, enemies, gameTime) {
        if (this.isDead) return;
        const now = performance.now();
        // Teleport every teleportCooldown
        if (now - this.lastTeleport >= this.teleportCooldown) {
            this.lastTeleport = now;
            if (this.manager && this.manager.app) {
                this.teleportRandom(this.manager.app.screen.width, this.manager.app.screen.height);
            }
        }

        // Attack every attackInterval
        if (now - this.lastAttack >= this.attackInterval) {
            this.lastAttack = now;
            const mode = this.pickRandomAttack();
            this.performAttack(mode);
        }
    }

    // Override takeDamage to play death explosions if boss dies
    takeDamage(amount) {
        const died = super.takeDamage(amount);
        if (died) {
            this._playDeathExplosions();
        }
        return died;
    }

    _playDeathExplosions() {
        if (!this.manager || !this.manager.currentScreen || this._deathExploding) return;
        this._deathExploding = true;

        const screen = this.manager.currentScreen;
        const app = this.manager.app;
        const frames = this.manager.explosionFrames || null;
        // Capture boss position snapshot so we don't read `this.x` after the boss is destroyed
        const baseX = (typeof this.x === 'number') ? this.x : 0;
        const baseY = (typeof this.y === 'number') ? this.y : 0;

        // Immediately destroy other enemies in this scene and clear bullets
        try {
            const mgr = this.manager;
            if (mgr) {
                // Destroy other enemies (keep this boss for the explosion sequence)
                for (let i = mgr.enemies.length - 1; i >= 0; i--) {
                    const e = mgr.enemies[i];
                    if (!e) { mgr.enemies.splice(i, 1); continue; }
                    if (e === this) continue;
                    try {
                        if (e.parent) e.parent.removeChild(e);
                        if (typeof e.takeDamage === 'function') {
                            // ensure any on-death logic runs
                            e.takeDamage(Number.MAX_SAFE_INTEGER);
                        } else if (typeof e.destroy === 'function') {
                            e.destroy();
                        }
                    } catch (err) { /* ignore individual errors */ }
                    mgr.enemies.splice(i, 1);
                }

                // Remove and destroy enemy bullets
                for (let i = mgr.enemyBullets.length - 1; i >= 0; i--) {
                    const b = mgr.enemyBullets[i];
                    try { if (b && b.parent) b.parent.removeChild(b); if (b && typeof b.destroy === 'function') b.destroy(); } catch (e) {}
                    mgr.enemyBullets.splice(i, 1);
                }

                // Remove and destroy player bullets (if manager holds reference)
                if (Array.isArray(mgr.playerBullets)) {
                    for (let i = mgr.playerBullets.length - 1; i >= 0; i--) {
                        const pb = mgr.playerBullets[i];
                        try { if (pb && pb.parent) pb.parent.removeChild(pb); if (pb && typeof pb.destroy === 'function') pb.destroy(); } catch (e) {}
                        mgr.playerBullets.splice(i, 1);
                    }
                }

                // Update remaining count
                try { mgr.enemiesRemaining = mgr.enemies.length; } catch (e) {}
                console.log('[BossEnemy] Cleared other enemies and bullets on boss death.');
            }
        } catch (err) {
            console.warn('[BossEnemy] Error while clearing scene on boss death', err);
        }
        const duration = 3000; // ms
        const start = performance.now();
        let lastSpawn = 0;

        const tick = (delta) => {
            const now = performance.now();
            const elapsed = now - start;

            // spawn at random intervals between 80-250ms
            if (now - lastSpawn >= (80 + Math.random() * 170)) {
                lastSpawn = now;
                const rndR = 20 + Math.random() * 120;
                const angle = Math.random() * Math.PI * 2;
                const sx = baseX + Math.cos(angle) * rndR;
                const sy = baseY + Math.sin(angle) * rndR;

                if (frames && frames.length > 0) {
                    const fx = new ExplosionEffect(frames);
                    fx.x = sx; fx.y = sy;
                    fx.scale.set(1 + Math.random() * 1.5);
                    screen.addChild(fx);
                } else {
                    const gfx = new Graphics();
                    gfx.beginFill(0xff6600, 0.9);
                    gfx.drawCircle(0, 0, GameConstants.EXPLOSION_RADIUS * (0.3 + Math.random() * 0.8));
                    gfx.endFill();
                    gfx.x = sx; gfx.y = sy;
                    screen.addChild(gfx);
                    // fade and remove
                    const life = { t: 0 };
                    const lifeTick = (d) => {
                        life.t += d;
                        gfx.alpha = Math.max(0, 1 - life.t / 10);
                        if (life.t >= 10) {
                            app.ticker.remove(lifeTick);
                            if (gfx.parent) gfx.parent.removeChild(gfx);
                            gfx.destroy();
                        }
                    };
                    app.ticker.add(lifeTick);
                }
            }

            if (elapsed >= duration) {
                // stop and fully destroy boss
                app.ticker.remove(tick);
                try { if (this.parent) this.parent.removeChild(this); } catch (e) {}
                try { super.destroy(); } catch (e) {}
                return;
            }
        };

        app.ticker.add(tick);
    }
}
