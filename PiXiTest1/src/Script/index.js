import { Application, Graphics, Sprite, Text, TextStyle, Container } from 'pixi.js'; 
import { loadAllGameAssets } from './AssetLoader.js'; 
import { GameConstants } from './GameConstants.js';
import { Player } from './player.js';          
import { Keyboard } from './keyboard.js';        
import { initSceneManager, Screens, gotoScreen } from './ScenesManager.js'; 
import { Bullet } from './Bullet.js';
import { EnemyManager } from './EnemyManager.js';

let app; 
let gameLoopRunning = false; 

let player;
let bulletTexture; 
let bullets = []; 

let MAX_PLAYER_X = 0; 
let MIN_PLAYER_X = 100;

let currentScreen = null;
let enemyManager;

// HUD elements
let hudContainer;
let healthText;
let ammoText;
let stageText;

// Hàm tính toán kích thước màn hình
const updateLayout = () => {
    MAX_PLAYER_X = app.screen.width - 100; 
    
    if (enemyManager) {
        enemyManager.appScreenHeight = app.screen.height;
    }
    
    console.log(`[Layout] MAX_PLAYER_X updated to: ${MAX_PLAYER_X}`);
};

/**
 * Hàm tạo đạn (được gán vào player.onShoot)
 */
function createBullet(globalX, globalY, angle) {
    if (!bulletTexture || !currentScreen || !Bullet) return; 

    const bullet = new Bullet(bulletTexture, angle);
    
    bullet.x = globalX; 
    bullet.y = globalY; 

    // Apply configured player bullet scale
    try {
        const scale = GameConstants.PLAYER_BULLET_SCALE || 1;
        bullet.scale.x *= scale;
        bullet.scale.y *= scale;
    } catch (e) {}

    currentScreen.addChild(bullet); 
    bullets.push(bullet);
}

// BỔ SUNG: Hàm chuyển màn hình
function changeScreen() {
    if (!player) { 
        console.error("LỖI CHUYỂN MÀN HÌNH: Player không tồn tại.");
        return false;
    }
    
    const prevScreen = currentScreen;
    
    // 1. Xác định Screen mới
    if (currentScreen === Screens.SCREEN1) {
        currentScreen = Screens.SCREEN2;
    } else if (currentScreen === Screens.SCREEN2) {
        currentScreen = Screens.SCREEN3; 
    } else if (currentScreen === Screens.SCREEN3) {
        currentScreen = Screens.SCREEN1;
    }
    
    // 2. DI CHUYỂN PLAYER VÀ DEBUGLINE SANG CONTAINER MỚI
    currentScreen.addChild(player); 
    
    // 3. THIẾT LẬP ENEMY MANAGER CHO SCREEN MỚI
    enemyManager.currentScreen = currentScreen;
    enemyManager.enemies.forEach(e => e.destroy()); 
    enemyManager.enemies = []; 
    enemyManager.enemyBullets.forEach(b => b.destroy());
    enemyManager.enemyBullets = []; 
    enemyManager.isWaveSpawned = false; 
    enemyManager.spawnWave(); 

    // 4. Chuyển màn hình và đặt lại vị trí Player ở rìa trái (Y ở giữa)
    gotoScreen(currentScreen);
    player.x = MIN_PLAYER_X;
    player.y = app.screen.height / 2; 
    player.setMovement(0, 0); 
    
    console.log(`Chuyển sang màn hình mới: ${currentScreen === Screens.SCREEN1 ? 'SCREEN1' : 'SCREEN2'}`);
    
    return true;
}

