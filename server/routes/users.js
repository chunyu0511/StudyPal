import express from 'express';
import bcrypt from 'bcryptjs';
import { prepare } from '../models/database.js';
import { generateToken, authenticateToken } from '../middleware/auth.js';

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

        const newUser = prepare('SELECT id, username, email, created_at FROM users WHERE id = ?').get(result.lastInsertRowid);

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
        const user = prepare('SELECT id, username, email, avatar, bio, created_at FROM users WHERE id = ?').get(req.user.id);

        if (!user) {
            return res.status(404).json({ error: '用户不存在' });
        }

        res.json({ user });
    } catch (error) {
        console.error('获取用户信息错误:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// 更新用户信息
router.put('/profile', authenticateToken, (req, res) => {
    try {
        const { bio, avatar } = req.body;

        prepare('UPDATE users SET bio = ?, avatar = ? WHERE id = ?').run(bio || null, avatar || null, req.user.id);

        const updatedUser = prepare('SELECT id, username, email, avatar, bio, created_at FROM users WHERE id = ?').get(req.user.id);

        res.json({
            message: '个人信息更新成功',
            user: updatedUser
        });
    } catch (error) {
        console.error('更新用户信息错误:', error);
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

export default router;

