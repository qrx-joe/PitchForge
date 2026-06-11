# PitchForge | 百炼路演工坊

> 把粗糙 idea，快速打磨成可路演项目表达。

一个基于阿里云百炼的 AI 路演包生成器，专为黑客松和 AI Workshop 场景设计。
用户输入项目想法，系统自动生成 4 个核心输出：**项目结构**、**1 分钟路演稿**、**Demo 展示流程**、**评委问答**。

> ⚠️ **当前状态**: MVP 前端已就绪（HTML/CSS），后端 API 与 `frontend/js/app.js` 待补。当前 commit 只推送已完成的文档与前端骨架。

---

## ✨ 特性

- 🎯 **结构化输出**：4 个独立模块，输出稳定可靠
- ⚡ **快速生成**：1-2 分钟完成全部内容
- 🎨 **极简界面**：原生 HTML/CSS/JS，零构建步骤
- 🔒 **安全架构**：Node.js 后端代理，API Key 不暴露
- 📱 **响应式设计**：桌面 / 平板 / 移动端自适应

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

```bash
cp backend/.env.example backend/.env
# 编辑 backend/.env，填入百炼 API Key 和应用 ID
```

### 3. 启动服务

```bash
# Mock 模式（无需 API Key，演示用）
npm run mock

# 真实 API 模式
npm start
```

### 4. 访问应用

打开浏览器：http://localhost:3000

## 📁 项目结构

```
pitchforge/
├── frontend/              # 前端（HTML/CSS/JS）
│   ├── index.html
│   ├── css/style.css
│   └── js/
│       ├── app.js         # 主逻辑
│       ├── api.js         # API 调用
│       └── utils.js       # 工具函数
├── backend/               # 后端（Node.js + Express）
│   ├── server.js          # 服务入口
│   ├── routes/
│   │   └── generate.js    # 生成路由
│   └── services/
│       └── bailianService.js  # 百炼 API 封装
├── prompts/               # AI Prompt 模板
│   ├── idea_structure.md
│   ├── pitch_script.md
│   ├── demo_flow.md
│   └── qa.md
├── docs/                  # 项目文档
├── tests/                 # 测试
└── 开发计划.md            # 90 分钟开发计划
```

## 🛠️ 技术栈

- **前端**：HTML5 / CSS3 / Vanilla JavaScript
- **后端**：Node.js 18+ / Express 4.x
- **AI**：阿里云百炼（通义千问）
- **部署**：Vercel / Netlify / 阿里云 FC

## 📝 开发文档

- [TODO.md](TODO.md) - 任务清单
- [开发计划.md](开发计划.md) - 90 分钟开发时间线
- [规范文档.md](规范文档.md) - 技术与代码规范
- [ADVICE.md](ADVICE.md) - 关键决策与建议
- [COMMUNICATING.md](COMMUNICATING.md) - AI 交互记录

## 📄 License

MIT
