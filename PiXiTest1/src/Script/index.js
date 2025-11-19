import { Application, Graphics, Sprite, Text, TextStyle, Container } from 'pixi.js'; 
import { loadAllGameAssets } from './AssetLoader.js'; 
import { Player } from './player.js';          
import { Keyboard } from './keyboard.js';        
import { initSceneManager, Screens, gotoScreen } from './ScenesManager.js'; 
import { Bullet } from './Bullet.js';
import { EnemyManager } from './EnemyManager.js';

let app; // KHAI BÁO BIẾN APP TOÀN CỤC
let gameLoopRunning = false; 

let GROUND_Y_POSITION = 0; 
let player;
let debugGroundLine;
let bulletTexture; 
let bullets = []; 

const GROUND_MARGIN = 200; 
let MAX_PLAYER_X = 0; 
let MIN_PLAYER_X = 100;

let currentScreen = null;
let enemyManager;

// Hàm tính toán vị trí đường màu đỏ (mặt đất)
const updateLayout = (app) => {
    GROUND_Y_POSITION = Math.round(app.screen.height - GROUND_MARGIN);
    MAX_PLAYER_X = app.screen.width - 100; 
    console.log(`[Layout] Ground Y updated to: ${GROUND_Y_POSITION}`);
};

/**
 * Hàm tạo đạn (được gán vào player.onShoot)
 */
function createBullet(globalX, globalY, angle) {
    if (!bulletTexture || !currentScreen || !Bullet) return; 

    const bullet = new Bullet(bulletTexture, angle);
    
    bullet.x = globalX; 
    bullet.y = globalY; 

    currentScreen.addChild(bullet); 
    bullets.push(bullet);
}

// BỔ SUNG: Hàm chuyển màn hình
function changeScreen() {
    if (!player || !debugGroundLine) {
        console.error("LỖI CHUYỂN MÀN HÌNH: Player hoặc DebugLine không tồn tại.");
        return false;
    }
    
    const prevScreen = currentScreen;
    
    // 1. Xác định Screen mới
    if (currentScreen === Screens.SCREEN1) {
        currentScreen = Screens.SCREEN2;
    } else if (currentScreen === Screens.SCREEN2) {
        currentScreen = Screens.SCREEN1; 
    }
    
    // 2. DI CHUYỂN PLAYER VÀ DEBUGLINE SANG CONTAINER MỚI
    currentScreen.addChild(player); 
    currentScreen.addChild(debugGroundLine);
    
    // 3. THIẾT LẬP ENEMY MANAGER CHO SCREEN MỚI
    enemyManager.currentScreen = currentScreen;
    enemyManager.enemies.forEach(e => e.destroy()); // Hủy kẻ thù cũ
    enemyManager.enemies = []; 
    enemyManager.enemyBullets.forEach(b => b.destroy());
    enemyManager.enemyBullets = []; 
    enemyManager.isWaveSpawned = false; 
    enemyManager.spawnWave(); // Tạo wave mới cho màn hình mới

    // 4. Chuyển màn hình và đặt lại vị trí Player ở rìa trái
    gotoScreen(currentScreen);
    player.x = MIN_PLAYER_X;
    player.setMovement(0); 
    
    console.log(`Chuyển sang màn hình mới: ${currentScreen === Screens.SCREEN1 ? 'SCREEN1' : 'SCREEN2'}`);
    
    return true;
}

// BỔ SUNG: Hàm khởi tạo lại game state
// BỔ SUNG: Hàm khởi tạo lại game state
async function resetGame() {
    // 1. Dọn dẹp màn hình Game Over
    Screens.OVERLAY.removeChildren(); 
    Screens.OVERLAY.visible = false;
    
    // 2. Reset Player
    player.resetStats(); 
    player.x = MIN_PLAYER_X;
    player.y = 0;
    
    // 3. Xóa đạn cũ
    // ĐẢM BẢO XÓA TẤT CẢ SPRITE TRONG DANH SÁCH BULLETS
    bullets.forEach(b => {
        if (b.parent) b.parent.removeChild(b);
        b.destroy({ children: true });
    });
    bullets = []; // Reset mảng

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
    enemyManager.spawnWave(); // Tạo wave đầu tiên
    
    // 6. Đảm bảo Player được thêm vào Screen 1
    if (!player.parent) Screens.SCREEN1.addChild(player);
    if (!debugGroundLine.parent) Screens.SCREEN1.addChild(debugGroundLine);
    
    // 7. Khởi động lại game loop
    gameLoopRunning = true;
    console.log("Game Reset! Bắt đầu lại.");
}

