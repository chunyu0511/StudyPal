import express from 'express';
import { prepare } from '../models/database.js';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';
import { addXP } from '../utils/xp.js';

const router = express.Router();

// 获取所有悬赏
router.get('/', optionalAuth, (req, res) => {
    try {
        const bounties = prepare(`
            SELECT b.*, u.username, u.avatar, u.level,
                   (SELECT COUNT(*) FROM bounty_answers WHERE bounty_id = b.id) as answer_count
            FROM bounties b
            JOIN users u ON b.user_id = u.id
            ORDER BY b.status = 'open' DESC, b.created_at DESC
        `).all();

        res.json(bounties);
    } catch (error) {
        console.error('获取悬赏列表错误:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// 获取单个悬赏详情及回答
router.get('/:id', optionalAuth, (req, res) => {
    try {
        const bountyId = req.params.id;
        const bounty = prepare(`
            SELECT b.*, u.username, u.avatar, u.level
            FROM bounties b
            JOIN users u ON b.user_id = u.id
            WHERE b.id = ?
        `).get(bountyId);

        if (!bounty) {
            return res.status(404).json({ error: '悬赏不存在' });
        }

        const answers = prepare(`
            SELECT a.*, u.username, u.avatar, u.level
            FROM bounty_answers a
            JOIN users u ON a.user_id = u.id
            WHERE a.bounty_id = ?
            ORDER BY a.is_accepted DESC, a.created_at ASC
        `).all(bountyId);

        res.json({ bounty, answers });
    } catch (error) {
        console.error('获取悬赏详情错误:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// 发布悬赏
router.post('/', authenticateToken, (req, res) => {
    try {
        const { title, description, reward_xp } = req.body;
        const userId = req.user.id;

        if (!title || !description || !reward_xp) {
            return res.status(400).json({ error: '请填写完整信息' });
        }

        const { images, tags } = req.body;

        if (reward_xp <= 0) {
            return res.status(400).json({ error: '悬赏XP必须大于0' });
        }

        // 检查用户XP是否足够
        const user = prepare('SELECT xp FROM users WHERE id = ?').get(userId);
        if (user.xp < reward_xp) {
            return res.status(400).json({ error: '你的XP不足以支付此悬赏' });
        }

        // 扣除用户XP
        prepare('UPDATE users SET xp = xp - ? WHERE id = ?').run(reward_xp, userId);

        // 创建悬赏
        const result = prepare(`
            INSERT INTO bounties (user_id, title, description, reward_xp, images, tags)
            VALUES (?, ?, ?, ?, ?, ?)
        `).run(userId, title, description, reward_xp, images ? JSON.stringify(images) : null, tags ? JSON.stringify(tags) : null);

        const newBounty = prepare('SELECT * FROM bounties WHERE id = ?').get(result.lastInsertRowid);

        res.status(201).json({
            message: '悬赏发布成功',
            bounty: newBounty,
            remainingXP: user.xp - reward_xp
        });
    } catch (error) {
        console.error('发布悬赏错误:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// 提交回答
router.post('/:id/answer', authenticateToken, (req, res) => {
    try {
        const bountyId = req.params.id;
        const { content, images } = req.body;
        const userId = req.user.id;

        if (!content) {
            return res.status(400).json({ error: '回答内容不能为空' });
        }

        const bounty = prepare('SELECT * FROM bounties WHERE id = ?').get(bountyId);
        if (!bounty) {
            return res.status(404).json({ error: '悬赏不存在' });
        }

        if (bounty.status !== 'open') {
            return res.status(400).json({ error: '此悬赏已结束' });
        }

        // 插入回答
        const result = prepare(`
            INSERT INTO bounty_answers (bounty_id, user_id, content, images)
            VALUES (?, ?, ?, ?)
        `).run(bountyId, userId, content, images ? JSON.stringify(images) : null);

        const newAnswer = prepare(`
            SELECT a.*, u.username, u.avatar, u.level
            FROM bounty_answers a
            JOIN users u ON a.user_id = u.id
            WHERE a.id = ?
        `).get(result.lastInsertRowid);

        // 少量奖励回答者XP (鼓励回答)
        addXP(userId, 2);

        res.status(201).json(newAnswer);
    } catch (error) {
        console.error('提交回答错误:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// 采纳回答
router.post('/:id/accept/:answerId', authenticateToken, (req, res) => {
    try {
        const { id: bountyId, answerId } = req.params;
        const userId = req.user.id;

        const bounty = prepare('SELECT * FROM bounties WHERE id = ?').get(bountyId);
        if (!bounty) {
            return res.status(404).json({ error: '悬赏不存在' });
        }

        if (bounty.user_id !== userId) {
            return res.status(403).json({ error: '只有悬赏发布者可以采纳回答' });
        }

        if (bounty.status !== 'open') {
            return res.status(400).json({ error: '此悬赏已结束' });
        }

        const answer = prepare('SELECT * FROM bounty_answers WHERE id = ?').get(answerId);
        if (!answer) {
            return res.status(404).json({ error: '回答不存在' });
        }

        // 开始事务
        // 1. 标记悬赏为已解决
        prepare('UPDATE bounties SET status = ?, solved_by = ? WHERE id = ?')
            .run('solved', answer.user_id, bountyId);

        // 2. 标记回答为已采纳
        prepare('UPDATE bounty_answers SET is_accepted = 1 WHERE id = ?')
            .run(answerId);

        // 3. 将悬赏XP转给回答者 (额外增加一点作为系统奖励)
        addXP(answer.user_id, bounty.reward_xp);

        res.json({ message: '已采纳回答，悬赏结束' });
    } catch (error) {
        console.error('采纳回答错误:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// 撤销悬赏 (退款)
router.delete('/:id', authenticateToken, (req, res) => {
    try {
        const bountyId = req.params.id;
        const userId = req.user.id;

        const bounty = prepare('SELECT * FROM bounties WHERE id = ?').get(bountyId);
        if (!bounty) {
            return res.status(404).json({ error: '悬赏不存在' });
        }

        if (bounty.user_id !== userId && req.user.role !== 'admin') {
            return res.status(403).json({ error: '只有发布者可以撤销悬赏' });
        }

        if (bounty.status !== 'open') {
            return res.status(400).json({ error: '只能撤销进行中的悬赏' });
        }

        // 检查是否有已采纳的回答 (如果有，实际上状态应该是solved，但双重检查无害)
        if (bounty.solved_by) {
            return res.status(400).json({ error: '已解决的悬赏无法撤销' });
        }

        // 退还 XP
        prepare('UPDATE users SET xp = xp + ? WHERE id = ?').run(bounty.reward_xp, bounty.user_id);

        // 删除悬赏 (级联删除回答和评论)
        // 注意：如果不想物理删除，可以设为 closed，但用户要求“撤销”通常意味着删除或取消。
        // 这里我们选择物理删除，因为是彻底撤销。
        // 首先删除相关回答的评论 (如果没有级联)
        // prepare('DELETE FROM bounty_answer_comments WHERE answer_id IN (SELECT id FROM bounty_answers WHERE bounty_id = ?)').run(bountyId);
        // prepare('DELETE FROM bounty_answers WHERE bounty_id = ?').run(bountyId);
        prepare('DELETE FROM bounties WHERE id = ?').run(bountyId);

        res.json({ message: '悬赏已撤销，XP已退还' });
    } catch (error) {
        console.error('撤销悬赏错误:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// 获取回答的评论
router.get('/answers/:id/comments', optionalAuth, (req, res) => {
    try {
        const answerId = req.params.id;
        const comments = prepare(`
            SELECT c.*, u.username, u.avatar
            FROM bounty_answer_comments c
            JOIN users u ON c.user_id = u.id
            WHERE c.answer_id = ?
            ORDER BY c.created_at ASC
        `).all(answerId);
        res.json(comments);
    } catch (error) {
        console.error('获取评论错误:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// 对回答进行评论
router.post('/answers/:id/comments', authenticateToken, (req, res) => {
    try {
        const answerId = req.params.id;
        const { content } = req.body;
        const userId = req.user.id;

        if (!content) return res.status(400).json({ error: '内容不能为空' });

        const result = prepare(`
            INSERT INTO bounty_answer_comments (answer_id, user_id, content)
            VALUES (?, ?, ?)
        `).run(answerId, userId, content);

        const newComment = prepare(`
            SELECT c.*, u.username, u.avatar
            FROM bounty_answer_comments c
            JOIN users u ON c.user_id = u.id
            WHERE c.id = ?
        `).get(result.lastInsertRowid);

        res.status(201).json(newComment);
    } catch (error) {
        console.error('评论回答错误:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

export default router;
