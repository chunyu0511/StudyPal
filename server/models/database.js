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

        // 获取最后插入的ID (Move before saveDatabase and stmt.free just to be safe)
        const result = db.exec("SELECT last_insert_rowid() as id");
        const lastId = result[0]?.values[0]?.[0] || 0;

        stmt.free();

        saveDatabase();

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

  // 尝试添加 avatar, bio, is_banned 字段到 users 表
  try {
    const tableInfo = db.exec("PRAGMA table_info(users)")[0].values;
    if (!tableInfo.some(col => col[1] === 'avatar')) {
      db.run("ALTER TABLE users ADD COLUMN avatar TEXT");
    }
    if (!tableInfo.some(col => col[1] === 'bio')) {
      db.run("ALTER TABLE users ADD COLUMN bio TEXT");
    }
    if (!tableInfo.some(col => col[1] === 'is_banned')) {
      db.run("ALTER TABLE users ADD COLUMN is_banned INTEGER DEFAULT 0");
    }
  } catch (error) {
    console.warn('检查/添加 users 字段时出错:', error);
  }

  // 尝试添加 xp 和 level 字段到 users 表
  try {
    const tableInfo = db.exec("PRAGMA table_info(users)")[0].values;
    if (!tableInfo.some(col => col[1] === 'xp')) {
      db.run("ALTER TABLE users ADD COLUMN xp INTEGER DEFAULT 0");
      console.log('用户表已升级: 添加 xp 字段');
    }
    if (!tableInfo.some(col => col[1] === 'level')) {
      db.run("ALTER TABLE users ADD COLUMN level INTEGER DEFAULT 1");
      console.log('用户表已升级: 添加 level 字段');
    }
  } catch (error) {
    console.warn('升级 users 表 (xp/level) 时出错:', error);
  }

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
      tags TEXT DEFAULT '[]', -- JSON 数组格式存储标签
      search_text TEXT, -- 聚合搜索文本（含拼音）
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

  // 资料表迁移：添加 tags, search_text, rating, view_count
  try {
    const materialInfo = db.exec("PRAGMA table_info(materials)")[0].values;
    if (!materialInfo.some(col => col[1] === 'tags')) {
      db.run("ALTER TABLE materials ADD COLUMN tags TEXT DEFAULT '[]'");
    }
    if (!materialInfo.some(col => col[1] === 'search_text')) {
      db.run("ALTER TABLE materials ADD COLUMN search_text TEXT");
    }
    if (!materialInfo.some(col => col[1] === 'view_count')) {
      db.run("ALTER TABLE materials ADD COLUMN view_count INTEGER DEFAULT 0");
    }
    if (!materialInfo.some(col => col[1] === 'rating_sum')) {
      db.run("ALTER TABLE materials ADD COLUMN rating_sum INTEGER DEFAULT 0");
    }
    if (!materialInfo.some(col => col[1] === 'rating_count')) {
      db.run("ALTER TABLE materials ADD COLUMN rating_count INTEGER DEFAULT 0");
    }
  } catch (error) {
    console.warn('升级 materials 表时出错:', error);
  }


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

  // 浏览历史表
  db.run(`
    CREATE TABLE IF NOT EXISTS views (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      material_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE CASCADE
    )
  `);

  // 评论点赞表
  db.run(`
    CREATE TABLE IF NOT EXISTS comment_likes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      comment_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE,
      UNIQUE(user_id, comment_id)
    )
  `);

  // 举报表
  db.run(`
    CREATE TABLE IF NOT EXISTS reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      target_type TEXT NOT NULL, -- 'material' or 'comment'
      target_id INTEGER NOT NULL,
      reason TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'pending', -- 'pending', 'resolved', 'dismissed'
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // 徽章定义表
  db.run(`
    CREATE TABLE IF NOT EXISTS badges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL, -- 如 'first_upload', 'contributor_level_1'
      name TEXT NOT NULL,
      description TEXT,
      icon TEXT NOT NULL, -- emoji 或 图片URL
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 用户徽章关联表
  db.run(`
    CREATE TABLE IF NOT EXISTS user_badges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      badge_id INTEGER NOT NULL,
      earned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (badge_id) REFERENCES badges(id) ON DELETE CASCADE,
      UNIQUE(user_id, badge_id)
    )
  `);

  // 初始化一些默认徽章
  const badgeCount = db.exec("SELECT COUNT(*) as count FROM badges")[0].values[0][0];
  if (badgeCount === 0) {
    const insertBadge = db.prepare("INSERT INTO badges (code, name, description, icon) VALUES (?, ?, ?, ?)");
    insertBadge.run(['pioneer', '先锋成员', '早期注册用户', '🚀']);
    insertBadge.run(['first_upload', '初次贡献', '上传了第一个资料', '🌱']);
    insertBadge.run(['active_contributor', '活跃贡献者', '上传了5个以上资料', '🔥']);
    insertBadge.run(['popular_author', '人气作者', '获得超过50个赞', '⭐']);
    insertBadge.run(['commentator', '热心评论', '发表了10条评论', '💬']);
    console.log('✅ 初始化默认徽章完成');
  }

  // 关注系统
  db.run(`
    CREATE TABLE IF NOT EXISTS follows (
      follower_id INTEGER NOT NULL,
      following_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (follower_id, following_id),
      FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // 社区帖子
  db.run(`
    CREATE TABLE IF NOT EXISTS community_posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      images TEXT, -- 存储 JSON 数组字符串
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // 帖子点赞
  db.run(`
    CREATE TABLE IF NOT EXISTS community_likes (
      user_id INTEGER NOT NULL,
      post_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, post_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (post_id) REFERENCES community_posts(id) ON DELETE CASCADE
    )
  `);

  // 帖子评论
  db.run(`
    CREATE TABLE IF NOT EXISTS community_comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (post_id) REFERENCES community_posts(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // 悬赏求助表
  db.run(`
    CREATE TABLE IF NOT EXISTS bounties (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      reward_xp INTEGER NOT NULL,
      status TEXT DEFAULT 'open', -- 'open', 'solved', 'closed'
      solved_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      images TEXT, -- JSON string of image URLs
      tags TEXT, -- JSON string of tags
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (solved_by) REFERENCES users(id) ON DELETE SET NULL
    )
  `);

  try {
    db.run(`ALTER TABLE bounties ADD COLUMN images TEXT`);
  } catch (e) { /* ignore if exists */ }
  try {
    db.run(`ALTER TABLE bounties ADD COLUMN tags TEXT`);
  } catch (e) { /* ignore if exists */ }

  // 悬赏回答表
  db.run(`
    CREATE TABLE IF NOT EXISTS bounty_answers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bounty_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      images TEXT, -- JSON string of image URLs
      is_accepted INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (bounty_id) REFERENCES bounties(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  try {
    db.run(`ALTER TABLE bounty_answers ADD COLUMN images TEXT`);
  } catch (e) { /* ignore if exists */ }

  db.run(`
    CREATE TABLE IF NOT EXISTS bounty_answer_comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      answer_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (answer_id) REFERENCES bounty_answers(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  saveDatabase();
  console.log('✅ 数据库表初始化完成');
}

export default { prepare };
