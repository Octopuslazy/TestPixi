// GameConstants.js

/**
 * Định nghĩa tất cả các hằng số và thông số cân bằng (balancing stats) của trò chơi.
 */
export const GameConstants = {
    // --- SÁT THƯƠNG (DAMAGE) ---
    PLAYER_BULLET_DAMAGE: 50,           
    ENEMY_BULLET_DAMAGE: 10,            
    ENEMY_COLLISION_DAMAGE: 20,         
    EXPLOSION_DAMAGE: 80,              
    ELECTRIC_DAMAGE: 20,                

    // --- THỜI GIAN/COOLDOWN ---
    ENEMY_COLLISION_COOLDOWN_MS: 1000,  
    PLAYER_RELOAD_TIME_MS: 2000,        
    ENEMY_SHOOT_DELAY_MS: 1000,         
    CHARGER_STUN_TIME_MS: 1000,         // THÊM: Thời gian choáng của Charger sau khi chạm (1 giây)

    // --- THÔNG SỐ NGƯỜI CHƠI (PLAYER STATS) ---
    PLAYER_BASE_HEALTH: 500,            
    PLAYER_CLIP_SIZE: 30,               
    
    // --- THÔNG SỐ KẺ THÙ (ENEMY STATS) ---
    ENEMY_SHOOTER_HEALTH: 100,
    ENEMY_EXPLODER_HEALTH: 300,
    ENEMY_CHARGER_HEALTH: 200,

    // Tốc độ di chuyển
    ENEMY_SHOOTER_SPEED: 1.5,
    ENEMY_CHARGER_SPEED: 4, 
    ENEMY_EXPLODER_SPEED: 1.5,

    // Phạm vi
    EXPLOSION_RADIUS: 64, 
    SHOOTER_MOVEMENT_RANGE: 300, 
    // BOSS HẰNG SỐ MỚI
    BOSS_HEALTH: 5000,
    BOSS_DAMAGE: 20, // Boss Bullet Damage (Gấp đôi đạn thường)
    BOSS_TELEPORT_COOLDOWN: 10000, // 5 giây
    BOSS_ATTACK_COOLDOWN: 3000, // 2 giây giữa các đợt tấn công
    
    // Tên Screen
    SCREEN_IDS: {
        LOADING: 'LOADING',
        START: 'START',
        SCREEN1: 'SCREEN1',
        SCREEN2: 'SCREEN2',
        SCREEN3: 'SCREEN3', // SCREEN MỚI: BOSS
        GAMEOVER: 'GAMEOVER',
    },
    
    // Tên Assets
    ASSET_KEYS: {
        PLAYER_RUN: 'Player_run',
        PLAYER_IDLE: 'Player_idle',
        PLAYER_JUMP: 'Player_jump',
        ENEMY_SHOOTER_RUN: 'Shooter_run',
        ENEMY_EXPLODER_RUN: 'Exploder_run',
        ENEMY_CHARGER_RUN: 'Charger_run',
        BOSS_RUN: 'Boss_run', // ASSET BOSS MỚI
        BULLET: 'Bullet',
        BOSS_BULLET: 'BossBullet', // ASSET BOSS BULLET MỚI
        TRACKING_BULLET: 'TrackingBullet', // ASSET TRACKING BULLET MỚI
        BG_TEXTURE: 'Background',
        EXPLOSION: 'Explosion',
    },
    
    // Trọng lực và Mặt đất
    GRAVITY: 0,
    FLOOR_HEIGHT_RATIO: 0.85, // Mặt đất ở 85% chiều cao màn hình
    // Player gun / bullet tuning
    PLAYER_GUN_ORBIT_RADIUS: 22,
    PLAYER_GUN_ROTATION_OFFSET: 0, // radians; set to Math.PI if art faces backwards
    PLAYER_BULLET_SCALE: 2,
};
