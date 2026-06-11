/**
 * @fileoverview PitchForge 前端主逻辑
 * @description 处理用户交互、表单提交、结果渲染、复制功能
 * @author PitchForge Team
 * @version 1.0.0
 * @created 2026-06-11
 * @lastModified 2026-06-11
 * @lastModifiedBy AI Assistant
 *
 * 架构说明：
 * - 单一入口：DOMContentLoaded 后初始化
 * - 状态集中在 STATE 对象，便于追踪
 * - 委托 utils.js 做渲染，api.js 做通信
 */

(function () {
  'use strict';

  // ============================================================
  // 从全局工具库解构函数
  // ============================================================

  const { $, show, hide, renderMarkdown, copyToClipboard, debounce, formatDuration, getErrorMessage } = PitchForgeUtils;
  const { generatePitch: apiGeneratePitch } = PitchForgeAPI;

  // ============================================================
  // 状态管理
  // ============================================================

  const STATE = {
    isGenerating: false,
    abortController: null,
  };

  // ============================================================
  // DOM 引用（启动时缓存）
  // ============================================================

  let dom = {};

  function cacheDom() {
    dom = {
      form: $('#pitchForm'),
      generateBtn: $('#generateBtn'),
      btnText: $('.btn__text'),
      btnLoading: $('.btn__loading'),
      projectIdea: $('#project_idea'),
      targetUser: $('#target_user'),
      progress: $('#progress'),
      pitchDuration: $('#pitch_duration'),
      highlight: $('#highlight'),
      charCount: $('#charCount'),
      errorMessage: $('#errorMessage'),
      successMessage: $('#successMessage'),
      loadingProgress: $('#loadingProgress'),
      progressFill: $('#progressFill'),
      progressText: $('#progressText'),
      outputContainer: $('#outputContainer'),
      emptyState: $('#emptyState'),
      fillExample: $('#fillExample'),
      // 4 个输出卡片（硬编码 ID 映射，避免字符串替换的歧义）
      outputCards: [
        { id: 'projectStructure', title: '一、项目结构', marker: '一、项目结构', card: $('#projectStructure'), content: $('#structureContent') },
        { id: 'pitchScript', title: '二、1 分钟路演稿', marker: '二、1 分钟路演稿', card: $('#pitchScript'), content: $('#pitchContent') },
        { id: 'demoFlow', title: '三、Demo 展示流程', marker: '三、Demo 展示流程', card: $('#demoFlow'), content: $('#demoContent') },
        { id: 'qaSection', title: '四、评委问答', marker: '四、评委问答', card: $('#qaSection'), content: $('#qaContent') },
      ],
    };
  }

  // ============================================================
  // 示例数据
  // ============================================================

  const EXAMPLE_INPUT = {
    project_idea: '我想做一个面向黑客松和 AI Workshop 参与者的 AI 路演助手。很多 Builder 有想法，也能做出 Demo，但很难在短时间内讲清楚项目价值、技术实现和未来方向。这个工具希望帮助用户把粗糙 idea 快速整理成项目结构、1 分钟路演稿、Demo 展示流程和评委问答。MVP 阶段使用阿里云搭建 AI 能力，并用网页展示生成结果。',
    target_user: '黑客松参与者、AI Workshop 学员',
    progress: '原型',
    pitch_duration: '1 分钟',
    highlight: 'AI 工作流 + 结构化输出',
  };

  // ============================================================
  // 工具函数（局部封装）
  // ============================================================

  /**
   * 显示错误提示
   * @param {string} message
   */
  function showError(message) {
    dom.errorMessage.textContent = message;
    show(dom.errorMessage);
    hide(dom.successMessage);
    // 3 秒后自动隐藏
    setTimeout(() => hide(dom.errorMessage), 5000);
  }

  /**
   * 显示成功提示
   * @param {string} message
   */
  function showSuccess(message) {
    dom.successMessage.querySelector('span').textContent = message;
    show(dom.successMessage);
    hide(dom.errorMessage);
    setTimeout(() => hide(dom.successMessage), 3000);
  }

  /**
   * 设置 Loading 状态
   * @param {boolean} on
   */
  function setLoading(on) {
    STATE.isGenerating = on;
    dom.generateBtn.disabled = on;
    if (on) {
      hide(dom.btnText);
      show(dom.btnLoading);
      show(dom.loadingProgress);
      hide(dom.emptyState);
      // 重置进度
      updateProgress(0, '正在初始化...');
    } else {
      show(dom.btnText);
      hide(dom.btnLoading);
      hide(dom.loadingProgress);
    }
  }

  /**
   * 更新进度条
   * @param {number} percent - 0-100
   * @param {string} text - 提示文字
   */
  function updateProgress(percent, text) {
    dom.progressFill.style.width = `${Math.min(100, Math.max(0, percent))}%`;
    dom.progressText.textContent = text;
  }

  /**
   * 收集表单数据
   * @returns {Object}
   */
  function collectFormData() {
    return {
      project_idea: dom.projectIdea.value.trim(),
      target_user: dom.targetUser.value.trim(),
      progress: dom.progress.value,
      pitch_duration: dom.pitchDuration.value,
      highlight: dom.highlight.value.trim(),
    };
  }

  // ============================================================
  // Markdown 拆分与渲染
  // ============================================================

  /**
   * 将完整 Markdown 按 4 个模块标题切分
   *
   * 为什么用字符串切分而非 parseTree：
   * - 服务端输出格式固定（4 个二级标题）
   * - 简单字符串切分已足够稳定
   * - 避免引入额外依赖
   *
   * @param {string} fullMarkdown
   * @returns {string[]} 4 个模块的内容数组
   */
  function splitMarkdownBySections(fullMarkdown) {
    if (!fullMarkdown) return ['', '', '', ''];

    const result = new Array(4).fill('');

    // 标准化：去除代码块包裹（防止用户粘贴的代码中包含"## 一、"等）
    let content = fullMarkdown;
    // 移除最外层 ```markdown ... ``` 包裹
    content = content.replace(/^```(?:markdown|md)?\s*\n?/i, '');
    content = content.replace(/\n?```\s*$/, '');
    content = content.trim();

    // 按标题切分（支持 ## 一、 或 ## 一： 或 ## 1. 等变体）
    const splitRegex = /##\s*[一二三四][\s,，:：.。][^\n]*\n/g;
    const parts = content.split(splitRegex).filter((p) => p.trim());

    // 如果切分出 4 段，逐一映射
    if (parts.length >= 4) {
      return [parts[0], parts[1], parts[2], parts[3]];
    }

    // 回退方案：按"## 一、二、三、四、"手动定位
    const markers = [
      /(?:^|\n)##\s*一[、，:：.。][^\n]*\n([\s\S]*?)(?=(?:^|\n)##\s*[二三四]|$)/,
      /(?:^|\n)##\s*二[、，:：.。][^\n]*\n([\s\S]*?)(?=(?:^|\n)##\s*[三四]|$)/,
      /(?:^|\n)##\s*三[、，:：.。][^\n]*\n([\s\S]*?)(?=(?:^|\n)##\s*四|$)/,
      /(?:^|\n)##\s*四[、，:：.。][^\n]*\n([\s\S]*?)$/,
    ];

    markers.forEach((regex, idx) => {
      const match = content.match(regex);
      if (match) result[idx] = match[1].trim();
    });

    // 如果都为空（说明格式异常），整段塞到第一个区块
    if (result.every((r) => !r)) {
      return [content, '', '', ''];
    }

    return result;
  }

  /**
   * 渲染生成结果到 4 个卡片
   * @param {string} fullMarkdown
   */
  function renderResult(fullMarkdown) {
    const sections = splitMarkdownBySections(fullMarkdown);

    dom.outputCards.forEach((card, idx) => {
      const content = sections[idx] || '';
      if (content) {
        card.content.innerHTML = renderMarkdown(content);
        show(card.card);
      } else {
        // 该模块无内容，隐藏卡片
        hide(card.card);
      }
    });

    // 滚动到第一个输出卡片
    const firstCard = dom.outputCards.find((c) => c.card.style.display !== 'none');
    if (firstCard) {
      firstCard.card.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  // ============================================================
  // 事件处理
  // ============================================================

  /**
   * 表单提交处理
   * @param {Event} e
   */
  async function handleSubmit(e) {
    e.preventDefault();
    if (STATE.isGenerating) return;

    const input = collectFormData();

    // 二次校验（防御性编程）
    if (!input.project_idea) {
      showError('请输入项目想法');
      dom.projectIdea.focus();
      return;
    }

    if (input.project_idea.length > 2000) {
      showError('项目想法不能超过 2000 字');
      return;
    }

    setLoading(true);
    const startTime = performance.now();
    STATE.abortController = new AbortController();

    try {
      // 模拟进度条（ API 不返回中间进度，我们用定时器模拟）
      simulateProgress();

      const result = await apiGeneratePitch(input, STATE.abortController.signal);

      const duration = formatDuration(performance.now() - startTime);

      if (!result.success) {
        const message = getErrorMessage(result.error.code);
        showError(`${message}${result.error.message ? ` (${result.error.message})` : ''}`);
        setLoading(false);
        return;
      }

      // 成功：渲染结果
      updateProgress(100, `生成完成！耗时 ${duration}`);
      const markdown = result.data?.result || result.data?.markdown || '';
      if (!markdown) {
        showError('生成结果为空，请重试');
        setLoading(false);
        return;
      }

      renderResult(markdown);
      showSuccess('生成完成！可点击复制按钮保存');
    } catch (err) {
      console.error('生成异常', err);
      showError('生成过程出现异常，请稍后重试');
    } finally {
      // 延迟关闭 loading，让用户看到 100%
      setTimeout(() => setLoading(false), 600);
    }
  }

  /**
   * 模拟进度条（在没有流式输出的情况下提供视觉反馈）
   * 业务背景：工作流是黑盒调用，前端无法获得真实进度
   * 但用户需要看到"系统在干活"，否则会以为卡死
   */
  function simulateProgress() {
    const steps = [
      { p: 15, t: '正在整理项目信息...', d: 0 },
      { p: 35, t: '正在生成路演稿...', d: 3000 },
      { p: 60, t: '正在设计 Demo 流程...', d: 6000 },
      { p: 85, t: '正在准备评委问答...', d: 9000 },
      { p: 95, t: '正在整理最终结果...', d: 12000 },
    ];

    steps.forEach(({ p, t, d }) => {
      setTimeout(() => {
        if (STATE.isGenerating) {
          updateProgress(p, t);
        }
      }, d);
    });
  }

  /**
   * 字符计数（实时）
   */
  function handleCharCount() {
    const len = dom.projectIdea.value.length;
    dom.charCount.textContent = String(len);
    // 接近上限时变色
    if (len > 1800) {
      dom.charCount.style.color = 'var(--error)';
    } else if (len > 1500) {
      dom.charCount.style.color = 'var(--primary)';
    } else {
      dom.charCount.style.color = 'var(--text-secondary)';
    }
  }

  /**
   * 复制按钮点击（事件委托）
   * @param {Event} e
   */
  async function handleCopyClick(e) {
    const btn = e.target.closest('.btn-copy');
    if (!btn) return;

    const targetId = btn.dataset.target;
    const target = $(`#${targetId}`);
    if (!target) return;

    // 复制原始 Markdown 文本（用 textContent 获取纯文本，再还原 Markdown 风格）
    // 注意：实际复制内容应该是渲染前的 Markdown 文本
    // 简化方案：复制 textContent（用户拿到的是已渲染文本，凑合用）
    const text = target.innerText || target.textContent;
    const ok = await copyToClipboard(text);

    if (ok) {
      const originalText = btn.textContent;
      btn.textContent = '已复制 ✓';
      btn.style.background = 'rgba(16, 185, 129, 0.3)';
      setTimeout(() => {
        btn.textContent = originalText;
        btn.style.background = '';
      }, 2000);
    } else {
      showError('复制失败，请手动选择文本复制');
    }
  }

  /**
   * 填充示例输入
   */
  function handleFillExample() {
    dom.projectIdea.value = EXAMPLE_INPUT.project_idea;
    dom.targetUser.value = EXAMPLE_INPUT.target_user;
    dom.progress.value = EXAMPLE_INPUT.progress;
    dom.pitchDuration.value = EXAMPLE_INPUT.pitch_duration;
    dom.highlight.value = EXAMPLE_INPUT.highlight;
    handleCharCount();
    showSuccess('已填充示例输入，可直接点击生成');
  }

  // ============================================================
  // 初始化
  // ============================================================

  function init() {
    cacheDom();

    // 表单提交
    dom.form.addEventListener('submit', handleSubmit);

    // 字符计数（防抖 100ms 避免高频触发）
    dom.projectIdea.addEventListener('input', debounce(handleCharCount, 100));

    // 复制按钮（事件委托）
    dom.outputContainer.addEventListener('click', handleCopyClick);

    // 填充示例
    dom.fillExample.addEventListener('click', handleFillExample);

    // 初始计数
    handleCharCount();
  }

  // DOM 就绪后启动
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
