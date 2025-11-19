import { Container, Assets, Sprite } from 'pixi.js'; 
import BgUrl from '../UI/Assets/MainBackGround.png'; 

let app;
export const Screens = {
    SCREEN1: null, 
    SCREEN2: null,
    OVERLAY: null // THÊM CONTAINER OVERLAY
};

let backgrounds = [];
let bgTexture; 

// Hàm tạo Sprite background
const createBackgroundSprite = (texture, x) => {
    if (!texture) return;
    const bg = new Sprite(texture);
    bg.anchor.set(0, 0); 
    bg.zIndex = -1;
    bg.x = x;
    bg.y = 0;
    return bg;
};

export async function initSceneManager(pixiApp) {
    app = pixiApp;

    Screens.SCREEN1 = new Container({ name: 'SCREEN1' }); 
    Screens.SCREEN2 = new Container({ name: 'SCREEN2' }); 
    Screens.OVERLAY = new Container({ name: 'OVERLAY' }); // KHỞI TẠO OVERLAY

    app.stage.addChild(Screens.SCREEN1);
    app.stage.addChild(Screens.SCREEN2);
    app.stage.addChild(Screens.OVERLAY); // THÊM OVERLAY LÊN TRÊN CÙNG
    
    Screens.SCREEN1.position.set(0, 0);
    Screens.SCREEN2.position.set(0, 0);
    Screens.OVERLAY.position.set(0, 0);

    // Ẩn tất cả các screen khác trừ Screen 1
    Screens.SCREEN2.visible = false;
    Screens.OVERLAY.visible = false; // OVERLAY ẩn mặc định

    // --- XỬ LÝ BACKGROUND ---
    try {
        bgTexture = await Assets.load(BgUrl);
        
        // --- KHỞI TẠO BACKGROUND CHO TẤT CẢ CÁC SCREEN ---
        const bg1 = createBackgroundSprite(bgTexture, 0);
        Screens.SCREEN1.addChild(bg1);
        backgrounds.push(bg1);
        
        const bg2 = createBackgroundSprite(bgTexture, 0);
        Screens.SCREEN2.addChild(bg2);
        backgrounds.push(bg2); 


        // Hàm resize background
        const resizeBackground = () => {
            const screenHeight = app.screen.height;
            const screenWidth = app.screen.width;
            
            const bgWidth = bgTexture.width;
            const bgHeight = bgTexture.height;
            const scale = Math.max(screenWidth / bgWidth, screenHeight / bgHeight);

            backgrounds.forEach(bg => {
                bg.scale.set(scale);
                bg.width = bgWidth * scale;
                bg.height = bgHeight * scale;
                bg.y = 0; 
            });
            
            // THAY ĐỔI: Đảm bảo Overlay luôn lấp đầy màn hình
            Screens.OVERLAY.children.forEach(child => {
                // Resize các phần tử bên trong Overlay nếu cần
                // Ví dụ: Đặt lại vị trí của text và nút ở giữa màn hình
                child.x = app.screen.width / 2;
                child.y = app.screen.height / 2;
            });
        };
        
        const handleResize = () => {
            app.renderer.resize(window.innerWidth, window.innerHeight);
            resizeBackground();
            window.dispatchEvent(new Event('resize')); 
        };

        resizeBackground();
        window.addEventListener('resize', handleResize);
        document.addEventListener('fullscreenchange', handleResize);
        document.addEventListener('webkitfullscreenchange', handleResize);
        document.addEventListener('mozfullscreenchange', handleResize);
        document.addEventListener('msfullscreenchange', handleResize);

    } catch (e) {
        console.error("Không thể tải background:", e);
    }
}

/**
 * Chuyển đổi giữa các màn hình
 */
export function gotoScreen(targetScreen) {
    Screens.SCREEN1.visible = false;
    Screens.SCREEN2.visible = false;
    Screens.OVERLAY.visible = false;
    
    targetScreen.visible = true;
}

export { backgrounds, createBackgroundSprite };