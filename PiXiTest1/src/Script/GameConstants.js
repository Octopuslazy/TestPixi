// GameConstants.js

/**
 * Định nghĩa tất cả các hằng số và thông số cân bằng (balancing stats) của trò chơi.
 */
export const GameConstants = {
    // --- SÁT THƯƠNG (DAMAGE) ---
    PLAYER_BULLET_DAMAGE: 40,           
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
    PLAYER_BASE_HEALTH: 100,            
    PLAYER_CLIP_SIZE: 20,               
    
    // --- THÔNG SỐ KẺ THÙ (ENEMY STATS) ---
    ENEMY_SHOOTER_HEALTH: 100,
    ENEMY_EXPLODER_HEALTH: 300,
    ENEMY_CHARGER_HEALTH: 200,

    // Tốc độ di chuyển
    ENEMY_SHOOTER_SPEED: 1.5,
    ENEMY_CHARGER_SPEED: 4, 
    ENEMY_EXPLODER_SPEED: 1.5,

    // Phạm vi
    EXPLOSION_RADIUS: 200, 
    SHOOTER_MOVEMENT_RANGE: 300, 
};