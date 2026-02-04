
import express from 'express';
import { authenticateToken, isAdmin } from '../middleware/auth.js';
import { prepare } from '../models/database.js';

const router = express.Router();

// 所有路由都需要管理员权限
router.use(authenticateToken, isAdmin);

// 获取仪表盘统计数据
router.get('/stats', (req, res) => {
    try {
        // 1. 基础统计
        const summary = {
            totalUsers: prepare('SELECT COUNT(*) as count FROM users').get().count,
            totalMaterials: prepare('SELECT COUNT(*) as count FROM materials').get().count,
            totalDownloads: prepare('SELECT COUNT(*) as count FROM downloads').get().count,
            totalComments: prepare('SELECT COUNT(*) as count FROM comments').get().count,
        };

        // 2. 趋势统计 (近7天)
        // 辅助函数：生成过去7天的日期数组
        const getDates = () => {
            const dates = [];
            for (let i = 6; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                dates.push(d.toISOString().split('T')[0]);
            }
            return dates;
        };
        const last7Days = getDates();

        // 辅助查询：按日期分组统计
        const getTrend = (table) => {
            const rows = prepare(`
                SELECT date(created_at) as date, COUNT(*) as count 
                FROM ${table} 
                WHERE created_at >= date('now', '-7 days')
                GROUP BY date(created_at)
            `).all();

            // 填充缺失的日期为 0
            const map = {};
            rows.forEach(r => map[r.date] = r.count);
            return last7Days.map(date => ({
                date,
                count: map[date] || 0
            }));
        };

        const userTrend = getTrend('users');
        const materialTrend = getTrend('materials');
        const downloadTrend = getTrend('downloads');

        // 合并数据
        const chartData = last7Days.map((date, i) => ({
            name: date.slice(5), // 只显示 MM-DD
            users: userTrend[i].count,
            materials: materialTrend[i].count,
            downloads: downloadTrend[i].count
        }));

        res.json({ summary, chartData });
    } catch (error) {
        console.error('获取统计数据失败:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// 获取用户列表
router.get('/users', (req, res) => {
    try {
        const users = prepare('SELECT id, username, email, role, is_banned, created_at FROM users ORDER BY created_at DESC').all();
        res.json(users);
    } catch (error) {
        console.error('获取用户列表失败:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// 封禁/解封用户
router.post('/users/:id/ban', (req, res) => {
    try {
        const userId = req.params.id;
        // 不能封禁自己
        if (parseInt(userId) === req.user.id) {
            return res.status(400).json({ error: '不能封禁自己' });
        }

        const user = prepare('SELECT is_banned FROM users WHERE id = ?').get(userId);
        if (!user) return res.status(404).json({ error: '用户不存在' });

        const newStatus = user.is_banned ? 0 : 1;
        prepare('UPDATE users SET is_banned = ? WHERE id = ?').run(newStatus, userId);

        res.json({
            message: newStatus ? '用户已封禁' : '用户已解封',
            is_banned: newStatus
        });
    } catch (error) {
        console.error('操作用户失败:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// 获取系统设置
router.get('/settings', (req, res) => {
    try {
        const rows = prepare('SELECT * FROM settings').all();
        const settings = {};
        rows.forEach(row => {
            // 类型转换
            if (row.value === 'true') settings[row.key] = true;
            else if (row.value === 'false') settings[row.key] = false;
            else if (!isNaN(row.value) && row.key !== 'site_name') settings[row.key] = Number(row.value);
            else settings[row.key] = row.value;
        });
        res.json(settings);
    } catch (error) {
        console.error('获取设置失败:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// 更新系统设置
router.post('/settings', (req, res) => {
    try {
        const updates = req.body;
        const stmt = prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');

        console.log('更新设置:', updates);

        Object.entries(updates).forEach(([key, value]) => {
            stmt.run(key, String(value));
        });

        res.json({ message: '设置已保存' });
    } catch (error) {
        console.error('保存设置失败:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// 获取所有资料列表
router.get('/materials', (req, res) => {
    try {
        const materials = prepare(`
            SELECT m.*, u.username as uploader_username 
            FROM materials m 
            JOIN users u ON m.user_id = u.id 
            ORDER BY m.created_at DESC
        `).all();
        res.json(materials);
    } catch (error) {
        console.error('获取资料列表失败:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// 删除资料 (强制删除)
router.delete('/materials/:id', (req, res) => {
    try {
        // 先删除相关文件（可选：增加物理删除逻辑）
        const material = prepare('SELECT * FROM materials WHERE id = ?').get(req.params.id);
        if (material) {
            prepare('DELETE FROM materials WHERE id = ?').run(req.params.id);
        }
        res.json({ message: '删除成功' });
    } catch (error) {
        console.error('删除资料失败:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

export default router;
