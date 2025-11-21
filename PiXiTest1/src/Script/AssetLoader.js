import { Assets, Texture, Rectangle } from 'pixi.js';

// 1. IMPORT HÌNH ẢNH
// Phải import để Vite/Bundler xử lý đường dẫn chính xác
import playerIdleUrl from '../Sprites/Idle.png'; 
import playerRunUrl from '../Sprites/Run.png'; 
import gunUrl from '../Sprites/Gun.png'; 
import bulletUrl from '../Sprites/PlayerBullet.png'; 
import bossBulletSUrl from '../Sprites/BossBulletS.png';

// THÊM: Import Assets Kẻ thù
import enemyShooterUrl from '../Sprites/EnemyShooter.png'; 
import enemyExploderUrl from '../Sprites/EnemyExploder.png'; 
import enemyChargerUrl from '../Sprites/EnemyCharger.png'; 
import explosionUrl from '../Sprites/Explosion.png';
import bossUrl from '../Sprites/Boss.png';
import bloodyUrl from '../Sprites/Bloody.png';

// Định nghĩa cấu trúc dữ liệu cho hoạt ảnh
const ANIMATION_MANIFEST = {
    // --- PLAYER ---
    'Player': {
        'run': {
            url: playerRunUrl,
            frameWidth: 32,
            frameHeight: 32,
            frameCount: 5,
        },
        'idle': {
            url: playerIdleUrl,
            frameWidth: 32,
            frameHeight: 32,
            frameCount: 4,
        },
    },
    
    // --- KẺ THÙ (CHUNG CHO CÁC LỚP ENEMY) ---
    'Enemy': { // Sử dụng tên chung 'Enemy' cho EnemyManager dễ tham chiếu
        'Shooter_run': { // Shooter Enemy (cần 6 frames)
            url: enemyShooterUrl,
            frameWidth: 32,
            frameHeight: 32,
            frameCount: 6,
        },
        'Exploder_run': { // Exploder Enemy (cần 6 frames)
            url: enemyExploderUrl,
            frameWidth: 32,
            frameHeight: 32,
            frameCount: 6,
        },
        'Charger_run': { // Charger Enemy (cần 6 frames)
            url: enemyChargerUrl,
            frameWidth: 32,
            frameHeight: 32,
            frameCount: 6,
        },
        'Boss_run': {
            url: bossUrl,
            frameWidth: 96,
            frameHeight: 96,
            frameCount: 6,
        },
    },
     'effects':{
        'Explosion_frames':{
            url: explosionUrl,
            frameWidth:32,
            frameHeight:32,
            frameCount:6,
        }
     ,
        'Bloody_frames':{
            url: bloodyUrl,
            frameWidth:96,
            frameHeight:48,
            frameCount:12,
        }
     }
};

/**
 * Tải tất cả các asset và cắt frames.
 */
export async function loadAllGameAssets() {
    const assetAliases = [];
    const frameData = {};
    
    console.log("[AssetLoader] Bắt đầu đăng ký Assets...");
    
    // 1. ĐĂNG KÝ ASSETS NHÂN VẬT VÀ KẺ THÙ
    for (const characterName in ANIMATION_MANIFEST) {
        frameData[characterName] = {};
        for (const animationName in ANIMATION_MANIFEST[characterName]) {
            const config = ANIMATION_MANIFEST[characterName][animationName];
            const alias = `${characterName}_${animationName}`;
            
            Assets.add({ alias: alias, src: config.url });
            assetAliases.push(alias);
        }
    }
    
    // 2. ĐĂNG KÝ ASSET SÚNG VÀ ĐẠN
    Assets.add({ alias: 'GunTexture', src: gunUrl });
    assetAliases.push('GunTexture');
    Assets.add({ alias: 'BulletTexture', src: bulletUrl });
    assetAliases.push('BulletTexture');
    // Boss / enemy bullet sprite (shared for boss and enemy bullets)
    Assets.add({ alias: 'BossBulletTexture', src: bossBulletSUrl });
    assetAliases.push('BossBulletTexture');
    
    // 3. TẢI TẤT CẢ (AWAIT)
    try {
        console.log("[AssetLoader] Bắt đầu tải files (AWAIT)...");
        const loadedAssets = await Assets.load(assetAliases);
        console.log("[AssetLoader] Tải files thành công. Bắt đầu trích xuất frames.");
        
        // 4. XỬ LÝ TEXTURE RIÊNG
        frameData['GunTexture'] = loadedAssets['GunTexture'];
        frameData['BulletTexture'] = loadedAssets['BulletTexture'];
        frameData['BossBulletTexture'] = loadedAssets['BossBulletTexture'];
        
        // 5. TRÍCH XUẤT FRAMES CHUNG
        for (const characterName in ANIMATION_MANIFEST) {
            for (const animationName in ANIMATION_MANIFEST[characterName]) {
                const config = ANIMATION_MANIFEST[characterName][animationName];
                const alias = `${characterName}_${animationName}`;
                
                // PixiJS V8: Lấy SourceTexture trực tiếp từ loaded asset
                const baseTextureSource = loadedAssets[alias].source; 

                const frames = [];
                for (let i = 0; i < config.frameCount; i++) {
                    // TÍNH TOÁN VÙNG CẮT (RECTANGLE)
                    const rect = new Rectangle(
                        i * config.frameWidth, // Tọa độ X bắt đầu
                        0,                     // Tọa độ Y luôn là 0 (Giả định spritesheet là 1 hàng)
                        config.frameWidth,     // Chiều rộng frame
                        config.frameHeight     // Chiều cao frame
                    );
                    
                    // TẠO TEXTURE MỚI TỪ SOURCE VÀ VÙNG CẮT
                    frames.push(new Texture({ source: baseTextureSource, frame: rect }));
                }
                
                if (characterName === 'Enemy') {
                    frameData[characterName][animationName] = frames;
                } else {
                    frameData[characterName][animationName] = frames;
                }
            }
        }
        
        return frameData;

    } catch (error) {
        console.error("LỖI LỚN KHI TẢI ASSETS:", error); 
        throw error;
    }
}