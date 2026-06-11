/**
 * @fileoverview 阿里云服务调用模块
 * @description 封装 Application Call API，支持工作流和应用两种模式
 * @author PitchForge Team
 * @version 1.0.0
 * @created 2026-06-11
 * @lastModified 2026-06-11
 * @lastModifiedBy AI Assistant
 *
 * 架构决策：
 * - 单例：整个进程一个实例，复用 axios 连接池
 * - Mock 开关：通过环境变量 MOCK_MODE 控制
 * - 错误转换：HTTP 错误 → 业务错误码（统一前端处理）
 *
 * 替代方案分析：
 * 1. 直接用 fetch（不引入 axios）：节省 30KB 依赖，但失去超时/拦截器/重试便利
 * 2. 使用 SDK（aliyun-sdk）：依赖较重，不必要
 * 3. 选 axios：生态成熟、拦截器好用、超时易配置
 */

'use strict';

const axios = require('axios');
const path = require('path');
const fs = require('fs');
const { generateMockPitch, simulateLatency } = require('./mockData');

// ============================================================
// 配置加载
// ============================================================

const CONFIG = {
  MOCK_MODE: process.env.MOCK_MODE === 'true',
  API_KEY: process.env.BAILIAN_API_KEY || '',
  APP_ID: process.env.BAILIAN_APP_ID || '',
  REGION: process.env.BAILIAN_REGION || 'cn-hangzhou',
  TIMEOUT_MS: 60000,
};

// 启动时检查配置（仅在真实模式下报错）
if (!CONFIG.MOCK_MODE) {
  const missing = [];
  if (!CONFIG.API_KEY) missing.push('BAILIAN_API_KEY');
  if (!CONFIG.APP_ID) missing.push('BAILIAN_APP_ID');
  if (missing.length > 0) {
    console.warn(
      `[BailianService] 警告：缺少环境变量 ${missing.join(', ')}，将无法调用真实 API。` +
      `如需本地开发，请设置 MOCK_MODE=true`
    );
  }
}

// ============================================================
// Prompt 加载
// ============================================================

/**
 * 加载 Prompt 模板文件
 *
 * 为什么从文件读取而非硬编码：
 * - Prompt 调试迭代频繁，独立文件便于编辑
 * - 可被百炼控制台的工作流直接复用
 *
 * @param {string} name - 文件名（不含扩展名）
 * @returns {string} Prompt 内容
 */
function loadPrompt(name) {
  const filePath = path.join(__dirname, '..', '..', 'prompts', `${name}.md`);
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    console.error(`[BailianService] 加载 Prompt 失败: ${name}.md`, err.message);
    return '';
  }
}

// 启动时预加载
const PROMPTS = {
  aggregate: loadPrompt('aggregate'),
};

// ============================================================
// 核心 API
// ============================================================

/**
 * 调用百炼 Application Call API
 *
 * 适用场景：单次 LLM 调用（非工作流），使用聚合 Prompt
 *
 * 替代方案：
 * - 工作流模式：调用 5 个节点分别生成 4 个模块
 *   优点：输出更稳定、可独立调试
 *   缺点：需要预先在控制台创建工作流，配置成本高
 *
 * 当前实现：单次 Application Call（适合 MVP 快速验证）
 * 后续优化：迁移到工作流模式（NEXT-TO-DO.md P1 任务）
 *
 * @param {Object} input - 用户输入
 * @returns {Promise<string>} Markdown 格式路演包
 * @throws {Error} 调用失败时抛出业务异常
 */