// BỔ SUNG: Hàm khởi tạo lại game state
async function resetGame() {
    // 1. Dọn dẹp màn hình Game Over
    Screens.OVERLAY.removeChildren(); 
    Screens.OVERLAY.visible = false;
    
    // 2. Reset Player
    player.resetStats(); 
    player.x = MIN_PLAYER_X;
    player.y = app.screen.height / 2; 
    
    // 3. Xóa đạn cũ
    // SỬA LỖI BẮN XUYÊN: Đảm bảo đạn cũ bị hủy hoàn toàn
    bullets.forEach(b => {
        if (b.parent) b.parent.removeChild(b);
        b.destroy({ children: true });
    });
    bullets = []; 
    // IMPORTANT: đảm bảo EnemyManager tham chiếu tới mảng bullets mới
    if (enemyManager) {
        enemyManager.setPlayerBullets(bullets);
    }

    // 4. Reset Screen
    currentScreen = Screens.SCREEN1;
    gotoScreen(currentScreen);
    
    // 5. Reset Enemy Manager
    enemyManager.currentScreen = currentScreen;
    enemyManager.enemies.forEach(e => e.destroy());
    enemyManager.enemies = [];
    enemyManager.enemyBullets.forEach(b => b.destroy());
    enemyManager.enemyBullets = [];
    enemyManager.isWaveSpawned = false;
    enemyManager.spawnWave(); 
    
    // 6. Đảm bảo Player được thêm vào Screen 1
    if (!player.parent) Screens.SCREEN1.addChild(player);
    
    // 7. Khởi động lại game loop
    gameLoopRunning = true;
    console.log("Game Reset! Bắt đầu lại.");
}

// BỔ SUNG: Hàm hiển thị màn hình Game Over
function showGameOverScreen() { 
    gameLoopRunning = false; 
    
    const overlay = new Graphics();
    overlay.rect(0, 0, app.screen.width, app.screen.height).fill({ color: 0x000000, alpha: 0.7 });
    
    const style = new TextStyle({ fontFamily: 'Arial', fontSize: 48, fill: 'white' });
    const gameOverText = new Text({ text: 'GAME OVER', style });
    gameOverText.anchor.set(0.5);
    gameOverText.x = app.screen.width / 2;
    gameOverText.y = app.screen.height / 2 - 50;
    
    const buttonStyle = new TextStyle({ fontFamily: 'Arial', fontSize: 24, fill: 'black' });
    const playAgainText = new Text({ text: 'PLAY AGAIN', style: buttonStyle });
    playAgainText.anchor.set(0.5);
    
    // Use a Container for the button so we don't add children to a Graphics (v8 restriction)
    const button = new Container();
    const buttonBg = new Graphics();
    buttonBg.rect(0, 0, 200, 50).fill({ color: 0xFFFFFF, alpha: 1 });
    // Position the background at 0,0 inside the container and set container position on screen
    buttonBg.x = 0; buttonBg.y = 0;
    playAgainText.x = 100; 
    playAgainText.y = 25;
    button.addChild(buttonBg);
    button.addChild(playAgainText);
    button.x = app.screen.width / 2 - 100;
    button.y = app.screen.height / 2 + 20;
    
    button.eventMode = 'static';
    button.cursor = 'pointer';
    button.on('pointerdown', resetGame);
    
    Screens.OVERLAY.addChild(overlay);
    Screens.OVERLAY.addChild(gameOverText);
    Screens.OVERLAY.addChild(button);
    
    Screens.OVERLAY.visible = true;
}


