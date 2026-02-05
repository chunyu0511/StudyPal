import express from 'express';
import { prepare } from '../models/database.js';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';
import { addXP } from '../utils/xp.js';

import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// 配置 Multer 用于帖子图片
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads/posts';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('只允许上传图片'));
        }
    }
});

// 获取所有帖子 (带点赞和评论数)
router.get('/posts', optionalAuth, (req, res) => {
    try {
        const userId = req.user?.id;
        const posts = prepare(`
            SELECT p.*, u.username, u.avatar, u.level,
                   (SELECT COUNT(*) FROM community_likes WHERE post_id = p.id) as like_count,
                   (SELECT COUNT(*) FROM community_comments WHERE post_id = p.id) as comment_count
            FROM community_posts p
            JOIN users u ON p.user_id = u.id
            ORDER BY p.created_at DESC
        `).all();

        const postsWithStatus = posts.map(post => {
            let isLiked = false;
            if (userId) {
                const like = prepare('SELECT 1 FROM community_likes WHERE user_id = ? AND post_id = ?').get(userId, post.id);
                isLiked = !!like;
            }
            return { ...post, isLiked };
        });

        res.json(postsWithStatus);
    } catch (error) {
        console.error('获取帖子失败:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// 发布新帖子
router.post('/posts', authenticateToken, (req, res) => {
    try {
        const { content, images } = req.body;
        if (!content || content.trim().length === 0) {
            return res.status(400).json({ error: '内容不能为空' });
        }

        // 1. 频率限制：检查用户最近一条帖子的时间
        const lastPost = prepare('SELECT created_at FROM community_posts WHERE user_id = ? ORDER BY created_at DESC LIMIT 1').get(req.user.id);
        if (lastPost) {
            const lastPostTime = new Date(lastPost.created_at).getTime();
            const now = Date.now();
            if (now - lastPostTime < 10000) { // 10秒
                return res.status(429).json({ error: '发帖太快了，请休息一下再试' });
            }
        }

        // 2. 防重复：检查最近5分钟内是否有内容相同的帖子
        const duplicatePost = prepare(`
            SELECT 1 FROM community_posts 
            WHERE user_id = ? AND content = ? 
            AND datetime(created_at) > datetime('now', '-5 minutes')
        `).get(req.user.id, content);

        if (duplicatePost) {
            return res.status(400).json({ error: '请勿重复发布相同内容' });
        }

        const result = prepare('INSERT INTO community_posts (user_id, content, images) VALUES (?, ?, ?)').run(
            req.user.id,
            content,
            images ? JSON.stringify(images) : null
        );

        const newPost = prepare(`
            SELECT p.*, u.username, u.avatar, u.level, 0 as like_count, 0 as comment_count
            FROM community_posts p
            JOIN users u ON p.user_id = u.id
            WHERE p.id = ?
        `).get(result.lastInsertRowid);

        // 奖励经验
        const xpUpdate = addXP(req.user.id, 20);

        res.status(201).json({
            ...newPost,
            currentUserXP: xpUpdate?.xp,
            currentUserLevel: xpUpdate?.level
        });
    } catch (error) {
        console.error('发布帖子失败:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// 点赞/取消点赞分享
router.post('/posts/:id/like', authenticateToken, (req, res) => {
    try {
        const postId = req.params.id;
        const userId = req.user.id;

        const existing = prepare('SELECT 1 FROM community_likes WHERE user_id = ? AND post_id = ?').get(userId, postId);

        if (existing) {
            prepare('DELETE FROM community_likes WHERE user_id = ? AND post_id = ?').run(userId, postId);
            res.json({ liked: false });
        } else {
            prepare('INSERT INTO community_likes (user_id, post_id) VALUES (?, ?)').run(userId, postId);
            res.json({ liked: true });
        }
    } catch (error) {
        console.error('点赞帖子失败:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// 获取帖子详情及评论
router.get('/posts/:id/comments', optionalAuth, (req, res) => {
    try {
        const postId = req.params.id;
        const comments = prepare(`
            SELECT c.*, u.username, u.avatar, u.level
            FROM community_comments c
            JOIN users u ON c.user_id = u.id
            WHERE c.post_id = ?
            ORDER BY c.created_at ASC
        `).all(postId);

        res.json(comments);
    } catch (error) {
        console.error('获取评论失败:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// 发布评论
router.post('/posts/:id/comments', authenticateToken, (req, res) => {
    try {
        const postId = req.params.id;
        const { content } = req.body;
        if (!content || content.trim().length === 0) {
            return res.status(400).json({ error: '评论内容不能为空' });
        }

        // 1. 频率限制
        const lastComment = prepare('SELECT created_at FROM community_comments WHERE user_id = ? ORDER BY created_at DESC LIMIT 1').get(req.user.id);
        if (lastComment) {
            const lastCommentTime = new Date(lastComment.created_at).getTime();
            const now = Date.now();
            if (now - lastCommentTime < 10000) {
                return res.status(429).json({ error: '评论太快了，请慢一点' });
            }
        }

        // 2. 防重复
        const duplicateComment = prepare(`
            SELECT 1 FROM community_comments 
            WHERE user_id = ? AND content = ? 
            AND datetime(created_at) > datetime('now', '-5 minutes')
        `).get(req.user.id, content);

        if (duplicateComment) {
            return res.status(400).json({ error: '请勿重复发表相同评论' });
        }

        const result = prepare('INSERT INTO community_comments (post_id, user_id, content) VALUES (?, ?, ?)').run(
            postId,
            req.user.id,
            content
        );

        const newComment = prepare(`
            SELECT c.*, u.username, u.avatar, u.level
            FROM community_comments c
            JOIN users u ON c.user_id = u.id
            WHERE c.id = ?
        `).get(result.lastInsertRowid);

        // 奖励经验
        const xpUpdate = addXP(req.user.id, 5);

        res.status(201).json({
            ...newComment,
            currentUserXP: xpUpdate?.xp,
            currentUserLevel: xpUpdate?.level
        });
    } catch (error) {
        console.error('发布评论失败:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// 获取关注者的动态
router.get('/feed', authenticateToken, (req, res) => {
    try {
        const posts = prepare(`
            SELECT p.*, u.username, u.avatar, u.level,
                   (SELECT COUNT(*) FROM community_likes WHERE post_id = p.id) as like_count,
                   (SELECT COUNT(*) FROM community_comments WHERE post_id = p.id) as comment_count,
                   1 as isFollowing
            FROM community_posts p
            JOIN users u ON p.user_id = u.id
            JOIN follows f ON p.user_id = f.following_id
            WHERE f.follower_id = ?
            ORDER BY p.created_at DESC
        `).all(req.user.id);

        res.json(posts);
    } catch (error) {
        console.error('获取动态失败:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// 上传帖子图片
router.post('/upload', authenticateToken, upload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: '没有上传文件' });
        }
        const imageUrl = `http://localhost:3000/uploads/posts/${req.file.filename}`;
        res.json({ url: imageUrl });
    } catch (error) {
        console.error('上传图片失败:', error);
        res.status(500).json({ error: '上传失败' });
    }
});

// 删除帖子
router.delete('/posts/:id', authenticateToken, (req, res) => {
    try {
        const postId = req.params.id;
        const userId = req.user.id;

        const post = prepare('SELECT user_id FROM community_posts WHERE id = ?').get(postId);
        if (!post) {
            return res.status(404).json({ error: '帖子不存在' });
        }

        if (post.user_id !== userId && req.user.role !== 'admin') {
            return res.status(403).json({ error: '没有权限删除此帖子' });
        }

        // 删除相关数据 (SQLite 外键设置了级联删除最好，否则手动删)
        prepare('DELETE FROM community_comments WHERE post_id = ?').run(postId);
        prepare('DELETE FROM community_likes WHERE post_id = ?').run(postId);
        prepare('DELETE FROM community_posts WHERE id = ?').run(postId);

        res.json({ success: true, message: '帖子已删除' });
    } catch (error) {
        console.error('删除帖子失败:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// 删除评论
router.delete('/comments/:id', authenticateToken, (req, res) => {
    try {
        const commentId = req.params.id;
        const userId = req.user.id;

        const comment = prepare('SELECT user_id FROM community_comments WHERE id = ?').get(commentId);
        if (!comment) {
            return res.status(404).json({ error: '评论不存在' });
        }

        if (comment.user_id !== userId && req.user.role !== 'admin') {
            return res.status(403).json({ error: '没有权限删除此评论' });
        }

        prepare('DELETE FROM community_comments WHERE id = ?').run(commentId);

        res.json({ success: true, message: '评论已删除' });
    } catch (error) {
        console.error('删除评论失败:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

export default router;
