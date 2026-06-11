/**
 * @fileoverview PitchForge 前端 API 调用模块
 * @description 封装与后端的 HTTP 通信，统一错误处理与超时控制
 * @author PitchForge Team
 * @version 1.0.0
 * @created 2026-06-11
 * @lastModified 2026-06-11
 * @lastModifiedBy AI Assistant
 *
 * 架构说明：
 * - 单一职责：仅负责 HTTP 通信
 * - 不持有 UI 状态（避免和 app.js 耦合）
 * - 统一返回 {success, data, error} 格式
 */

(function (global) {
  'use strict';

  /**
   * API 调用配置
   * 超时设 60 秒：工作流平均响应 15-25 秒，留 2-3 倍余量
   */
  const CONFIG = {
    ENDPOINT: '/api/generate',
    TIMEOUT_MS: 60000,
  };

  /**
   * 发起路演包生成请求
   *
   * @param {Object} input - 用户输入
   * @param {string} input.project_idea - 项目想法（必填）
   * @param {string} [input.target_user] - 目标用户
   * @param {string} [input.progress] - 当前进度
   * @param {string} [input.pitch_duration] - 路演时长
   * @param {string} [input.highlight] - 想突出的亮点
   * @param {AbortSignal} [signal] - 用于取消请求的信号
   * @returns {Promise<{success: boolean, data?: Object, error?: Object}>}
   */
  async function generatePitch(input, signal) {
    // 基础校验（前端第一层防护，见规范文档 7.1）
    if (!input || !input.project_idea || !input.project_idea.trim()) {
      return {
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: '请先输入项目想法',
        },
      };
    }

    if (input.project_idea.length > 2000) {
      return {
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: '项目想法不能超过 2000 字',
        },
      };
    }

    // 合并超时信号
    const timeoutController = new AbortController();
    const timeoutId = setTimeout(() => timeoutController.abort(), CONFIG.TIMEOUT_MS);

    if (signal) {
      signal.addEventListener('abort', () => timeoutController.abort());
    }

    try {
      const response = await fetch(CONFIG.ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
        signal: timeoutController.signal,
      });

      clearTimeout(timeoutId);

      // HTTP 层错误
      if (!response.ok) {
        let errorBody = {};
        try {
          errorBody = await response.json();
        } catch (e) {
          // 响应不是 JSON
        }

        return {
          success: false,
          error: {
            code: errorBody.error?.code || mapHttpStatusToCode(response.status),
            message: errorBody.error?.message || `HTTP ${response.status}`,
            status: response.status,
          },
        };
      }

      // 业务层响应
      const body = await response.json();
      if (!body.success) {
        return {
          success: false,
          error: body.error || { code: 'UNKNOWN', message: '生成失败' },
        };
      }

      return {
        success: true,
        data: body.data,
      };
    } catch (err) {
      clearTimeout(timeoutId);

      if (err.name === 'AbortError') {
        return {
          success: false,
          error: {
            code: 'TIMEOUT',
            message: '请求超时，请稍后重试',
          },
        };
      }

      // 网络错误（离线、DNS 失败等）
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: err.message || '网络异常',
        },
      };
    }
  }

  /**
   * HTTP 状态码 → 业务错误码映射
   * @param {number} status
   * @returns {string}
   */
  function mapHttpStatusToCode(status) {
    if (status === 400) return 'INVALID_INPUT';
    if (status === 401 || status === 403) return 'UNAUTHORIZED';
    if (status === 429) return 'RATE_LIMITED';
    if (status === 502) return 'BAD_GATEWAY';
    if (status === 503) return 'SERVICE_UNAVAILABLE';
    if (status === 504) return 'GATEWAY_TIMEOUT';
    return 'INTERNAL_ERROR';
  }

  // ============================================================
  // 暴露到全局
  // ============================================================

  global.PitchForgeAPI = {
    generatePitch,
  };
})(window);
