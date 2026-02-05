import express from 'express';
import { prepare } from '../models/database.js';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';
import { addXP } from '../utils/xp.js';

const router = express.Router();

// ========== 收藏相关 ==========

// 添加收藏
router.post('/favorites/:materialId', authenticateToken, (req, res) => {
    try {
        const { materialId } = req.params;

        // 检查资料是否存在
        const material = prepare('SELECT * FROM materials WHERE id = ?').get(materialId);
        if (!material) {
            return res.status(404).json({ error: '资料不存在' });
        }

        // 检查是否已收藏
        const existing = prepare('SELECT * FROM favorites WHERE user_id = ? AND material_id = ?').get(req.user.id, materialId);
        if (existing) {
            return res.status(400).json({ error: '已经收藏过了' });
        }

        prepare('INSERT INTO favorites (user_id, material_id) VALUES (?, ?)').run(req.user.id, materialId);

        res.json({ message: '收藏成功' });
    } catch (error) {
        console.error('收藏错误:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// 取消收藏
router.delete('/favorites/:materialId', authenticateToken, (req, res) => {
    try {
        const { materialId } = req.params;

        prepare('DELETE FROM favorites WHERE user_id = ? AND material_id = ?').run(req.user.id, materialId);

        res.json({ message: '已取消收藏' });
    } catch (error) {
        console.error('取消收藏错误:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// 获取用户的收藏列表
router.get('/favorites', authenticateToken, (req, res) => {
    try {
        const favorites = prepare(`
      SELECT m.*, u.username as uploader_username, f.created_at as favorited_at,
             CASE WHEN m.rating_count > 0 THEN CAST(m.rating_sum AS FLOAT) / m.rating_count ELSE 0 END as avg_rating
      FROM favorites f
      JOIN materials m ON f.material_id = m.id
      JOIN users u ON m.user_id = u.id
      WHERE f.user_id = ?
      ORDER BY f.created_at DESC
    `).all(req.user.id);

        res.json({ favorites });
    } catch (error) {
        console.error('获取收藏列表错误:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// ========== 评分相关 ==========

// 添加或更新评分
router.post('/ratings/:materialId', authenticateToken, (req, res) => {
    try {
        const { materialId } = req.params;
        const { rating } = req.body;

        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ error: '评分必须在1-5之间' });
        }

        // 检查资料是否存在
        const material = prepare('SELECT * FROM materials WHERE id = ?').get(materialId);
        if (!material) {
            return res.status(404).json({ error: '资料不存在' });
        }

        // 检查是否已评分
        const existing = prepare('SELECT * FROM ratings WHERE user_id = ? AND material_id = ?').get(req.user.id, materialId);

        if (existing) {
            // 更新评分
            const oldRating = existing.rating;
            prepare('UPDATE ratings SET rating = ? WHERE user_id = ? AND material_id = ?').run(rating, req.user.id, materialId);

            // 更新材料的评分统计
            prepare('UPDATE materials SET rating_sum = rating_sum - ? + ? WHERE id = ?').run(oldRating, rating, materialId);
        } else {
            // 新增评分
            prepare('INSERT INTO ratings (user_id, material_id, rating) VALUES (?, ?, ?)').run(req.user.id, materialId, rating);

            // 更新材料的评分统计
            prepare('UPDATE materials SET rating_sum = rating_sum + ?, rating_count = rating_count + 1 WHERE id = ?').run(rating, materialId);

            // 增加经验值
            addXP(req.user.id, 10);
        }

        res.json({ message: '评分成功' });
    } catch (error) {
        console.error('评分错误:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// ========== 评论相关 ==========

// 添加评论
router.post('/comments/:materialId', authenticateToken, (req, res) => {
    try {
        const { materialId } = req.params;
        const { content } = req.body;

        if (!content || content.trim().length === 0) {
            return res.status(400).json({ error: '评论内容不能为空' });
        }

        // 检查资料是否存在
        const material = prepare('SELECT * FROM materials WHERE id = ?').get(materialId);
        if (!material) {
            return res.status(404).json({ error: '资料不存在' });
        }

        const result = prepare('INSERT INTO comments (user_id, material_id, content) VALUES (?, ?, ?)').run(req.user.id, materialId, content);

        const comment = prepare(`
      SELECT c.*, u.username, u.avatar
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.id = ?
    `).get(result.lastInsertRowid);

        // 增加经验值
        addXP(req.user.id, 5);

        res.status(201).json({
            message: '评论成功',
            comment
        });
    } catch (error) {
        console.error('评论错误:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// 获取资料的评论列表
router.get('/comments/:materialId', optionalAuth, (req, res) => {
    try {
        const { materialId } = req.params;
        const userId = req.user?.id; // 可选的用户ID

        const comments = prepare(`
      SELECT c.*, u.username, u.avatar
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.material_id = ?
      ORDER BY c.created_at DESC
    `).all(materialId);

        // 为每条评论添加点赞数和用户点赞状态
        const commentsWithLikes = comments.map(comment => {
            const likeCount = prepare('SELECT COUNT(*) as count FROM comment_likes WHERE comment_id = ?').get(comment.id).count;

            let isLiked = false;
            if (userId) {
                const like = prepare('SELECT id FROM comment_likes WHERE user_id = ? AND comment_id = ?').get(userId, comment.id);
                isLiked = !!like;
            }

            return {
                ...comment,
                likeCount,
                isLiked
            };
        });

        res.json({ comments: commentsWithLikes });
    } catch (error) {
        console.error('获取评论错误:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// 删除评论
router.delete('/comments/:commentId', authenticateToken, (req, res) => {
    try {
        const { commentId } = req.params;

        const comment = prepare('SELECT * FROM comments WHERE id = ?').get(commentId);
        if (!comment) {
            return res.status(404).json({ error: '评论不存在' });
        }

        // 检查权限
        if (comment.user_id !== req.user.id) {
            return res.status(403).json({ error: '无权删除此评论' });
        }

        prepare('DELETE FROM comments WHERE id = ?').run(commentId);

        res.json({ message: '评论已删除' });
    } catch (error) {
        console.error('删除评论错误:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// 点赞评论
router.post('/comments/:commentId/like', authenticateToken, (req, res) => {
    try {
        const { commentId } = req.params;

        // 检查评论是否存在
        const comment = prepare('SELECT * FROM comments WHERE id = ?').get(commentId);
        if (!comment) {
            return res.status(404).json({ error: '评论不存在' });
        }

        // 检查是否已点赞
        const existing = prepare('SELECT * FROM comment_likes WHERE user_id = ? AND comment_id = ?').get(req.user.id, commentId);
        if (existing) {
            return res.status(400).json({ error: '已经点赞过了' });
        }

        prepare('INSERT INTO comment_likes (user_id, comment_id) VALUES (?, ?)').run(req.user.id, commentId);

        // 获取点赞数
        const likeCount = prepare('SELECT COUNT(*) as count FROM comment_likes WHERE comment_id = ?').get(commentId).count;

        res.json({ message: '点赞成功', likeCount });
    } catch (error) {
        console.error('点赞评论错误:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// 取消点赞评论
router.delete('/comments/:commentId/like', authenticateToken, (req, res) => {
    try {
        const { commentId } = req.params;

        prepare('DELETE FROM comment_likes WHERE user_id = ? AND comment_id = ?').run(req.user.id, commentId);

        // 获取点赞数
        const likeCount = prepare('SELECT COUNT(*) as count FROM comment_likes WHERE comment_id = ?').get(commentId).count;

        res.json({ message: '已取消点赞', likeCount });
    } catch (error) {
        console.error('取消点赞错误:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// ========== 举报相关 ==========

// 提交举报
router.post('/reports', authenticateToken, (req, res) => {
    try {
        const { targetType, targetId, reason, description } = req.body; // targetType: 'material' or 'comment'

        if (!['material', 'comment'].includes(targetType)) {
            return res.status(400).json({ error: '无效的举报对象' });
        }

        if (!reason) {
            return res.status(400).json({ error: '请选择举报原因' });
        }

        // 验证目标是否存在
        let exists;
        if (targetType === 'material') {
            exists = prepare('SELECT id FROM materials WHERE id = ?').get(targetId);
        } else {
            exists = prepare('SELECT id FROM comments WHERE id = ?').get(targetId);
        }

        if (!exists) {
            return res.status(404).json({ error: '举报的内容不存在' });
        }

        // 插入举报记录
        prepare(`
            INSERT INTO reports (user_id, target_type, target_id, reason, description)
            VALUES (?, ?, ?, ?, ?)
        `).run(req.user.id, targetType, targetId, reason, description || '');

        res.status(201).json({ message: '举报提交成功，我们会尽快处理' });
    } catch (error) {
        console.error('提交举报错误:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// ========== 下载历史 ==========

// 获取用户的下载历史
router.get('/downloads', authenticateToken, (req, res) => {
    try {
        const downloads = prepare(`
      SELECT m.*, u.username as uploader_username, d.created_at as downloaded_at,
             CASE WHEN m.rating_count > 0 THEN CAST(m.rating_sum AS FLOAT) / m.rating_count ELSE 0 END as avg_rating
      FROM downloads d
      JOIN materials m ON d.material_id = m.id
      JOIN users u ON m.user_id = u.id
      WHERE d.user_id = ?
      ORDER BY d.created_at DESC
      LIMIT 50
    `).all(req.user.id);

        res.json({ downloads });
    } catch (error) {
        console.error('获取下载历史错误:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// 获取用户上传的资料
router.get('/uploads', authenticateToken, (req, res) => {
    try {
        const uploads = prepare(`
      SELECT m.*,
             CASE WHEN m.rating_count > 0 THEN CAST(m.rating_sum AS FLOAT) / m.rating_count ELSE 0 END as avg_rating
      FROM materials m
      WHERE m.user_id = ?
      ORDER BY m.created_at DESC
    `).all(req.user.id);

        res.json({ uploads });
    } catch (error) {
        console.error('获取上传记录错误:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// ========== 浏览历史 ==========

// 获取用户的浏览历史
router.get('/views', authenticateToken, (req, res) => {
    try {
        const views = prepare(`
      SELECT m.*, u.username as uploader_username, v.created_at as viewed_at,
             CASE WHEN m.rating_count > 0 THEN CAST(m.rating_sum AS FLOAT) / m.rating_count ELSE 0 END as avg_rating
      FROM views v
      JOIN materials m ON v.material_id = m.id
      JOIN users u ON m.user_id = u.id
      WHERE v.user_id = ?
      GROUP BY m.id
      ORDER BY v.created_at DESC
      LIMIT 50
    `).all(req.user.id);

        res.json({ views });
    } catch (error) {
        console.error('获取浏览历史错误:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

export default router;

