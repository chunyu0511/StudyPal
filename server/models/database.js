import initSqlJs from 'sql.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, '..', 'studyshare.db');

let SQL;
let db;

// 初始化SQL.js
async function initializeSQL() {
  if (!SQL) {
    SQL = await initSqlJs();
  }

  // 检查数据库文件是否存在
  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  return db;
}

// 保存数据库到文件
export function saveDatabase() {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  }
}

// 准备语句（模拟better-sqlite3的API）
export function prepare(sql) {
  return {
    run: (...params) => {
      try {
        // 使用参数化查询
        const stmt = db.prepare(sql);
        stmt.bind(params);
        stmt.step();
        stmt.free();

        saveDatabase();

        // 获取最后插入的ID
        const result = db.exec("SELECT last_insert_rowid() as id");
        const lastId = result[0]?.values[0]?.[0] || 0;

        return {
          changes: 1,
          lastInsertRowid: lastId
        };
      } catch (error) {
        console.error('SQL执行错误:', error);
        throw error;
      }
    },
    get: (...params) => {
      try {
        const stmt = db.prepare(sql);
        stmt.bind(params);

        if (stmt.step()) {
          const columns = stmt.getColumnNames();
          const values = stmt.get();
          stmt.free();

          const row = {};
          columns.forEach((col, index) => {
            row[col] = values[index];
          });

          return row;
        }

        stmt.free();
        return null;
      } catch (error) {
        console.error('SQL执行错误:', error);
        throw error;
      }
    },
    all: (...params) => {
      try {
        const stmt = db.prepare(sql);
        stmt.bind(params);

        const rows = [];
        const columns = stmt.getColumnNames();

        while (stmt.step()) {
          const values = stmt.get();
          const row = {};
          columns.forEach((col, index) => {
            row[col] = values[index];
          });
          rows.push(row);
        }

        stmt.free();
        return rows;
      } catch (error) {
        console.error('SQL执行错误:', error);
        throw error;
      }
    }
  };
}

// 初始化数据库表
export async function initDatabase() {
  await initializeSQL();

  // 启用外键支持
  db.run('PRAGMA foreign_keys = ON');

  // 用户表
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      avatar TEXT,
      bio TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 尝试添加 role 字段（如果不存在）
  try {
    const tableInfo = db.exec("PRAGMA table_info(users)")[0].values;
    const hasRole = tableInfo.some(col => col[1] === 'role');
    if (!hasRole) {
      db.run("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'");
      console.log('已添加 role 字段到 users 表');
    }
  } catch (error) {
    console.warn('检查/添加 role 字段时出错 (如果是新表可忽略):', error);
  }

  // 检查是否需要更新 admin 角色
  const adminUser = db.prepare("SELECT role FROM users WHERE username = 'admin'").get();
  if (adminUser && adminUser.role !== 'admin') {
    db.prepare("UPDATE users SET role = 'admin' WHERE username = 'admin'").run();
  }

  // 尝试添加 is_banned 字段到 users 表
  try {
    db.prepare("ALTER TABLE users ADD COLUMN is_banned INTEGER DEFAULT 0").run();
    console.log('用户表已升级: 添加 is_banned 字段');
  } catch (error) { }

  // settings 表 (系统设置)
  db.run(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    )
  `);

  // 初始化默认设置
  const insertSetting = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
  const defaultSettings = [
    { key: 'site_name', value: '学伴 - 学习资料分享平台' },
    { key: 'allow_registration', value: 'true' }, // 'true' or 'false'
    { key: 'maintenance_mode', value: 'false' },
    { key: 'max_upload_size', value: '100' } // MB
  ];
  defaultSettings.forEach(s => insertSetting.run(s.key, s.value));

  // 资料表

  // 资料表
  db.run(`
    CREATE TABLE IF NOT EXISTS materials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      type TEXT NOT NULL,
      category TEXT NOT NULL,
      file_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      file_type TEXT NOT NULL,
      download_count INTEGER DEFAULT 0,
      view_count INTEGER DEFAULT 0,
      rating_sum INTEGER DEFAULT 0,
      rating_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // 收藏表
  db.run(`
    CREATE TABLE IF NOT EXISTS favorites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      material_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE CASCADE,
      UNIQUE(user_id, material_id)
    )
  `);

  // 评分表
  db.run(`
    CREATE TABLE IF NOT EXISTS ratings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      material_id INTEGER NOT NULL,
      rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE CASCADE,
      UNIQUE(user_id, material_id)
    )
  `);

  // 评论表
  db.run(`
    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      material_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE CASCADE
    )
  `);

  // 下载历史表
  db.run(`
    CREATE TABLE IF NOT EXISTS downloads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      material_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE CASCADE
    )
  `);

  saveDatabase();
  console.log('✅ 数据库表初始化完成');
}

export default { prepare };
