<div align="center">
  <h1>🎓 学伴 StudyPal</h1>
  <p><strong>让知识自由流动 · 打造现代化的校园知识共享社区</strong></p>

  <p>
    <a href="#-特性概览">特性</a> •
    <a href="#-快速开始">快速开始</a> •
    <a href="#-技术栈">技术栈</a> •
    <a href="#-待办计划">Roadmap</a>
  </p>
  
  <p>
    <img src="https://img.shields.io/badge/React-19.0-61DAFB?style=flat-square&logo=react&logoColor=white" alt="React">
    <img src="https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js&logoColor=white" alt="Node">
    <img src="https://img.shields.io/badge/SQLite-Fast-003B57?style=flat-square&logo=sqlite&logoColor=white" alt="SQLite">
    <img src="https://img.shields.io/badge/license-MIT-blue?style=flat-square" alt="License">
  </p>
</div>

---

**StudyPal** 是一个全栈开发的现代化资料分享平台。它完美融合了**资源检索**、**社区互动**与**游戏化激励**机制，旨在解决高校内部信息差，让优质的学习资料触手可及。

## ✨ 特性概览

### 📂 资料中心 (Materials Hub)
- **极速检索**：支持标题/描述模糊搜索，多维度（分类、热度）智能排序。
- **全格式预览**：内置 PDF、Office 文档及视频流媒体预览引擎，所见即所得。
- **个人知识库**：集成收藏夹、浏览历史与下载记录，管理你的学习轨迹。

### 💬 社区与悬赏 (Community & Bounty)
- **Discussion V2**：深度整合的讨论广场，支持富文本、图片直传与多级评论互动。
- **悬赏大厅**：独有的 **XP 悬赏机制**。遇到难题？发布悬赏，重金求助，支持退款保障与回答追问。
- **关注流**：订阅学霸动态，构建属于你的学术社交圈。

### 🎮 游戏化激励 (Gamification)
- **XP 经济系统**：上传资料、解答悬赏均可赚取 XP。
- **荣誉体系**：实时更新的 **全站先锋榜** 与成就徽章系统 (Badges)，让贡献被看见。
- **等级特权**：升级解锁更多社区权限与专属标识。

### 🛡️ 商业级后台 (Admin Portal)
- **数据可视化**：集成 Recharts 的动态仪表盘，实时监控用户增长与内容趋势。
- **内容审计**：高效的用户封禁与内容举报处理流程，维护社区健康。

## 🛠 技术栈

| 领域 | 核心技术 | 亮点 |
| :--- | :--- | :--- |
| **Frontend** | **React 19** + Vite | 极致的性能与秒级热更新体验 |
| | React Router v6 | 现代化的 SPA 路由管理 |
| | CSS Variables | 原生 CSS 变量实现的一键换肤基础 |
| **Backend** | **Node.js** + Express | 稳健的 RESTful API 架构 |
| | **better-sqlite3** | 高性能无依赖的本地数据库方案 |
| | JWT + Multer | 标准化的鉴权与文件流处理 |

## 🚀 快速开始

只需三步，本地启动完整环境。

### 1. 克隆项目
```bash
git clone https://github.com/yourusername/studypal.git
cd studypal
```

### 2. 启动服务

**后端 (Server)** - *Port 3000*
```bash
cd server
npm install
npm run dev
```

**前端 (Client)** - *Port 5173*
```bash
# 新开一个终端窗口
cd client
npm install
npm run dev
```

访问 `http://localhost:5173` 即可开始体验。

## 📅 待办计划 (Roadmap)

- [x] **Core**: 等级、XP、徽章游戏化系统
- [x] **Social**: 社区动态、悬赏大厅 V2 (多图/标签/退款)
- [x] **Home**: 首页社交简报与热门推荐
- [ ] **Notification**: 实时消息中心 (Socket.io)
- [ ] **AI**: 基于 LLM 的资料摘要与智能问答助手
- [ ] **Collections**: 用户自定义资料合集

---

<div align="center">
  <p>Made with ❤️ by StudyPal Team</p>
</div>