async function callBailianApplication(input) {
  const url = `https://${CONFIG.REGION}.bailian.aliyuncs.com/api/v1/apps/${CONFIG.APP_ID}/completion`;

  // 构造请求体
  // 参考：Application Call API 文档
  const requestBody = {
    input: {
      prompt: renderAggregatePrompt(input),
    },
    parameters: {
      // 温度：0.7 是创作类任务常用值，平衡创造性和稳定性
      temperature: 0.7,
      // top_p: 0.8 配合 temperature 使用
      top_p: 0.8,
      // max_tokens: 预留足够空间生成 4 个模块
      max_tokens: 4000,
    },
  };

  try {
    const response = await axios.post(url, requestBody, {
      headers: {
        'Authorization': `Bearer ${CONFIG.API_KEY}`,
        'Content-Type': 'application/json',
        'X-DashScope-SSE': 'disable', // 关闭流式，使用同步响应
      },
      timeout: CONFIG.TIMEOUT_MS,
    });

    // 解析响应
    // 实际响应结构：{ output: { text: "..." }, usage: {...}, request_id: "..." }
    const text = response.data?.output?.text
      || response.data?.output?.result
      || response.data?.output?.finish_reason
      || '';

    if (!text) {
      throw createBailianError('EMPTY_RESPONSE', 'API 返回为空', response.data);
    }

    return text;
  } catch (err) {
    throw normalizeError(err);
  }
}

// ============================================================
// 渲染聚合 Prompt
// ============================================================

/**
 * 将用户输入注入到聚合 Prompt 模板
 * @param {Object} input
 * @returns {string} 完整的 system prompt
 */
function renderAggregatePrompt(input) {
  const template = PROMPTS.aggregate;
  if (!template) {
    // 兜底：内联 Prompt
    return `你是一个资深的黑客松路演教练。
基于用户输入生成项目结构、1 分钟路演稿、Demo 展示流程、评委问答 4 个模块的 Markdown 输出。`;
  }

  // 提取 System Prompt 部分（在 "---" 分割线之前）
  const parts = template.split('---');
  const systemPart = parts[0] || template;

  return systemPart;
}

// ============================================================
// 主入口：generatePitch
// ============================================================

/**
 * 生成路演包（主入口）
 *
 * 模式分发：
 * - MOCK_MODE=true：返回 Mock 数据
 * - MOCK_MODE=false：调用真实百炼 API
 *
 * @param {Object} input - 用户输入
 * @returns {Promise<string>} Markdown 格式路演包
 * @throws {Error} 业务异常（带 error.code）
 */
async function generatePitch(input) {
  if (CONFIG.MOCK_MODE) {
    console.log('[BailianService] Mock 模式，跳过真实 API');
    await simulateLatency(1200);
    return generateMockPitch(input);
  }

  console.log('[BailianService] 调用真实百炼 API');
  return await callBailianApplication(input);
}

// ============================================================
// 错误处理工具
// ============================================================

/**
 * 归一化错误为业务异常
 * @param {Error} err
 * @returns {Error}
 */
function normalizeError(err) {
  // axios 网络错误（无响应）
  if (err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT') {
    return createBailianError('TIMEOUT', 'API 服务响应超时', err.message);
  }
  if (!err.response) {
    return createBailianError('NETWORK_ERROR', '无法连接 API 服务', err.message);
  }

  // HTTP 错误
  const status = err.response.status;
  const data = err.response.data || {};

  if (status === 401 || status === 403) {
    return createBailianError('UNAUTHORIZED', 'API Key 无效或已过期', data);
  }
  if (status === 429) {
    return createBailianError('RATE_LIMITED', '请求过于频繁', data);
  }
  if (status === 503) {
    return createBailianError('SERVICE_UNAVAILABLE', 'API 服务繁忙', data);
  }
  if (status >= 500) {
    return createBailianError('SERVICE_UNAVAILABLE', `API 服务异常 (${status})`, data);
  }

  return createBailianError('INTERNAL_ERROR', '生成失败', data);
}

/**
 * 创建带错误码的业务异常
 * @param {string} code
 * @param {string} message
 * @param {*} detail
 * @returns {Error}
 */
function createBailianError(code, message, detail) {
  const err = new Error(message);
  err.code = code;
  err.detail = detail;
  return err;
}

// ============================================================
// 导出
// ============================================================

module.exports = {
  generatePitch,
  // 内部方法（便于测试）
  _internals: {
    callBailianApplication,
    renderAggregatePrompt,
    loadPrompt,
    normalizeError,
    CONFIG,
  },
};
