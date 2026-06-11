/**
 * @fileoverview 路演包生成路由
 * @description 处理 POST /api/generate 请求
 * @author PitchForge Team
 * @version 1.0.0
 * @created 2026-06-11
 * @lastModified 2026-06-11
 * @lastModifiedBy AI Assistant
 *
 * 路由职责（单一职责）：
 * 1. HTTP 层：参数解析、状态码、响应格式
 * 2. 输入校验（第二层防护，配合前端校验）
 * 3. 调用 service 层
 * 4. 错误转换：service 错误 → HTTP 响应
 *
 * 不负责：
 * - 业务逻辑（交给 service）
 * - 数据库操作（暂不需要）
 */

'use strict';

const express = require('express');
const router = express.Router();
const bailianService = require('../services/bailianService');

// ============================================================
// 配置
// ============================================================

const VALIDATION = {
  MAX_IDEA_LENGTH: 2000,
  MAX_USER_LENGTH: 100,
  MAX_HIGHLIGHT_LENGTH: 200,
  VALID_PROGRESS: ['', 'idea', '原型', 'Demo', '已上线'],
  VALID_DURATION: ['', '30 秒', '1 分钟', '3 分钟'],
};

// ============================================================
// 输入校验
// ============================================================

/**
 * 校验用户输入（第二层防护，前端已做第一层）
 *
 * 设计原则：
 * - 永远不信任前端，必须独立校验
 * - 错误信息对用户友好（不是堆栈）
 * - 校验失败立即返回，不调用下游
 *
 * @param {Object} input
 * @returns {{valid: boolean, error?: {code: string, message: string}}}
 */
function validateInput(input) {
  if (!input || typeof input !== 'object') {
    return { valid: false, error: { code: 'INVALID_INPUT', message: '请求体格式错误' } };
  }

  const { project_idea, target_user, progress, pitch_duration, highlight } = input;

  // 必填：项目想法
  if (!project_idea || typeof project_idea !== 'string' || !project_idea.trim()) {
    return { valid: false, error: { code: 'INVALID_INPUT', message: '项目想法不能为空' } };
  }

  if (project_idea.length > VALIDATION.MAX_IDEA_LENGTH) {
    return {
      valid: false,
      error: {
        code: 'INVALID_INPUT',
        message: `项目想法不能超过 ${VALIDATION.MAX_IDEA_LENGTH} 字`,
      },
    };
  }

  // 选填：目标用户
  if (target_user !== undefined && target_user !== null && target_user !== '') {
    if (typeof target_user !== 'string') {
      return { valid: false, error: { code: 'INVALID_INPUT', message: '目标用户格式错误' } };
    }
    if (target_user.length > VALIDATION.MAX_USER_LENGTH) {
      return {
        valid: false,
        error: { code: 'INVALID_INPUT', message: `目标用户不能超过 ${VALIDATION.MAX_USER_LENGTH} 字` },
      };
    }
  }

  // 选填：当前进度
  if (progress !== undefined && progress !== null && progress !== '') {
    if (!VALIDATION.VALID_PROGRESS.includes(progress)) {
      return {
        valid: false,
        error: { code: 'INVALID_INPUT', message: `当前进度值无效，应为 ${VALIDATION.VALID_PROGRESS.filter(Boolean).join('/')}` },
      };
    }
  }

  // 选填：路演时长
  if (pitch_duration !== undefined && pitch_duration !== null && pitch_duration !== '') {
    if (!VALIDATION.VALID_DURATION.includes(pitch_duration)) {
      return {
        valid: false,
        error: { code: 'INVALID_INPUT', message: `路演时长无效，应为 ${VALIDATION.VALID_DURATION.filter(Boolean).join('/')}` },
      };
    }
  }

  // 选填：亮点
  if (highlight !== undefined && highlight !== null && highlight !== '') {
    if (typeof highlight !== 'string') {
      return { valid: false, error: { code: 'INVALID_INPUT', message: '亮点格式错误' } };
    }
    if (highlight.length > VALIDATION.MAX_HIGHLIGHT_LENGTH) {
      return {
        valid: false,
        error: { code: 'INVALID_INPUT', message: `亮点不能超过 ${VALIDATION.MAX_HIGHLIGHT_LENGTH} 字` },
      };
    }
  }

  return { valid: true };
}

// ============================================================
// 路由处理
// ============================================================

/**
 * POST /api/generate
 * 生成路演包
 *
 * 请求体：
 * {
 *   "project_idea": "必填，<2000字",
 *   "target_user": "选填，<100字",
 *   "progress": "选填",
 *   "pitch_duration": "选填",
 *   "highlight": "选填，<200字"
 * }
 *
 * 响应（成功）：
 * {
 *   "success": true,
 *   "data": { "result": "<Markdown>" },
 *   "message": "生成成功"
 * }
 *
 * 响应（失败）：
 * {
 *   "success": false,
 *   "error": { "code": "INVALID_INPUT", "message": "..." }
 * }
 */
router.post('/', async (req, res) => {
  const startTime = Date.now();

  // 1. 输入校验
  const validation = validateInput(req.body);
  if (!validation.valid) {
    return res.status(400).json({
      success: false,
      error: validation.error,
      timestamp: new Date().toISOString(),
    });
  }

  // 2. 调用 service 层
  try {
    const result = await bailianService.generatePitch(req.body);
    const duration = Date.now() - startTime;

    console.log(`[generate] 成功，耗时 ${duration}ms`);

    return res.json({
      success: true,
      data: { result },
      message: '生成成功',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    const duration = Date.now() - startTime;
    console.error(`[generate] 失败，耗时 ${duration}ms:`, err.message);

    // 错误码 → HTTP 状态码映射
    const statusCode = mapErrorCodeToStatus(err.code);
    return res.status(statusCode).json({
      success: false,
      error: {
        code: err.code || 'INTERNAL_ERROR',
        message: err.message || '生成失败，请稍后重试',
        // 调试模式下可以返回 detail
        ...(process.env.NODE_ENV === 'development' && { detail: err.detail }),
      },
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * 业务错误码 → HTTP 状态码
 */
function mapErrorCodeToStatus(code) {
  const map = {
    INVALID_INPUT: 400,
    UNAUTHORIZED: 401,
    RATE_LIMITED: 429,
    TIMEOUT: 504,
    NETWORK_ERROR: 502,
    SERVICE_UNAVAILABLE: 503,
    INTERNAL_ERROR: 500,
  };
  return map[code] || 500;
}

// ============================================================
// 导出
// ============================================================

module.exports = router;