(async () => {
    app = new Application();
    
    console.log("[Index] Khởi tạo Pixi App...");
    await app.init({ 
        background: '#1a2435', 
        resizeTo: window 
    });
    document.body.appendChild(app.canvas);

    app.stage.position.set(0, 0);
    
    app.stage.eventMode = 'static';
    app.stage.hitArea = app.screen;

    initSceneManager(app);
    currentScreen = Screens.SCREEN1; 
    
    console.log("[Index] Scene Manager đã khởi tạo. Bắt đầu tải Assets.");

    // --- Load Assets ---
    let allAnimations;
    try {
        allAnimations = await loadAllGameAssets();
    } catch (error) {
        console.error("[Index] Lỗi nghiêm trọng khi tải Assets:", error); 
        return; 
    }
    
    console.log("[Index] Assets tải thành công. Bắt đầu tạo Player.");

    const playerAnimations = allAnimations['Player'];
    const gunTexture = allAnimations['GunTexture'];
    bulletTexture = allAnimations['BulletTexture']; 
    const enemyAnimations = allAnimations['Enemy'] || playerAnimations; 
    const allFrames = allAnimations;
    if (!playerAnimations || !gunTexture || !bulletTexture) {
        console.error("[Index] LỖI: Thiếu một trong các asset cần thiết (Player, Gun, Bullet).");
        return;
    }

    // --- Create Player ---
    const gunSprite = new Sprite(gunTexture); 
    
    player = new Player(playerAnimations, gunSprite);
    player.onShoot = createBullet; 
    
    // Đặt scale
    player.defaultScaleX = 2; 
    player.scale.set(player.defaultScaleX); 
    
    // Vị trí Player ban đầu
    player.x = MIN_PLAYER_X; 
    player.y = app.screen.height / 2; 
    
    Screens.SCREEN1.addChild(player);
    
    console.log("[Index] Player đã được thêm vào Stage tại X: " + player.x + " Y: " + player.y);
    console.log('[Index] Player debug:', player.constructor.name, 'textures=', player.textures?.length, 'playing=', player.playing);

    // --- HUD (Health / Ammo / Stage) ---
    hudContainer = new Container();
    hudContainer.zIndex = 1000;
    const hudStyle = new TextStyle({ fontFamily: 'Arial', fontSize: 18, fill: 'white' });
    healthText = new Text({ text: `Health: ${player.health}`, style: hudStyle });
    ammoText = new Text({ text: `Ammo: ${player.currentAmmo}`, style: hudStyle });
    stageText = new Text({ text: `Stage: ${currentScreen?.label || 'SCREEN1'}`, style: hudStyle });

        // Boss health bar (hidden until boss appears)
        const bossBarBg = new Graphics();
        const bossBarFg = new Graphics();
        const bossBarContainer = new Container();
        bossBarContainer.zIndex = 1001;
        bossBarContainer.visible = false;
        bossBarBg.beginFill(0x222222, 0.8).drawRect(-150, -10, 300, 20).endFill();
        bossBarFg.beginFill(0xff0000, 1).drawRect(-145, -7, 290, 14).endFill();
        bossBarContainer.addChild(bossBarBg, bossBarFg);
        bossBarContainer.x = app.screen.width / 2;
        bossBarContainer.y = 30;
        hudContainer.addChild(bossBarContainer);

        // Instruction text shown when enemies cleared
        const instrStyle = new TextStyle({ fontFamily: 'Arial', fontSize: 20, fill: 'yellow' });
        const advanceText = new Text({ text: 'All enemies defeated — Move right to advance', style: instrStyle });
        advanceText.anchor.set(0.5);
        advanceText.x = app.screen.width / 2;
        advanceText.y = app.screen.height - 40;
        advanceText.visible = false;
        hudContainer.addChild(advanceText);

    healthText.x = 10; healthText.y = 10;
    ammoText.x = 10; ammoText.y = 30;
    stageText.x = 10; stageText.y = 50;

    hudContainer.addChild(healthText);
    hudContainer.addChild(ammoText);
    hudContainer.addChild(stageText);
    app.stage.addChild(hudContainer);

    // --- KHỞI TẠO ENEMY MANAGER ---
    enemyManager = new EnemyManager(app, Screens.SCREEN1, enemyAnimations, bulletTexture, app.screen.height, player, allFrames);
    enemyManager.setPlayerBullets(bullets); 
    enemyManager.spawnWave(); 

    // --- Layout ---
    updateLayout();
    window.addEventListener('resize', () => updateLayout());

    // --- Inputs ---
    const keyA = Keyboard('KeyA');
    const keyD = Keyboard('KeyD');
    const keyW = Keyboard('KeyW'); 
    const keyS = Keyboard('KeyS'); 
    const keyR = Keyboard('KeyR'); 

    // SỬA LỖI: Logic Input 4 hướng
    const updateMovement = () => {
        let dx = 0;
        let dy = 0;
        
        // Kiểm tra tất cả các phím đang được nhấn (isDown)
        if (keyA.isDown) dx -= 1;
        if (keyD.isDown) dx += 1;
        if (keyW.isDown) dy -= 1;
        if (keyS.isDown) dy += 1;
        
        player.setMovement(dx, dy);
    };

    // Thay đổi: sử dụng polling mỗi frame thay vì gọi updateMovement từ press/release
    // Điều này đảm bảo chỉ di chuyển khi phím được giữ (isDown === true)
    // (Giữ nguyên keyR.press để reload vẫn hoạt động)
    
    keyR.press = () => player.reload(); 
    
    // --- Mouse Input ---
    let mouseGlobalPos = { x: 0, y: 0 }; 

    app.stage.on('pointermove', (e) => {
        mouseGlobalPos = e.global;
    });
    
    app.stage.on('pointerdown', () => {
        player.shoot();
    });
    
    gameLoopRunning = true; 

    // --- Game Loop ---
    app.ticker.add((delta) => {
        if (!gameLoopRunning) return; 

        // Wrap delta into an object with deltaTime so existing update signatures keep working
        const tickerObj = { deltaTime: delta };

        // Cập nhật input bằng polling (chỉ di chuyển khi phím đang giữ)
        updateMovement();

        // Cập nhật logic nhân vật
        player.update(tickerObj, app.screen.height, mouseGlobalPos, MIN_PLAYER_X, MAX_PLAYER_X); 

        // --- CẬP NHẬT HUD ---
        if (healthText && ammoText && stageText) {
            healthText.text = `Health: ${player.health}`;
            ammoText.text = `Ammo: ${player.currentAmmo}`;
            stageText.text = `Stage: ${currentScreen?.label || 'SCREEN1'}`;
        }
        
        // Cập nhật và Dọn dẹp Đạn
        for (let i = bullets.length - 1; i >= 0; i--) {
            const bullet = bullets[i];
            // Đảm bảo Sprite còn parent (còn trên Stage) trước khi update
            if (bullet.parent === currentScreen) { 
                bullet.update(tickerObj);
            } else {
                bullet.destroy();
                bullets.splice(i, 1);
            }
        }
        
        // --- CẬP NHẬT KẺ THÙ ---
        const remaining = enemyManager.update(tickerObj);

        // Update boss HUD if boss present
        try {
            const boss = enemyManager.enemies.find(e => e && e.enemyType === 'Boss');
            if (boss) {
                // show and update boss bar
                bossBarContainer.visible = true;
                const maxHp = (boss.maxHealth || boss.maxHealth || boss.health || 1); // fallback
                const pct = Math.max(0, Math.min(1, (typeof boss.health === 'number' ? boss.health : 0) / maxHp));
                // redraw foreground width
                bossBarFg.clear();
                bossBarFg.beginFill(0xff0000, 1).drawRect(-145, -7, 290 * pct, 14).endFill();
            } else {
                bossBarContainer.visible = false;
            }
        } catch (e) {
            // ignore HUD errors
        }

        // show advance text when no enemies remain
        try {
            if (typeof remaining === 'number' && remaining === 0) {
                advanceText.visible = true;
            } else {
                advanceText.visible = false;
            }
        } catch (e) {}
        
        // --- KIỂM TRA GAME OVER ---
        if (player.health <= 0) {
            showGameOverScreen(); 
        }
        
        // --- LOGIC CHUYỂN MÀN HÌNH ---
        if (player.x >= MAX_PLAYER_X && remaining === 0) { 
            player.x = MAX_PLAYER_X;
            player.setMovement(0, 0); 
            changeScreen();
        }
    });

    console.log("Game Started! Click mouse to shoot.");
})();