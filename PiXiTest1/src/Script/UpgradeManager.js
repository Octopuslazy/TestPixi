import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { GameConstants } from './GameConstants.js';

// Simple upgrade definitions
const ALL_UPGRADES = [
    { id: 'dmg_plus_20', title: '+20 Damage', desc: 'Increase weapon damage by 20 (flat)', type: 'weapon', apply: (player) => { player.weaponDamageFlat = (player.weaponDamageFlat || 0) + 20; } },
    { id: 'proj_size_20p', title: '+20% Projectile Size', desc: 'Increase projectile size by 20%', type: 'weapon', apply: (player) => { player.projectileSizePercent = (player.projectileSizePercent || 0) + 0.20; } },
    { id: 'multishot_3', title: 'Multishot (x3) / -50% Damage', desc: 'Spawn 3 projectiles per shot, but reduce player damage by 50% (costs 3 ammo per shot)', type: 'weapon',
        apply: function(player) {
            this.picked = true;
            player.multiShot = Math.max(player.multiShot || 1, 3);
            player.multiShotAmmoCost = 3;
            player.weaponDamagePercent = (player.weaponDamagePercent || 0) - 0.5;
        }
    },
    { id: 'slow_on_hit_10p', title: 'Slow On Hit 10%', desc: 'Bullets apply 10% slow on enemies on hit', type: 'weapon', apply: (player) => { player.slowOnHit = (player.slowOnHit || 0) + 0.10; } },
    { id: 'dmg_plus_50p_move_minus_30p', title: '+30% Damage / -30% Move', desc: '+30% damage but -30% move speed', type: 'mixed', apply: (player) => { player.weaponDamagePercent = (player.weaponDamagePercent || 0) + 0.3; player.moveSpeedPercent = (player.moveSpeedPercent || 0) - 0.3; } },
    { id: 'hp_plus_500_move_minus_30p', title: '+300 HP / -50% Move', desc: '+300 max HP but -50% move speed', type: 'mixed', apply: (player) => { player.maxHealth = (player.maxHealth || GameConstants.PLAYER_BASE_HEALTH) + 300; player.health = Math.min(player.health + 300, player.maxHealth); player.moveSpeedPercent = (player.moveSpeedPercent || 0) - 0.5; } },
    { id: 'dmg_plus_50p_enemies_fast', title: '+30% Damage / Enemies +60% Speed', desc: '+30% damage but enemies move 60% faster', type: 'mixed', apply: (player) => { player.weaponDamagePercent = (player.weaponDamagePercent || 0) + 0.3; GameConstants.ENEMY_GLOBAL_SPEED_MULTIPLIER = (GameConstants.ENEMY_GLOBAL_SPEED_MULTIPLIER || 1) * 1.6; } },
    { id: 'hp_plus_500_enemies_fast', title: '+300 HP / Enemies +60% Speed', desc: '+300 HP but enemies move 60% faster', type: 'mixed', apply: (player) => { player.maxHealth = (player.maxHealth || GameConstants.PLAYER_BASE_HEALTH) + 300; player.health = Math.min(player.health + 300, player.maxHealth); GameConstants.ENEMY_GLOBAL_SPEED_MULTIPLIER = (GameConstants.ENEMY_GLOBAL_SPEED_MULTIPLIER || 1) * 1.6; } },
    { id: 'hp_plus_100', title: '+100 Max HP', desc: 'Increase max HP by 100', type: 'player', apply: (player) => { player.maxHealth = (player.maxHealth || GameConstants.PLAYER_BASE_HEALTH) + 100; player.health = Math.min(player.health + 100, player.maxHealth); } },
];

function pickThreeRandom() {
    // Exclude upgrades that have been marked as picked (one-time)
    const source = ALL_UPGRADES.filter(u => !u.picked);
    const picks = [];
    while (picks.length < 3 && source.length > 0) {
        const idx = Math.floor(Math.random() * source.length);
        picks.push(source.splice(idx, 1)[0]);
    }
    return picks;
}

export async function presentUpgradeChoices(app, screen, player) {
    return new Promise((resolve) => {
        const overlay = new Container();
        overlay.zIndex = 2000;
        overlay.x = app.screen.width / 2;
        overlay.y = app.screen.height / 2;

        const bg = new Graphics();
        bg.beginFill(0x000000, 0.7).drawRect(-app.screen.width/2, -app.screen.height/2, app.screen.width, app.screen.height).endFill();
        overlay.addChild(bg);

        const picks = pickThreeRandom();

        const cardW = 220; const cardH = 180; const spacing = 30;
        const startX = -((cardW*3 + spacing*2)/2) + cardW/2;

        const titleStyle = new TextStyle({ fontFamily: 'Arial', fontSize: 18, fill: 'white', fontWeight: 'bold', wordWrap: true, wordWrapWidth: cardW - 20 });
        const descStyle = new TextStyle({ fontFamily: 'Arial', fontSize: 14, fill: 'white', wordWrap: true, wordWrapWidth: cardW - 20 });

        picks.forEach((p, i) => {
            const card = new Graphics();
            card.beginFill(0x222244, 0.95).drawRoundedRect(-cardW/2, -cardH/2, cardW, cardH, 8).endFill();
            // card position will be handled by the cardContainer; keep graphics at (0,0)

            // Put texts inside the card to keep layout local and avoid global overflow
            const title = new Text(p.title, titleStyle);
            title.anchor.set(0.5, 0);
            title.x = 0; title.y = -cardH/2 + 10;

            const desc = new Text(p.desc, descStyle);
            desc.anchor.set(0.5, 0);
            // place desc below title using actual title height so wrapped titles push description down
            // default to a small offset and then correct after measuring title height
            desc.x = 0; desc.y = title.y + 8;

            // Use a container per card so children are positioned relative to card center
            const cardContainer = new Container();
            cardContainer.x = startX + i * (cardW + spacing);
            cardContainer.y = -20;
            cardContainer.addChild(card);
            cardContainer.addChild(title);
            // ensure desc sits after title's wrapped lines
            cardContainer.addChild(desc);
            // adjust desc y after Text metrics are available
            try { desc.y = title.y + title.height + 8; } catch (e) {}
            cardContainer.interactive = true;
            cardContainer.cursor = 'pointer';
            overlay.addChild(cardContainer);

            cardContainer.on('pointerdown', () => {
                try { p.apply(player); } catch (e) { console.error('Upgrade apply failed', e); }
                // cleanup
                if (overlay.parent) overlay.parent.removeChild(overlay);
                resolve(p);
            });
        });

        screen.addChild(overlay);
    });
}

export { ALL_UPGRADES };
