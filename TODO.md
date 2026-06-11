# PitchForge | 百炼路演工坊 - TODO 清单

> **项目目标**: 90 分钟内完成 MVP 开发
> **开始时间**: 2026-06-11
> **MVP 状态**: ✅ 已完成 (实际落地: 完整前后端 + Mock 兜底 + 路演材料包)
> **当前阶段**: 🟡 P0 体验优化 + 路演备战

> **重要调整**: 实际落地采用 **单次 Application Call + 聚合 Prompt**，而非原计划"5 节点工作流"。详见 `开发计划.md` 与 `bailianService.js` 注释。优势：MVP 上线更快、调试链路更短；后续可平滑迁移到工作流。

---

## 📍 第一阶段：项目准备 (0-10 分钟) ✅

- [x] 确定项目目录结构 (`frontend/backend/prompts/docs/tests`)
- [x] 创建基础文件 (`index.html`, `style.css`, `app.js`, `server.js`)
- [x] 设计页面布局 (左右分栏: 输入区 + 输出区)
- [x] 确定输入输出字段格式 (5 字段输入 / 4 模块输出)
- [x] 准备核心 Prompt 模板 (4 个单节点 + 1 个聚合)

## 🤖 第二阶段：AI 能力配置 (10-30 分钟) ✅

- [x] 注册/登录阿里云百炼平台
- [x] 准备百炼工作流 / Application (单次 Application Call)
- [x] 配置节点 1: Idea 结构化节点 → `prompts/idea_structure.md`
- [x] 配置节点 2: 路演稿生成节点 → `prompts/pitch_script.md`
- [x] 配置节点 3: Demo 流程生成节点 → `prompts/demo_flow.md`
- [x] 配置节点 4: 评委问答节点 → `prompts/qa.md`
- [x] 聚合节点 (合并 4 段输出) → `prompts/aggregate.md` (实际使用)
- [x] 测试示例输入,确保输出结构稳定 → `docs/sample-output.md`

## 🎨 第三阶段:前端开发 (30-55 分钟) ✅

- [x] 完成 HTML 结构 (`frontend/index.html`)
  - [x] 顶部: 产品名称 + 一句话介绍
  - [x] 左侧: 输入区 (5 字段: 项目想法 / 目标用户 / 当前进度 / 路演时长 / 亮点)
  - [x] 右侧: 输出区 (4 卡片: 项目结构 / 路演稿 / Demo 流程 / 评委问答)
  - [x] 底部: 示例输入快速填充按钮
