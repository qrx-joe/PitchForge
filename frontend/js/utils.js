/**
 * @fileoverview PitchForge 前端工具函数库
 * @description 提供 DOM 操作、Markdown 渲染、剪贴板、防抖等通用工具
 * @author PitchForge Team
 * @version 1.0.0
 * @created 2026-06-11
 * @lastModified 2026-06-11
 * @lastModifiedBy AI Assistant
 *
 * 架构说明：
 * - 本文件不依赖任何第三方库
 * - 所有函数均为纯函数或显式副作用（避免隐式状态）
 * - 命名采用 camelCase 规范
 */

(function (global) {
  'use strict';

  // ============================================================
  // DOM 操作辅助
  // ============================================================

  /**
   * 简化的 document.querySelector
   * @param {string} selector - CSS 选择器
   * @returns {Element|null} 元素或 null
   */
  function $(selector) {
    return document.querySelector(selector);
  }

  /**
   * 简化的 document.querySelectorAll，返回数组
   * @param {string} selector - CSS 选择器
   * @returns {Element[]} 元素数组
   */
  function $$(selector) {
    return Array.from(document.querySelectorAll(selector));
  }

  /**
   * 安全地显示元素
   * @param {Element} el - DOM 元素
   */
  function show(el) {
    if (el) el.style.display = '';
  }

  /**
   * 安全地隐藏元素
   * @param {Element} el - DOM 元素
   */
  function hide(el) {
    if (el) el.style.display = 'none';
  }

  // ============================================================
  // Markdown 渲染（轻量级，不引入 marked.js）
  // ============================================================

  /**
   * 极简 Markdown → HTML 渲染器
   *
   * 为什么不用 marked.js：
   * - MVP 阶段 90 分钟内完成，避免引入额外依赖
   * - 我们的输出格式相对固定（4 个模块），不需要完整 Markdown 支持
   * - 减少首屏加载时间（详见规范文档 8.1）
   *
   * 支持的语法：
   * - # / ## / ### / #### 标题
   * - **粗体** 和 *斜体*
   * - `行内代码` 和 ```代码块```
   * - > 引用
   * - 无序列表（- 开头）
   * - 有序列表（数字. 开头）
   * - 段落自动识别
   *
   * @param {string} md - Markdown 文本
   * @returns {string} HTML 字符串
   */
  function renderMarkdown(md) {
    if (!md || typeof md !== 'string') return '';

    // 转义 HTML 特殊字符（防 XSS，详见规范文档 7.1）
    const escape = (s) => s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

    // 先按代码块切分（代码块内不做其他渲染）
    const codeBlockRegex = /```([\s\S]*?)```/g;
    const segments = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(md)) !== null) {
      if (match.index > lastIndex) {
        segments.push({ type: 'text', content: md.slice(lastIndex, match.index) });
      }
      segments.push({ type: 'code', content: match[1] });
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < md.length) {
      segments.push({ type: 'text', content: md.slice(lastIndex) });
    }

    return segments.map((seg) => {
      if (seg.type === 'code') {
        return `<pre><code>${escape(seg.content.trim())}</code></pre>`;
      }
      return renderTextBlock(escape(seg.content));
    }).join('\n');
  }

  /**
   * 渲染普通文本块（处理标题、列表、引用等）
   * @param {string} text - 已转义的文本
   * @returns {string} HTML
   */
  function renderTextBlock(text) {
    const lines = text.split('\n');
    const html = [];
    let inList = false;
    let listType = null; // 'ul' | 'ol'

    const closeList = () => {
      if (inList) {
        html.push(`</${listType}>`);
        inList = false;
        listType = null;
      }
    };

    for (const line of lines) {
      const trimmed = line.trim();

      // 空行：关闭当前列表
      if (!trimmed) {
        closeList();
        continue;
      }

      // 标题
      const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
      if (headingMatch) {
        closeList();
        const level = headingMatch[1].length;
        html.push(`<h${level}>${applyInline(headingMatch[2])}</h${level}>`);
        continue;
      }

      // 引用
      if (trimmed.startsWith('&gt;')) {
        closeList();
        html.push(`<blockquote>${applyInline(trimmed.slice(4))}</blockquote>`);
        continue;
      }

      // 无序列表
      const ulMatch = trimmed.match(/^[-*+]\s+(.+)$/);
      if (ulMatch) {
        if (!inList || listType !== 'ul') {
          closeList();
          html.push('<ul>');
          inList = true;
          listType = 'ul';
        }
        html.push(`<li>${applyInline(ulMatch[1])}</li>`);
        continue;
      }

      // 有序列表
      const olMatch = trimmed.match(/^\d+\.\s+(.+)$/);
      if (olMatch) {
        if (!inList || listType !== 'ol') {
          closeList();
          html.push('<ol>');
          inList = true;
          listType = 'ol';
        }
        html.push(`<li>${applyInline(olMatch[1])}</li>`);
        continue;
      }

      // 普通段落
      closeList();
      html.push(`<p>${applyInline(trimmed)}</p>`);
    }

    closeList();
    return html.join('\n');
  }

  /**
   * 行内格式：粗体、斜体、行内代码
   * @param {string} text - 已转义的文本
   * @returns {string} HTML
   */
  function applyInline(text) {
    return text
      // 行内代码
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      // 粗体
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      // 斜体
      .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>');
  }

  // ============================================================
  // 剪贴板
  // ============================================================

  /**
   * 复制文本到剪贴板
   *
   * 实现说明：
   * - 优先使用 navigator.clipboard（现代浏览器）
   * - 回退方案使用 document.execCommand('copy') + 隐藏 textarea
   * - 处理非 HTTPS 环境（如 localhost）
   *
   * @param {string} text - 要复制的文本
   * @returns {Promise<boolean>} 是否成功
   */
  async function copyToClipboard(text) {
    if (!text) return false;

    // 现代 API
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch (err) {
        console.warn('navigator.clipboard 失败，回退到 execCommand', err);
      }
    }

    // 回退方案
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      textarea.style.pointerEvents = 'none';
      document.body.appendChild(textarea);
      textarea.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(textarea);
      return ok;
    } catch (err) {
      console.error('复制失败', err);
      return false;
    }
  }

  // ============================================================
  // 防抖与节流
  // ============================================================

  /**
   * 防抖：等待停止触发后 wait ms 才执行
   * @param {Function} fn - 目标函数
   * @param {number} wait - 等待毫秒数
   * @returns {Function} 防抖后的函数
   */
  function debounce(fn, wait) {
    let timer = null;
    return function (...args) {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), wait);
    };
  }

  // ============================================================
  // 时间格式化
  // ============================================================

  /**
   * 格式化耗时（毫秒 → 可读字符串）
   * @param {number} ms - 毫秒数
   * @returns {string} 如 "1.2s" / "234ms"
   */
  function formatDuration(ms) {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  }

  // ============================================================
  // 错误码映射（与后端一致，见规范文档 4.2）
  // ============================================================

  const ERROR_MESSAGES = {
    INVALID_INPUT: '输入参数无效，请检查项目想法是否填写',
    UNAUTHORIZED: 'API Key 配置错误或已过期',
    RATE_LIMITED: '请求过于频繁，请稍后再试',
    INTERNAL_ERROR: '服务器内部错误，请稍后重试',
    SERVICE_UNAVAILABLE: '百炼服务繁忙，请稍后重试',
    NETWORK_ERROR: '网络连接异常，请检查网络后重试',
    TIMEOUT: '请求超时，请稍后重试',
    UNKNOWN: '未知错误，请稍后重试',
  };

  /**
   * 获取错误码对应的用户友好提示
   * @param {string} code - 错误码
   * @returns {string} 用户提示
   */
  function getErrorMessage(code) {
    return ERROR_MESSAGES[code] || ERROR_MESSAGES.UNKNOWN;
  }

  // ============================================================
  // 暴露到全局
  // ============================================================

  global.PitchForgeUtils = {
    $,
    $$,
    show,
    hide,
    renderMarkdown,
    copyToClipboard,
    debounce,
    formatDuration,
    getErrorMessage,
  };
})(window);
