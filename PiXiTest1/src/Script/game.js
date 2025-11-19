import { Application, Graphics, Sprite, Point } from 'pixi.js'; 
import { loadAllGameAssets } from './AssetLoader.js'; 
import { Player } from './player.js';          
import { Keyboard } from './keyboard.js';        
import { initSceneManager, Screens } from './ScenesManager.js';

let GROUND_Y_POSITION = 0; 
let player;
let debugGroundLine;

// Hàm tính toán vị trí đường màu đỏ (mặt đất)
const updateLayout = (app) => {
    // Cách đáy màn hình 550px
    const bottomMargin = 550; 
    GROUND_Y_POSITION = Math.round(app.screen.height - bottomMargin);

    console.log(`[Layout] Ground Y updated to: ${GROUND_Y_POSITION}`);
};

(async () => {
    const app = new Application();
    await app.init({ 
        background: '#1a2435', 
        resizeTo: window 
    });
    document.body.appendChild(app.canvas);

    // Đảm bảo Stage ở gốc toạ độ
    app.stage.position.set(0, 0);

    initSceneManager(app);

    // --- Load Assets ---
    let allAnimations;
    try {
        allAnimations = await loadAllGameAssets();
    } catch (error) {
        console.error("Failed assets:", error);
        return; 
    }

    const playerAnimations = allAnimations['Player'];
    // Lấy texture súng từ assets đã tải (giả định AssetLoader đã hoàn tất)
    const gunTexture = allAnimations['GunTexture']; 

    if (!playerAnimations || !gunTexture) return; // Đảm bảo cả hai đều tồn tại

    // --- Create Player ---
    // Tạo Sprite súng
    const gunSprite = new Sprite(gunTexture); 
    
    // Truyền gunSprite vào constructor của Player
    player = new Player(playerAnimations, gunSprite);
    
    // Đặt nhân vật ở vị trí X=100, Y=0 (trên đỉnh màn hình)
    player.x = 100;
    player.y = 0; 
    
    // Thiết lập tỷ lệ phóng to cho Player và Súng (con của Player)
    player.defaultScaleX = 3; 
    player.scale.set(player.defaultScaleX);
    
    Screens.SCREEN1.addChild(player);

    // --- Debug Line (Đường màu đỏ) ---
    debugGroundLine = new Graphics();
    Screens.SCREEN1.addChild(debugGroundLine);
    
    // --- Layout ---
    updateLayout(app);
    window.addEventListener('resize', () => updateLayout(app));

    // --- Inputs ---
    const keyA = Keyboard('KeyA');
    const keyD = Keyboard('KeyD');
    const keySpace = Keyboard('Space');

    keyA.press = () => player.setMovement(-1);
    keyA.release = () => { if (!keyD.isDown) player.setMovement(0); }; 

    keyD.press = () => player.setMovement(1);
    keyD.release = () => { if (!keyA.isDown) player.setMovement(0); }; 

    keySpace.press = () => player.jump(); 
    
    // --- Mouse Input: Cần theo dõi vị trí chuột và truyền vào Player.update ---
    // Khởi tạo một đối tượng Point để lưu vị trí chuột toàn cục
    let mouseGlobalPos = new Point(0, 0);

    // Lắng nghe sự kiện di chuột trên toàn bộ ứng dụng PixiJS (V8)
    app.renderer.events.pointer.global.on('pointermove', (e) => {
        mouseGlobalPos = e.global;
    });

    // --- Game Loop ---
    app.ticker.add((ticker) => {
        // Cập nhật logic nhân vật (rơi, di chuyển, va chạm)
        // Truyền vị trí chuột toàn cục vào Player.update
        player.update(ticker, GROUND_Y_POSITION, mouseGlobalPos);
        
        // Vẽ lại đường màu đỏ liên tục để khớp với GROUND_Y_POSITION
        if (debugGroundLine) {
            debugGroundLine.clear();
            debugGroundLine.rect(0, GROUND_Y_POSITION, app.screen.width, 2).fill(0xFF0000);
        }
    });

    console.log("Game Started! Use A, D, Space and move mouse to rotate the gun.");
})();