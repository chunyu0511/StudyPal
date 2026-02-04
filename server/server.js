import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDatabase } from './models/database.js';
import usersRouter from './routes/users.js';
import materialsRouter from './routes/materials.js';
import interactionsRouter from './routes/interactions.js';
import adminRouter from './routes/admin.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件服务 - 让uploads目录可访问
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 初始化数据库并启动服务器
async function startServer() {
    await initDatabase();

    // 路由
    app.use('/api/users', usersRouter);
    app.use('/api/materials', materialsRouter);
    app.use('/api/interactions', interactionsRouter);
    app.use('/api/admin', adminRouter);

    // 健康检查
    app.get('/api/health', (req, res) => {
        res.json({ status: 'ok', message: '学习资料分享平台API正常运行' });
    });

    // 错误处理中间件
    app.use((err, req, res, next) => {
        console.error('服务器错误:', err);
        res.status(500).json({ error: err.message || '服务器内部错误' });
    });

    // 404处理
    app.use((req, res) => {
        res.status(404).json({ error: '未找到请求的资源' });
    });

    // 启动服务器
    app.listen(PORT, () => {
        console.log(`
╔════════════════════════════════════════════════════════╗
║                                                        ║
║   🎓 学习资料分享平台 - 后端服务                      ║
║                                                        ║
║   服务器运行在: http://localhost:${PORT}                   ║
║   API文档: http://localhost:${PORT}/api/health           ║
║                                                        ║
║   准备就绪！开始为大学生提供优质学习资料服务 ✨        ║
║                                                        ║
╚════════════════════════════════════════════════════════╝
  `);
    });
}

// 启动服务器
startServer().catch(err => {
    console.error('启动服务器失败:', err);
    process.exit(1);
});