// BỔ SUNG: Hàm hiển thị màn hình Game Over
function showGameOverScreen(app) { // NHẬN APP LÀM THAM SỐ
    gameLoopRunning = false; // Dừng game loop
    
    // 1. Tạo màn hình overlay xám
    const overlay = new Graphics();
    // SỬA LỖI: Truy cập app.screen.width/height từ tham số
    overlay.rect(0, 0, app.screen.width, app.screen.height).fill({ color: 0x000000, alpha: 0.7 });
    
    // 2. Tạo Text Game Over
    const style = new TextStyle({
        fontFamily: 'Arial',
        fontSize: 48,
        fill: 'white'
    });
    const gameOverText = new Text({ text: 'GAME OVER', style });
    gameOverText.anchor.set(0.5);
    gameOverText.x = app.screen.width / 2;
    gameOverText.y = app.screen.height / 2 - 50;
    
    // 3. Tạo nút Play Again
    const buttonStyle = new TextStyle({
        fontFamily: 'Arial',
        fontSize: 24,
        fill: 'black'
    });
    const playAgainText = new Text({ text: 'PLAY AGAIN', style: buttonStyle });
    playAgainText.anchor.set(0.5);
    
    const button = new Graphics();
    button.rect(0, 0, 200, 50).fill(0xFFFFFF); // Nền nút trắng
    button.x = app.screen.width / 2 - 100;
    button.y = app.screen.height / 2 + 20;
    
    // Gắn text vào nút
    button.addChild(playAgainText);
    playAgainText.x = 100; // Căn giữa trong nút
    playAgainText.y = 25;
    
    // Thiết lập tương tác cho nút
    button.eventMode = 'static';
    button.cursor = 'pointer';
    button.on('pointerdown', resetGame);
    
    // 4. Thêm vào màn hình overlay
    Screens.OVERLAY.addChild(overlay);
    Screens.OVERLAY.addChild(gameOverText);
    Screens.OVERLAY.addChild(button);
    
    // 5. Hiển thị Overlay
    Screens.OVERLAY.visible = true;
}


(async () => {
    // Gán biến app toàn cục
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
    player.y = 0; 
    
    Screens.SCREEN1.addChild(player);
    
    console.log("[Index] Player đã được thêm vào Stage tại X: " + player.x + " Y: " + player.y);

    // --- Debug Line (Đường màu đỏ) ---
    debugGroundLine = new Graphics();
    Screens.SCREEN1.addChild(debugGroundLine);

    // --- KHỞI TẠO ENEMY MANAGER ---
    enemyManager = new EnemyManager(app, Screens.SCREEN1, enemyAnimations, bulletTexture, GROUND_Y_POSITION, player);
    enemyManager.setPlayerBullets(bullets); 
    enemyManager.spawnWave(); 

    // --- Layout ---
    updateLayout(app);
    // Lắng nghe sự kiện resize
    window.addEventListener('resize', () => updateLayout(app));

    // --- Inputs ---
    const keyA = Keyboard('KeyA');
    const keyD = Keyboard('KeyD');
    const keySpace = Keyboard('Space');
    const keyR = Keyboard('KeyR'); 

    keyA.press = () => player.setMovement(-1);
    keyA.release = () => { if (!keyD.isDown) player.setMovement(0); }; 

    keyD.press = () => player.setMovement(1);
    keyD.release = () => { if (!keyA.isDown) player.setMovement(0); }; 

    keySpace.press = () => player.jump();
    keyR.press = () => player.reload(); 
    
    // --- Mouse Input ---
    let mouseGlobalPos = { x: 0, y: 0 }; 

    app.stage.on('pointermove', (e) => {
        mouseGlobalPos = e.global;
    });
    
    app.stage.on('pointerdown', () => {
        player.shoot();
    });
    
    gameLoopRunning = true; // Bắt đầu game loop

    // --- Game Loop ---
    app.ticker.add((ticker) => {
        if (!gameLoopRunning) return; // Dừng nếu Game Over

        // Cập nhật logic nhân vật
        player.update(ticker, GROUND_Y_POSITION, mouseGlobalPos, MIN_PLAYER_X, MAX_PLAYER_X); 
        
        // Cập nhật và Dọn dẹp Đạn
        for (let i = bullets.length - 1; i >= 0; i--) {
            const bullet = bullets[i];
            if (bullet.parent === currentScreen) { 
                bullet.update(ticker);
            } else {
                bullet.destroy();
                bullets.splice(i, 1);
            }
        }
        
        // --- CẬP NHẬT KẺ THÙ ---
        const remaining = enemyManager.update(ticker);
        
        // --- KIỂM TRA GAME OVER ---
        if (player.health <= 0) {
            showGameOverScreen(app); // TRUYỀN APP VÀO HÀM
        }
        
        // --- LOGIC CHUYỂN MÀN HÌNH ---
        if (player.x >= MAX_PLAYER_X && remaining === 0) { 
            player.x = MAX_PLAYER_X;
            player.setMovement(0);
            changeScreen();
        }
        
        // Vẽ lại đường màu đỏ 
        if (debugGroundLine) {
            debugGroundLine.clear();
            debugGroundLine.rect(0, GROUND_Y_POSITION, app.screen.width, 2).fill(0xFF0000); 
        }
    });

    console.log("Game Started! Click mouse to shoot.");
})();