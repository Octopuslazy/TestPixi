import { AnimatedSprite } from 'pixi.js';

export class BloodEffect extends AnimatedSprite {
    constructor(frames) {
        super(frames);
        this.animationSpeed = 0.6;
        this.loop = false;
        this.anchor.set(0.5);
        this.play();

        this.onComplete = () => {
            this.removeAndDestroy();
        };
    }

    removeAndDestroy() {
        if (this.parent) this.parent.removeChild(this);
        try { super.destroy({ children: true }); } catch (e) {}
    }
}
