import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { prepare } from '../models/database.js';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// 配置文件上传
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '..', 'uploads'));
    },
    filename: (req, file, cb) => {
        // 修复中文文件名乱码
        file.originalname = Buffer.from(file.originalname, 'latin1').toString('utf8');
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 100 * 1024 * 1024 }, // 100MB 限制
    fileFilter: (req, file, cb) => {
        const allowedTypes = /pdf|doc|docx|ppt|pptx|xls|xlsx|mp4|avi|mov|zip|rar/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('不支持的文件类型'));
        }
    }
});

// 上传资料
router.post('/upload', authenticateToken, upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: '没有上传文件' });
        }

        const { title, description, type, category } = req.body;

        if (!title || !type || !category) {
            // 删除已上传的文件
            fs.unlinkSync(req.file.path);
            return res.status(400).json({ error: '标题、类型和分类是必填的' });
        }

        const fileType = path.extname(req.file.originalname).substring(1);

        const result = prepare(`
      INSERT INTO materials (user_id, title, description, type, category, file_name, file_path, file_size, file_type)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
            req.user.id,
            title,
            description || null,
            type,
            category,
            req.file.originalname,
            req.file.filename,
            req.file.size,
            fileType
        );

        const material = prepare(`
      SELECT m.*, u.username as uploader_username 
      FROM materials m 
      JOIN users u ON m.user_id = u.id 
      WHERE m.id = ?
    `).get(result.lastInsertRowid);

        res.status(201).json({
            message: '文件上传成功',
            material
        });
    } catch (error) {
        console.error('上传错误:', error);
        if (req.file) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ error: '服务器错误' });
    }
});

// 获取资料列表（支持分页和筛选）
router.get('/', optionalAuth, (req, res) => {
    try {
        const { page = 1, limit = 12, type, category, search, sort = 'latest' } = req.query;
        const offset = (page - 1) * limit;

        let query = `
      SELECT m.*, u.username as uploader_username,
             CASE WHEN m.rating_count > 0 THEN CAST(m.rating_sum AS FLOAT) / m.rating_count ELSE 0 END as avg_rating
      FROM materials m
      JOIN users u ON m.user_id = u.id
      WHERE 1=1
    `;
        const params = [];

        if (type && type !== 'all') {
            query += ' AND m.type = ?';
            params.push(type);
        }

        if (category && category !== 'all') {
            query += ' AND m.category = ?';
            params.push(category);
        }

        if (search) {
            query += ' AND (m.title LIKE ? OR m.description LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }

        // 排序
        switch (sort) {
            case 'popular':
                query += ' ORDER BY m.download_count DESC';
                break;
            case 'rating':
                query += ' ORDER BY avg_rating DESC';
                break;
            case 'latest':
            default:
                query += ' ORDER BY m.created_at DESC';
                break;
        }

        query += ' LIMIT ? OFFSET ?';
        params.push(parseInt(limit), offset);

        const materials = prepare(query).all(...params);

        // 获取总数
        let countQuery = 'SELECT COUNT(*) as total FROM materials m WHERE 1=1';
        const countParams = [];

        if (type && type !== 'all') {
            countQuery += ' AND m.type = ?';
            countParams.push(type);
        }

        if (category && category !== 'all') {
            countQuery += ' AND m.category = ?';
            countParams.push(category);
        }

        if (search) {
            countQuery += ' AND (m.title LIKE ? OR m.description LIKE ?)';
            countParams.push(`%${search}%`, `%${search}%`);
        }

        const { total } = prepare(countQuery).get(...countParams);

        res.json({
            materials,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('获取资料列表错误:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// 获取单个资料详情
router.get('/:id', optionalAuth, (req, res) => {
    try {
        const material = prepare(`
      SELECT m.*, u.username as uploader_username, u.avatar as uploader_avatar,
             CASE WHEN m.rating_count > 0 THEN CAST(m.rating_sum AS FLOAT) / m.rating_count ELSE 0 END as avg_rating
      FROM materials m
      JOIN users u ON m.user_id = u.id
      WHERE m.id = ?
    `).get(req.params.id);

        if (!material) {
            return res.status(404).json({ error: '资料不存在' });
        }

        // 增加浏览次数
        prepare('UPDATE materials SET view_count = view_count + 1 WHERE id = ?').run(req.params.id);

        // 如果用户已登录，检查是否已收藏
        let isFavorited = false;
        let userRating = null;

        if (req.user) {
            const favorite = prepare('SELECT * FROM favorites WHERE user_id = ? AND material_id = ?').get(req.user.id, req.params.id);
            isFavorited = !!favorite;

            const rating = prepare('SELECT rating FROM ratings WHERE user_id = ? AND material_id = ?').get(req.user.id, req.params.id);
            userRating = rating ? rating.rating : null;
        }

        res.json({
            ...material,
            isFavorited,
            userRating
        });
    } catch (error) {
        console.error('获取资料详情错误:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// 下载资料
router.get('/:id/download', authenticateToken, (req, res) => {
    try {
        const material = prepare('SELECT * FROM materials WHERE id = ?').get(req.params.id);

        if (!material) {
            return res.status(404).json({ error: '资料不存在' });
        }

        // 检查是否已经下载过
        const existingDownload = prepare('SELECT id FROM downloads WHERE user_id = ? AND material_id = ?').get(req.user.id, req.params.id);

        if (!existingDownload) {
            // 记录下载历史
            prepare('INSERT INTO downloads (user_id, material_id) VALUES (?, ?)').run(req.user.id, req.params.id);

            // 增加下载次数
            prepare('UPDATE materials SET download_count = download_count + 1 WHERE id = ?').run(req.params.id);
        } else {
            // 更新最后下载时间（可选）
            // prepare('UPDATE downloads SET created_at = CURRENT_TIMESTAMP WHERE id = ?').run(existingDownload.id);
        }

        const filePath = path.join(__dirname, '..', 'uploads', material.file_path);
        res.download(filePath, material.file_name);
    } catch (error) {
        console.error('下载错误:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// 删除资料
router.delete('/:id', authenticateToken, (req, res) => {
    try {
        const material = prepare('SELECT * FROM materials WHERE id = ?').get(req.params.id);

        if (!material) {
            return res.status(404).json({ error: '资料不存在' });
        }

        // 检查权限
        if (material.user_id !== req.user.id) {
            return res.status(403).json({ error: '无权删除此资料' });
        }

        // 删除文件
        const filePath = path.join(__dirname, '..', 'uploads', material.file_path);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        // 删除数据库记录
        prepare('DELETE FROM materials WHERE id = ?').run(req.params.id);

        res.json({ message: '资料删除成功' });
    } catch (error) {
        console.error('删除错误:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

export default router;

