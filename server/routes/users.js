import express from 'express';
import bcrypt from 'bcryptjs';
import { prepare } from '../models/database.js';
import { generateToken, authenticateToken, optionalAuth } from '../middleware/auth.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// 用户注册
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // 验证输入
        if (!username || !email || !password) {
            return res.status(400).json({ error: '所有字段都是必填的' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: '密码长度至少为6个字符' });
        }

        // 检查用户是否已存在
        const existingUser = prepare('SELECT * FROM users WHERE username = ? OR email = ?').get(username, email);
        if (existingUser) {
            return res.status(400).json({ error: '用户名或邮箱已被使用' });
        }

        // 加密密码
        const hashedPassword = await bcrypt.hash(password, 10);

        // 插入新用户
        const result = prepare(
            'INSERT INTO users (username, email, password) VALUES (?, ?, ?)'
        ).run(username, email, hashedPassword);

        const newUser = prepare('SELECT id, username, email, created_at, role FROM users WHERE id = ?').get(result.lastInsertRowid);

        console.log('Register Debug:', {
            insertResult: result,
            fetchedUser: newUser
        });

        if (!newUser) {
            throw new Error(`User creation verification failed. InsertID: ${result.lastInsertRowid}`);
        }

        // 生成token
        const token = generateToken(newUser);

        res.status(201).json({
            message: '注册成功',
            user: newUser,
            token
        });
    } catch (error) {
        console.error('注册错误:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// 用户登录
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: '用户名和密码都是必填的' });
        }

        // 查找用户
        const user = prepare('SELECT * FROM users WHERE username = ? OR email = ?').get(username, username);

        if (!user) {
            return res.status(401).json({ error: '用户名或密码错误' });
        }

        // 检查是否被封禁
        if (user.is_banned) {
            return res.status(403).json({ error: '该账号已被封禁，请联系管理员' });
        }

        // 验证密码
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: '用户名或密码错误' });
        }

        // 生成token
        const token = generateToken(user);

        // 返回用户信息（不包含密码）
        const { password: _, ...userWithoutPassword } = user;

        res.json({
            message: '登录成功',
            user: userWithoutPassword,
            token
        });
    } catch (error) {
        console.error('登录错误:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// 获取当前用户信息
router.get('/me', authenticateToken, (req, res) => {
    try {
        const user = prepare('SELECT id, username, email, avatar, bio, xp, level, role, created_at FROM users WHERE id = ?').get(req.user.id);

        if (!user) {
            return res.status(404).json({ error: '用户不存在' });
        }

        res.json({ user });
    } catch (error) {
        console.error('获取用户信息错误:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// 配置头像上传
const avatarStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = 'uploads/avatars';
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const uploadAvatar = multer({
    storage: avatarStorage,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('只能上传图片文件'));
        }
    }
});

// 上传头像
router.post('/avatar', authenticateToken, uploadAvatar.single('avatar'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: '请选择要上传的头像' });
        }

        const avatarUrl = `/uploads/avatars/${req.file.filename}`;

        // 更新数据库
        prepare('UPDATE users SET avatar = ? WHERE id = ?').run(avatarUrl, req.user.id);

        res.json({
            message: '头像上传成功',
            avatar: avatarUrl
        });
    } catch (error) {
        console.error('上传头像错误:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// 更新用户信息
router.put('/profile', authenticateToken, (req, res) => {
    try {
        const { bio, avatar } = req.body;
        const currentUserId = req.user.id;

        // 使用 COALESCE 保持原有值，如果传入为 undefined
        prepare('UPDATE users SET bio = COALESCE(?, bio), avatar = COALESCE(?, avatar) WHERE id = ?')
            .run(bio !== undefined ? bio : null, avatar !== undefined ? avatar : null, currentUserId);

        const updatedUser = prepare('SELECT id, username, email, avatar, bio, xp, level, role, created_at FROM users WHERE id = ?').get(currentUserId);

        res.json({
            message: '个人信息更新成功',
            user: updatedUser
        });
    } catch (error) {
        console.error('更新用户信息错误:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// 获取排行榜
router.get('/leaderboard', (req, res) => {
    try {
        const topUsers = prepare(`
            SELECT u.id, u.username, u.avatar, u.xp, u.level,
                   (SELECT COUNT(*) FROM materials WHERE user_id = u.id) as upload_count
            FROM users u
            ORDER BY u.xp DESC, upload_count DESC
            LIMIT 10
        `).all();

        res.json(topUsers);
    } catch (error) {
        console.error('获取排行榜错误:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// 获取用户统计信息
router.get('/stats', authenticateToken, (req, res) => {
    try {
        const uploadCount = prepare('SELECT COUNT(*) as count FROM materials WHERE user_id = ?').get(req.user.id).count;
        const favoriteCount = prepare('SELECT COUNT(*) as count FROM favorites WHERE user_id = ?').get(req.user.id).count;
        const downloadCount = prepare('SELECT COUNT(*) as count FROM downloads WHERE user_id = ?').get(req.user.id).count;

        res.json({
            uploadCount,
            favoriteCount,
            downloadCount
        });
    } catch (error) {
        console.error('获取统计信息错误:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// 获取用户徽章 (包含自动检查逻辑)
router.get('/:id/badges', async (req, res) => {
    try {
        const userId = req.params.id;

        // 1. 定义检查规则
        const checks = [
            {
                code: 'first_upload',
                check: () => prepare('SELECT COUNT(*) as count FROM materials WHERE user_id = ?').get(userId).count >= 1
            },
            {
                code: 'active_contributor',
                check: () => prepare('SELECT COUNT(*) as count FROM materials WHERE user_id = ?').get(userId).count >= 5
            },
            {
                code: 'commentator',
                check: () => prepare('SELECT COUNT(*) as count FROM comments WHERE user_id = ?').get(userId).count >= 10
            },
            {
                code: 'popular_author', // 获得的总收藏数 >= 50 (测试时可以设低点比如 5)
                check: () => {
                    const count = prepare(`
                        SELECT COUNT(*) as count 
                        FROM favorites f
                        JOIN materials m ON f.material_id = m.id
                        WHERE m.user_id = ?
                   `).get(userId).count;
                    return count >= 50;
                }
            }
        ];

        // 2. 执行检查并颁发新徽章
        // 注意：这里是只读操作中混入了写操作，对于高并发可能有性能影响，但对于MVP是可以接受的
        for (const rule of checks) {
            try {
                if (rule.check()) {
                    const badge = prepare('SELECT id FROM badges WHERE code = ?').get(rule.code);
                    if (badge) {
                        prepare('INSERT OR IGNORE INTO user_badges (user_id, badge_id) VALUES (?, ?)').run(userId, badge.id);
                    }
                }
            } catch (e) {
                console.warn(`Badge check failed for ${rule.code}:`, e);
            }
        }

        // 3. 返回所有徽章（带稀有度计算）
        const totalUsers = prepare('SELECT COUNT(*) as count FROM users').get().count || 1;

        const badges = prepare(`
            SELECT b.*, ub.earned_at,
                   (SELECT COUNT(*) FROM user_badges WHERE badge_id = b.id) as holders_count
            FROM badges b
            JOIN user_badges ub ON b.id = ub.badge_id
            WHERE ub.user_id = ?
            ORDER BY ub.earned_at DESC
        `).all(userId);

        const badgesWithRarity = badges.map(b => ({
            ...b,
            rarity: Math.max(1, Math.round((b.holders_count / totalUsers) * 100))
        }));

        res.json(badgesWithRarity);
    } catch (error) {
        console.error('获取徽章失败:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// 关注用户
router.post('/follow/:id', authenticateToken, (req, res) => {
    try {
        const targetId = req.params.id;
        const followerId = req.user.id;

        if (targetId == followerId) {
            return res.status(400).json({ error: '不能关注自己' });
        }

        prepare('INSERT OR IGNORE INTO follows (follower_id, following_id) VALUES (?, ?)').run(followerId, targetId);
        res.json({ message: '关注成功' });
    } catch (error) {
        console.error('关注错误:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// 取消关注
router.delete('/unfollow/:id', authenticateToken, (req, res) => {
    try {
        const targetId = req.params.id;
        const followerId = req.user.id;

        prepare('DELETE FROM follows WHERE follower_id = ? AND following_id = ?').run(followerId, targetId);
        res.json({ message: '已取消关注' });
    } catch (error) {
        console.error('取消关注错误:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// 获取关注状态和统计
router.get('/:id/follow-status', optionalAuth, (req, res) => {
    try {
        const targetId = req.params.id;
        const currentUserId = req.user?.id;

        const followersCount = prepare('SELECT COUNT(*) as count FROM follows WHERE following_id = ?').get(targetId).count;
        const followingCount = prepare('SELECT COUNT(*) as count FROM follows WHERE follower_id = ?').get(targetId).count;

        let isFollowing = false;
        if (currentUserId) {
            const follow = prepare('SELECT 1 FROM follows WHERE follower_id = ? AND following_id = ?').get(currentUserId, targetId);
            isFollowing = !!follow;
        }

        res.json({ followersCount, followingCount, isFollowing });
    } catch (error) {
        console.error('获取关注状态失败:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// 获取粉丝列表
router.get('/:id/followers', (req, res) => {
    try {
        const targetId = req.params.id;
        const followers = prepare(`
            SELECT u.id, u.username, u.avatar, u.level, u.bio
            FROM follows f
            JOIN users u ON f.follower_id = u.id
            WHERE f.following_id = ?
        `).all(targetId);
        res.json(followers);
    } catch (error) {
        res.status(500).json({ error: '获取粉丝列表失败' });
    }
});

// 获取关注列表
router.get('/:id/following', (req, res) => {
    try {
        const targetId = req.params.id;
        const following = prepare(`
            SELECT u.id, u.username, u.avatar, u.level, u.bio
            FROM follows f
            JOIN users u ON f.following_id = u.id
            WHERE f.follower_id = ?
        `).all(targetId);
        res.json(following);
    } catch (error) {
        res.status(500).json({ error: '获取关注列表失败' });
    }
});

// 获取公共资料信息
router.get('/:id/profile', optionalAuth, (req, res) => {
    try {
        const targetId = req.params.id;
        const user = prepare('SELECT id, username, avatar, bio, xp, level, created_at FROM users WHERE id = ?').get(targetId);

        if (!user) {
            return res.status(404).json({ error: '用户不存在' });
        }

        res.json(user);
    } catch (error) {
        console.error('获取用户信息失败:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

export default router;

