import { Assets, Texture, Rectangle } from 'pixi.js';

// 1. IMPORT HÌNH ẢNH
// Phải import để Vite/Bundler xử lý đường dẫn chính xác
import playerIdleUrl from '../Sprites/Idle.png'; 
import playerRunUrl from '../Sprites/Run.png'; 
import gunUrl from '../Sprites/Gun.png'; 
import bulletUrl from '../Sprites/PlayerBullet.png'; 

// THÊM: Import Assets Kẻ thù
import enemyShooterUrl from '../Sprites/EnemyShooter.png'; 
import enemyExploderUrl from '../Sprites/EnemyExploder.png'; 
import enemyChargerUrl from '../Sprites/EnemyCharger.png'; 

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
        'Shooter_run': { // Shooter Enemy (cần 5 frames)
            url: enemyShooterUrl,
            frameWidth: 32,
            frameHeight: 32,
            frameCount: 6,
        },
        'Exploder_run': { // Exploder Enemy (cần 4 frames)
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
    
    // 3. TẢI TẤT CẢ (AWAIT)
    try {
        console.log("[AssetLoader] Bắt đầu tải files (AWAIT)...");
        const loadedAssets = await Assets.load(assetAliases);
        console.log("[AssetLoader] Tải files thành công. Bắt đầu trích xuất frames.");
        
        // 4. XỬ LÝ TEXTURE RIÊNG
        frameData['GunTexture'] = loadedAssets['GunTexture'];
        frameData['BulletTexture'] = loadedAssets['BulletTexture'];
        
        // 5. TRÍCH XUẤT FRAMES CHUNG
        for (const characterName in ANIMATION_MANIFEST) {
            for (const animationName in ANIMATION_MANIFEST[characterName]) {
                const config = ANIMATION_MANIFEST[characterName][animationName];
                const alias = `${characterName}_${animationName}`;
                
                // PixiJS V8: Lấy source từ texture đã tải
                const baseTextureSource = loadedAssets[alias].source;
                const frames = [];
                
                for (let i = 0; i < config.frameCount; i++) {
                    const rect = new Rectangle(
                        i * config.frameWidth, 
                        0, 
                        config.frameWidth, 
                        config.frameHeight
                    );
                    
                    frames.push(new Texture({ source: baseTextureSource, frame: rect }));
                }
                
                // LƯU Ý: Nếu là kẻ thù, ta lưu vào frameData['Enemy']['Shooter_run']
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