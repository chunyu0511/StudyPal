import { prepare } from '../models/database.js';

/**
 * 更新用户经验值并检查升级
 * @param {number} userId 
 * @param {number} amount 
 */
export const addXP = (userId, amount) => {
    try {
        // 1. 获取当前 XP 和等级
        const user = prepare('SELECT xp, level FROM users WHERE id = ?').get(userId);
        if (!user) return;

        let newXP = (user.xp || 0) + amount;
        let newLevel = user.level || 1;

        // 简化的升级公式：Level = floor(sqrt(XP / 100)) + 1
        // 或者：Lvl 1: 0, Lvl 2: 200, Lvl 3: 500, Lvl 4: 1000...
        const nextLevelXP = newLevel * newLevel * 100;

        if (newXP >= nextLevelXP) {
            newLevel += 1;
            // 可以在这里触发称号解锁等逻辑
        }

        // 2. 更新数据库
        prepare('UPDATE users SET xp = ?, level = ? WHERE id = ?').run(newXP, newLevel, userId);

        return { xp: newXP, level: newLevel, leveledUp: newLevel > user.level };
    } catch (error) {
        console.error('XP 更新失败:', error);
    }
};
