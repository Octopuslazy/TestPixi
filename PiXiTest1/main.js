import { Application, Sprite } from 'pixi.js';
import squirtleUrl from './UI/Character/Squirtle.png';

// Create the app using the modern (v8+) pattern and append the canvas
const app = new Application({ background: '#1099bb', resizeTo: window });
document.body.appendChild(app.view);

// Load sprite via Vite asset import
const sprite = Sprite.from(squirtleUrl);
sprite.anchor.set(0.5);
sprite.scale.set(0.18);
sprite.x = app.renderer.width / 2;
sprite.y = app.renderer.height / 3;
app.stage.addChild(sprite);

app.ticker.add(() => {
  sprite.rotation += 0.01;
});

console.log('App started. sprite size:', sprite.width, sprite.height, 'url:', squirtleUrl);