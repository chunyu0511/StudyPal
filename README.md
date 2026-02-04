
# 🎓 学伴 (StudyPal)

> **让知识自由流动** —— 专为大学生打造的现代化学习资料分享平台。

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-19.0-61DAFB.svg?logo=react&logoColor=white)
![Node](https://img.shields.io/badge/Node.js-18%2B-339933.svg?logo=node.js&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-Better--SQLite3-003B57.svg?logo=sqlite&logoColor=white)

---

**学伴 (StudyPal)** 是一个全栈开发的资料分享社区。它不仅拥有流畅的前台交互体验，更配备了**商业级标准的管理后台**。项目采用 React 19 + Express + SQLite 架构，追求极致的性能与开发体验。

## ✨ 核心特性

### 🌟 用户端 (Client)
用户的学习资源中心，体验丝滑流畅。

- 🔍 **精准检索**：支持标题/描述模糊搜索，可按**分类**（试卷/笔记）、**类型**及**热度/评分**排序。
- 📤 **便捷上传**：支持 PDF、Office 文档及 MP4 视频直传，自动识别文件类型。
- � **社区互动**：完整的**评论**、**评分**系统，支持资料**收藏**与下载计数。
- 🎨 **现代 UI**：基于 Glassmorphism（毛玻璃）风格设计，响应式布局适配。

### 🛡️ 管理后台 (Admin Portal)
独立且强大的管理系统，掌控全局。

- 📊 **数据可视化**：集成 **Recharts**，实时展示近 7 天用户增长、资料上传与下载趋势图。
- 👥 **用户审计**：查看用户列表，支持一键**封禁/解封**违规账号（实时生效）。
- ⚙️ **系统配置**：动态控制网站名称、**开放注册开关**及维护模式，无需重启服务器。
- 📝 **安全操作**：所有敏感操作（如强制删除资料）均有日志记录（模拟）。

## �️ 技术栈

| 模块 | 技术选型 | 说明 |
| :--- | :--- | :--- |
| **Frontend** | **React 19** + Vite | 最新版 React，配合 Vite 实现秒级热更新 |
| | React Router v6 | 实现前台与后台 (`/admin/*`) 的路由分离 |
| | **Recharts** | 专业级数据图表库 |
| | Axios | 统一封装的 HTTP 请求客户端 |
| **Backend** | **Node.js** + Express | 经典的 RESTful API 架构 |
| | **Better-SQLite3** | 高性能本地数据库，无需配置各类 Server |
| | JWT + bcrypt | 工业级标准的身份验证与密码加密方案 |
| | Multer | 处理多格式文件上传 |

## 🚀 快速开始

只需三步，即可在本地运行完整的项目。

### 1. 克隆项目
```bash
git clone https://github.com/yourusername/studypal.git
cd studypal
```

### 2. 启动后端 (Server)
后端运行在 `http://localhost:3000`。首次运行会自动创建 SQLite 数据库文件并初始化表结构。

```bash
cd server
npm install
npm run dev
# 默认管理员账号将在控制台提示创建，或使用 initAdmin 脚本
```

### 3. 启动前端 (Client)
前端运行在 `http://localhost:5173`。

```bash
cd client
npm install
npm run dev
```

现在访问 `http://localhost:5173` 即可体验！

## � 目录结构

```
root/
├── client/                 # React 前端
│   ├── src/
│   │   ├── layouts/        # 布局 (AdminLayout, MainLayout)
│   │   ├── pages/          # 页面组件
│   │   │   ├── admin/      # 后台页面 (Overview, Users...)
│   │   │   └── ...         # 前台页面 (Home, Materials...)
│   │   ├── components/     # 通用组件
│   │   └── utils/          # 工具函数 (api.js 封装)
│
├── server/                 # Express 后端
│   ├── models/             # 数据库层 (database.js)
│   ├── routes/             # API 路由
│   ├── middleware/         # 鉴权中间件
│   └── uploads/            # 物理文件存储区
```

##  待办计划 (Roadmap)

- [ ] 集成 Nodemailer 实现邮件通知与找回密码
- [ ] 个人中心增强：头像上传与编辑
- [ ] 首页增加“热门推荐”动态流

---

Made with ❤️ by StudyPal Team
