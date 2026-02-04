
import bcrypt from 'bcryptjs';
import { initDatabase, prepare } from '../models/database.js';

async function initAdmin() {
    await initDatabase();
    console.log('数据库已连接');

    // 检查 admins
    const user = prepare("SELECT * FROM users WHERE username = 'admin'").get();

    if (user) {
        console.log('管理员账号已存在，将更新权限为 admin');
        prepare("UPDATE users SET role = 'admin' WHERE username = 'admin'").run();
        console.log('权限更新成功');
    } else {
        console.log('创建默认管理员账号...');
        const hashedPassword = await bcrypt.hash('admin123', 10);
        prepare("INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)").run(
            'admin',
            'admin@studypal.com',
            hashedPassword,
            'admin'
        );
        console.log('管理员账号创建成功: admin / admin123');
    }
}

initAdmin().catch(console.error);
