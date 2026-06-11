# PitchForge | 路演工坊

> 把粗糙 idea，快速打磨成可路演项目表达。

一个基于阿里云 AI 能力的路演包生成器，专为黑客松和 AI Workshop 场景设计。
用户输入项目想法，系统自动生成 4 个核心输出：**项目结构**、**1 分钟路演稿**、**Demo 展示流程**、**评委问答**。

> ✅ **当前状态**: MVP 已完成, 含前端骨架、后端 Express 服务、百炼 API 接入、Mock 兜底、限流、备用输出文件。详见 [TODO.md](TODO.md) 与 [COMMUNICATING.md](COMMUNICATING.md)。
> 🎭 **演示模式**: 仓库默认 `MOCK_MODE=true`, 无需 API Key 即可跑通。

---

## ✨ 特性

- 🎯 **结构化输出**：4 个独立模块，输出稳定可靠
- ⚡ **快速生成**：1-2 分钟完成全部内容
- 🎨 **极简界面**：原生 HTML/CSS/JS，零构建步骤
- 🔒 **安全架构**：Node.js 后端代理，API Key 不暴露
- 📱 **响应式设计**：桌面 / 平板 / 移动端自适应
- 🎭 **Mock 兜底**：无 API Key 也能跑完整 Demo
- 🛡️ **限流防护**：15 min / 30 次 (防滥用)
- 🔁 **三层错误防护**：前端校验 + 后端校验 + 业务错误码翻译

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

```bash
cp backend/.env.example backend/.env
# 编辑 backend/.env，填入百炼 API Key 和 App ID（MOCK_MODE=true 时可跳过）
```

### 3. 启动服务

```bash
# Mock 模式（无需 API Key，演示用，推荐！）
npm run mock

# 真实 API 模式（需要 API Key + App ID）
npm start

# 热重载开发（需要 Node 18+）
npm run dev
```

### 4. 访问应用

打开浏览器：http://localhost:3000

健康检查：http://localhost:3000/api/health

## 📁 项目结构

```
pitchforge/
├── frontend/                  # 前端（HTML/CSS/JS，零构建）
│   ├── index.html             # 主页面
│   ├── debug.html             # 调试用页面（路演前决定去留）
│   ├── css/
│   │   └── style.css          # 样式表
│   └── js/
│       ├── app.js             # 主逻辑（事件 / 状态 / 渲染）
│       ├── api.js             # API 通信（HTTP / 错误 / 超时）
│       └── utils.js           # 工具函数（DOM / Markdown / 防抖）
├── backend/                   # 后端（Node.js + Express）
│   ├── server.js              # 服务入口
│   ├── routes/
│   │   └── generate.js        # 生成路由 + 输入校验
│   ├── services/
│   │   ├── bailianService.js  # 百炼 API 封装（含错误归一化）
│   │   └── mockData.js        # Mock 兜底数据
│   └── .env / .env.example    # 环境变量
├── prompts/                   # AI Prompt 模板
│   ├── idea_structure.md      # 项目结构化（未来工作流节点）
│   ├── pitch_script.md        # 路演稿（未来工作流节点）
│   ├── demo_flow.md           # Demo 流程（未来工作流节点）
│   ├── qa.md                  # 评委问答（未来工作流节点）
│   └── aggregate.md           # 聚合 Prompt（当前实际使用）
├── docs/                      # 项目文档
│   ├── sample-output.md       # 备用输出（路演容灾）
│   └── 路演材料.md             # 1 分钟话术 + Demo 流程 + 评委问答
├── tests/                     # 测试（待补 P1）
├── TODO.md                    # 任务清单
├── NEXT-TO-DO.md              # 下一步规划
├── 开发计划.md                 # 90 分钟开发计划 + 实际进度
├── 规范文档.md                 # 技术 / 代码 / 注释规范
├── 长期发展计划.md             # 三阶段路线图
├── ADVICE.md                  # 建议与问题解答
└── COMMUNICATING.md           # AI 交互记录
```

## 🛠️ 技术栈

- **前端**：HTML5 / CSS3 / Vanilla JavaScript (ES6+, 零构建)
- **后端**：Node.js 18+ / Express 4.x
- **AI**：阿里云百炼 Application Call API (P1 升级到 5 节点工作流)
- **辅助**：axios / dotenv / cors / express-rate-limit
- **部署**：Vercel / Netlify / 阿里云 FC

## 🎭 Mock vs 真实 API

| 模式 | 启动 | 用途 | 依赖 |
|------|------|------|------|
| Mock | `npm run mock` | 路演 / Demo / 开发调试 | 无 |
| 真实 | `npm start` | 生产 / 真实用户体验 | API Key + App ID |

切换：编辑 `backend/.env` 的 `MOCK_MODE=true|false`。

## 🛡️ 安全与限流

- **API Key 不暴露前端**: 全部在 `backend/.env`, `.gitignore` 已屏蔽
- **限流**: `express-rate-limit`, 15 min / 30 次, 仅 `/api/` 路由生效
- **输入校验双重**: 前端 `app.js` + 后端 `validateInput()`, 错误码统一
- **错误脱敏**: 不暴露 `err.stack` 给前端, 调试模式下可选

## 📝 开发文档

- [TODO.md](TODO.md) - 任务清单（6 阶段 MVP ✅ + P0 优化中）
- [NEXT-TO-DO.md](NEXT-TO-DO.md) - 下一步规划（P0/P1/P2/P3）
- [开发计划.md](开发计划.md) - 90 分钟开发计划 + 实际进度
- [规范文档.md](规范文档.md) - 技术 / 代码 / 注释规范
- [长期发展计划.md](长期发展计划.md) - 三阶段路线图
- [ADVICE.md](ADVICE.md) - 关键决策与建议（Q1-Q25）
- [COMMUNICATING.md](COMMUNICATING.md) - AI 交互记录（14 个对话）
- [docs/路演材料.md](docs/路演材料.md) - 1 分钟话术 + Demo + 评委问答
- [docs/sample-output.md](docs/sample-output.md) - 备用输出（路演容灾）

## 📄 License

MIT
