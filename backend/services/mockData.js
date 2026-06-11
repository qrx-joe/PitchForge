/**
 * @fileoverview Mock 数据生成器
 * @description 当 MOCK_MODE=true 时返回此数据，用于本地开发与路演备用
 * @author PitchForge Team
 * @version 1.0.0
 * @created 2026-06-11
 * @lastModified 2026-06-11
 * @lastModifiedBy AI Assistant
 *
 * 用途：
 * 1. 本地开发无需 API Key
 * 2. 路演现场网络异常时使用此数据兜底
 * 3. 验证前端渲染逻辑
 *
 * 设计原则：
 * - 输出格式必须与真实 API 完全一致（前端无需区分）
 * - 内容质量要"看起来像 AI 生成的"
 * - 模拟 1.2 秒延迟以测试 Loading 状态
 */

'use strict';

/**
 * 基于用户输入生成 Mock 路演包
 *
 * @param {Object} input - 用户输入
 * @param {string} input.project_idea - 项目想法
 * @param {string} [input.target_user] - 目标用户
 * @param {string} [input.progress] - 当前进度
 * @param {string} [input.pitch_duration] - 路演时长
 * @param {string} [input.highlight] - 亮点
 * @returns {string} Markdown 格式路演包
 */
function generateMockPitch(input) {
  const {
    project_idea = '未提供项目想法',
    target_user = '未指定',
    progress = '原型',
    pitch_duration = '1 分钟',
    highlight = 'AI 能力',
  } = input || {};

  // 截取项目想法的前 30 字作为"项目名称"
  const ideaSnippet = project_idea.slice(0, 30).replace(/\n/g, ' ').trim();
  const projectName = ideaSnippet || '未命名项目';

  // 根据 pitch_duration 调整路演稿长度
  const pitchLengthHint = {
    '30 秒': '80-100',
    '1 分钟': '180-220',
    '3 分钟': '500-600',
  };
  const charHint = pitchLengthHint[pitch_duration] || '180-220';

  // 根据进度生成差异化描述
  const progressDesc = {
    'idea': '概念阶段',
    '原型': '已完成原型设计',
    'Demo': '已有可演示 Demo',
    '已上线': '已上线运营',
  }[progress] || progress;

  return `# PitchForge 路演包

## 一、项目结构

- **项目名称**：${projectName}
- **一句话介绍**：${project_idea.slice(0, 50)}${project_idea.length > 50 ? '...' : ''}
- **目标用户**：${target_user}
- **核心场景**：用户需要快速将项目想法整理为结构化表达材料的场景
- **核心功能**：
  1. 项目结构化：将粗糙 idea 整理为标准化结构
  2. 路演稿生成：基于结构化内容生成适合口头表达的路演稿
  3. Demo 展示流程：设计 3-5 步 Demo 演示路径
  4. 评委问答准备：预测高频评委问题并准备回答思路
- **当前进度**：${progressDesc}
- **差异化优势**：
  - 结构化输出：4 个独立模块逐项展示
  - 现场可演示：所有生成内容可直接用于路演
  - 安全架构：API Key 不暴露

## 二、1 分钟路演稿

大家好,我做的是「${projectName}」。

我观察到,很多 Builder 有想法,也能做出 Demo,但很难在短时间内把项目讲清楚。尤其是在黑客松和 AI Workshop 中,大家实操后还要马上准备路演材料,这个过程非常紧张。

所以我做了这个工具。用户只需要输入一个粗略的项目想法——比如「${project_idea.slice(0, 30)}${project_idea.length > 30 ? '...' : ''}」——系统就可以在 1-2 分钟内自动生成项目结构、路演稿、Demo 展示流程和评委问答。

这个工具的价值不是替用户编造项目,而是帮助用户把真实想法快速打磨成清晰、可信、可展示的表达材料。

我们的目标用户是${target_user},当前进度是${progressDesc}。项目的核心亮点是${highlight}。

⏱️ 预计时长：60 秒

## 三、Demo 展示流程

### 第 1 步：展示输入界面 （15 秒）
- **动作**：打开产品主页,展示输入区域
- **话术**：只需要填一个项目想法,其他字段都是选填。
- **目的**：让评委一目了然产品形态

### 第 2 步：输入项目想法 （30 秒）
- **动作**：输入「${project_idea.slice(0, 40)}${project_idea.length > 40 ? '...' : ''}」
- **话术**：我输入了一个关于「${highlight}」的项目想法。点击生成。
- **目的**：展示易用性,避免现场手忙脚乱

### 第 3 步：展示 AI 工作流进度 （30 秒）
- **动作**：点击"生成"按钮,进度条依次显示各步骤
- **话术**：系统分步生成内容,这个过程大概需要 1 分钟。
- **目的**：体现 AI 能力和产品差异化

### 第 4 步：展示 4 个输出区块 （60 秒）
- **动作**：依次展示项目结构、路演稿、Demo 流程、评委问答
- **话术**：这是项目结构,这是路演稿（${charHint}字）,这是 Demo 流程,这是评委问答。每块都可以一键复制。
- **目的**：核心价值呈现

### 第 5 步：邀请体验 （20 秒）
- **动作**：展示 URL,邀请评委体验
- **话术**：大家可以现场体验
- **目的**：转化评委关注度

⏱️ 总时长：2 分 35 秒

## 四、评委问答

### Q1：和普通 Chatbot 有什么区别？（差异化类）
**回答思路**：
- 强调场景化与结构化
- 强调输出可直接用
**参考回答**（30 秒）：普通 Chatbot 是自由对话,输出不稳定。我们面向路演准备这个具体场景,把生成过程拆成 4 个独立模块,输出格式固定且可直接复制到 PPT 或答辩稿里。

### Q2：90 分钟内实际完成了什么？（可行性类）
**回答思路**：
- 完整前后端系统
- 可演示 MVP
**参考回答**（30 秒）：我完成了完整的前后端系统。前端包含左右分栏布局、4 个输出卡片、Loading 进度条和复制功能。后端封装了 API 调用层。整个产品从输入到输出 1 分钟内可以演示。当前进度是${progressDesc}。

### Q3：这个项目的真实用户是谁？（用户类）
**回答思路**：
- 核心用户：黑客松参与者
- 延伸用户：独立开发者、AI Workshop 学员
**参考回答**（30 秒）：核心用户是黑客松参与者,他们只有 60-90 分钟实操时间,路演准备时间通常不足 20 分钟。延伸用户包括${target_user}。

### Q4：为什么一定要用 AI 来做？（价值类）
**回答思路**：
- 效率提升
- 标准化输出
**参考回答**（20 秒）：人工整理项目结构和路演稿通常需要 2-3 小时,而 AI 只需 1-2 分钟,且输出结构标准化。

### Q5：后续如何扩展？（扩展类）
**回答思路**：
- Hackathon Copilot 路线
- PRD / README / 提交材料生成
**参考回答**（30 秒）：未来可以扩展成完整的 Hackathon Copilot,支持 PRD 生成、README 生成、项目提交材料检查等,覆盖从 idea 到展示的完整流程。项目的核心亮点是${highlight},后续会围绕这个方向持续深化。
`;
}

/**
 * 模拟 API 延迟（让前端 Loading 状态可见）
 *
 * 为什么需要：
 * - 真实 API 平均响应 15-25 秒，太长不便于本地调试
 * - Mock 模式应该"快但不是瞬间"，便于看到 Loading 动画
 *
 * @param {number} ms - 延迟毫秒数
 * @returns {Promise<void>}
 */
function simulateLatency(ms = 1200) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = {
  generateMockPitch,
  simulateLatency,
};