- [x] 完成 CSS 样式 (`frontend/css/style.css`)
  - [x] 应用色彩规范 (#F7F8FA, #4F46E5, #10B981, #111827, #6B7280)
  - [x] 卡片样式设计 (BEM 命名: `output-card__header`)
  - [x] 按钮交互效果 (悬停 / 禁用 / Loading)
  - [x] 响应式布局适配
- [x] 完成 JavaScript 逻辑 (`frontend/js/{app,api,utils}.js`)
  - [x] 表单验证 (前后端双重校验)
  - [x] 按钮点击事件
  - [x] Loading 状态显示 (进度条 + 5 阶段文字)
  - [x] 结果展示渲染 (Markdown 拆分 + 渲染)
  - [x] 一键复制 (每个输出卡片)
  - [x] 字符计数 + 接近上限变色

## 🔌 第四阶段:后端接入 (55-70 分钟) ✅

- [x] 创建 Node.js 服务 (`backend/server.js`)
- [x] 配置 Express 路由 (`backend/routes/generate.js`)
- [x] 接入百炼 API (`backend/services/bailianService.js`)
- [x] 实现请求转发逻辑
- [x] 处理 API 响应 (统一 `{success, data, error}` 格式)
- [x] 错误处理与边界情况 (业务错误码 → HTTP 状态码)
- [x] 限流中间件 (`express-rate-limit`, 15 分钟 / 30 次)
- [x] Mock 兜底 (`backend/services/mockData.js`, `MOCK_MODE=true`)
- [x] 健康检查 (`GET /api/health`)
- [x] 前后端联调测试

## 🧪 第五阶段:测试优化 (70-80 分钟) ✅

- [x] 使用 PRD 示例输入测试
- [x] 验证输出结构完整性
- [x] 调整 Prompt 优化输出质量
- [x] 保存一份备用输出 (用于路演演示) → `docs/sample-output.md`
- [x] 测试边界情况 (空输入 / 超长 / 网络异常 / 服务繁忙)
- [x] 优化加载体验 (模拟进度条 + 阶段文字)

> ⚠️ 自动化测试暂未补齐: `tests/` 目录为空,见下方"遗留债务"。

## 🎤 第六阶段:路演准备 (80-90 分钟) ✅

- [x] 准备 1 分钟产品介绍话术 → `docs/路演材料.md`
- [x] 准备 Demo 展示路径 (5 步, 约 2-3 分钟)
  - [x] 展示首页
  - [x] 输入示例 idea (一键填充)
  - [x] 点击生成按钮
  - [x] 展示 4 个输出
  - [x] 总结价值
- [x] 准备评委可能追问回答 (5 高频 + 1 备用)
  - [x] 与普通 Chatbot 的区别
  - [x] 技术实现可行性
  - [x] 真实用户是谁
  - [x] 后续如何扩展
  - [x] 技术实现细节 (备用)
- [x] 检查演示环境稳定性
- [x] 备用输出文件 (`docs/sample-output.md`)

---

## ✅ MVP 完成标准 (全部通过)

- [x] 用户可以输入项目想法
- [x] 系统可以返回完整路演包
- [x] 输出结构清晰 (项目结构 + 路演稿 + Demo 流程 + 评委问答)
- [x] 页面可以正常展示结果
- [x] Demo 可以在现场稳定跑通 (含离线备用方案)

---

## 🆕 第七阶段:P0 体验优化 (路演前补齐)

> 优先把"会被现场评委第一眼看到"的部分打磨到位。

- [ ] **暗色模式** (路演现场投影偏暗, 暗色更显专业)
- [ ] **结果导出为 Markdown 文件** (路演后分享给评委)
- [ ] **重新生成按钮显式化** (目前需要再次点击"生成", 改为 "🔄 重新生成")
- [ ] **加载文案更克制** (5 阶段文案 + 真实工作流名, 例如 "通义千问生成中...")
- [ ] **示例输入多 1-2 份** (演示"通用性": AI Workshop / 独立开发 / 教育场景)
- [ ] **移动端真实测试** (Chrome DevTools 模拟 + 真机各一次)

## 🔧 第八阶段:技术债务 (路演后清理)

> 评委可能问: "你这个怎么保证质量?", 这些是回答的底气。

- [ ] **补单元测试** (`tests/backend/`, 覆盖 `validateInput` / `bailianService` / `mockData`)
- [ ] **补前端 E2E** (用 Playwright 跑通: 输入 → 生成 → 复制)
- [ ] **真实百炼工作流迁移** (从单次 Application Call 升级到 5 节点工作流)
- [ ] **API 真实调用压测** (确保 5 并发不出错)
- [ ] **`frontend/debug.html` 去留** (留在仓库易暴露内部细节, 删除或迁到 `.agents/`)

## 📦 第九阶段:路演后扩展 (P1 范围)

> 与 `长期发展计划.md` 阶段一(巩固 MVP)对齐。

- [ ] 历史记录 (LocalStorage, 最多 20 条)
- [ ] 中英文切换
- [ ] Prompt 模板可视化调参 (让用户自己微调)
- [ ] README 完善 + 部署文档
- [ ] 阿里云百炼官方对接 (申请"最佳实践"标签)

---

## 📝 备注 / 踩坑记录

- **2026-06-11** `bailianService.js`: 实施时把"5 节点工作流"简化为"单次 Application Call + 1 个聚合 Prompt"。理由写在 `bailianService.js` 头部注释。路演时可主动讲明"这是 MVP 取舍, 已规划在 P1 升级到工作流"。
- **2026-06-11** `app.js`: Markdown 拆分用了"字符串切分"而非 parseTree。理由: 服务端格式固定, 简单切分已稳定。代码里有回退方案。
- **2026-06-11** `script 加载顺序`: utils.js → api.js → app.js, 全局对象分别挂 `PitchForgeUtils` / `PitchForgeAPI`, app.js 解构使用。详见 `ef166d8` commit。
- **2026-06-11** `.env` 文件: 当前仓库有 `.env` (MOCK_MODE=true), **必须**在提交前确认 `.gitignore` 生效, 避免 API Key 泄漏。
- **2026-06-11** `frontend/debug.html`: 调试用页面, 当前未跟踪进 git。**路演前决定**: 删 / 留 / 移到 `.agents/`。

---

_最后更新: 2026-06-11_
_MVP 状态: ✅ 完成 | 当前阶段: 🟡 P0 体验优化_
