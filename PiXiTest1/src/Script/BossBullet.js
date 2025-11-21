import { Sprite } from 'pixi.js';
import { GameConstants } from './GameConstants.js';

export class BossBullet extends Sprite {
    /**
     * mode = 'normal' | 'homing'
     */
    constructor(texture, angle, options = {}) {
        super(texture);
        this.anchor.set(0.5);
        this.mode = options.mode || 'normal';
        this.speed = options.speed || 8;
        this.damage = options.damage || GameConstants.ENEMY_BULLET_DAMAGE * 2; // boss bullets do double damage
        this.vx = Math.cos(angle) * this.speed;
        this.vy = Math.sin(angle) * this.speed;
        this.homingTarget = options.target || null;
        this.homingTurn = 0.06; // how quickly homing adjusts
        this.persistent = !!options.persistent; // if true, only removed on collision
        this.scale.set(0.48);
    }

    update(ticker) {
        const dt = (typeof ticker?.deltaTime === 'number') ? ticker.deltaTime : 1;
        if (this.mode === 'homing' && this.homingTarget && this.homingTarget.parent) {
            const dx = this.homingTarget.x - this.x;
            const dy = this.homingTarget.y - this.y;
            const angle = Math.atan2(dy, dx);
            // adjust velocity gradually towards target
            const nx = Math.cos(angle) * this.speed;
            const ny = Math.sin(angle) * this.speed;
            this.vx += (nx - this.vx) * this.homingTurn * dt;
            this.vy += (ny - this.vy) * this.homingTurn * dt;
        }

        this.x += this.vx * dt;
        this.y += this.vy * dt;
    }

    destroy() {
        if (this.parent) this.parent.removeChild(this);
    }
}
