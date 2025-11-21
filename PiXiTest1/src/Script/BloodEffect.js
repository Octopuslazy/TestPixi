import { AnimatedSprite } from 'pixi.js';

export class BloodEffect extends AnimatedSprite {
    constructor(frames) {
        super(frames);
        // Slower playback so the blood splatter is visible longer
        this.animationSpeed = 0.22;
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
