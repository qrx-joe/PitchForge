/**
 * @fileoverview PitchForge 后端服务入口
 * @description Express 应用初始化、中间件配置、路由注册、启动
 * @author PitchForge Team
 * @version 1.0.0
 * @created 2026-06-11
 * @lastModified 2026-06-11
 * @lastModifiedBy AI Assistant
 *
 * 启动方式：
 * - npm start       （真实 API 模式）
 * - npm run mock    （Mock 模式，无需 API Key）
 * - npm run dev     （热重载，需要 node 18+）
 */

'use strict';

// ============================================================
// 加载环境变量（必须在最顶部）
// ============================================================

require('dotenv').config({ path: __dirname + '/.env' });

// ============================================================
// 依赖引入
// ============================================================

const express = require('express');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');

const generateRouter = require('./routes/generate');

// ============================================================
// 应用初始化
// ============================================================

const app = express();
const PORT = process.env.PORT || 3000;
const MOCK_MODE = process.env.MOCK_MODE === 'true';

// ============================================================
// 中间件
// ============================================================

// 1. CORS（开发环境需要跨域，生产环境同源可移除）
app.use(cors({
  origin: MOCK_MODE ? '*' : true,
  methods: ['GET', 'POST'],
}));

// 2. Body 解析
app.use(express.json({ limit: '10kb' })); // 限制请求体大小，防止恶意请求
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// 3. 请求日志（轻量级，生产可替换为 morgan/pino）
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const color = res.statusCode >= 400 ? '\x1b[31m' : '\x1b[32m';
    console.log(
      `${color}${res.statusCode}\x1b[0m ${req.method} ${req.path} - ${duration}ms`
    );
  });
  next();
});

// 4. 限流（防滥用，仅对 API 路由生效）
const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 默认 15 分钟
  max: parseInt(process.env.RATE_LIMIT_MAX || '30', 10), // 默认 30 次
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: '请求过于频繁，请稍后再试',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', apiLimiter);

// ============================================================
// 路由
// ============================================================

// API 路由
app.use('/api/generate', generateRouter);

// 健康检查（用于部署平台探活）
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      mode: MOCK_MODE ? 'mock' : 'live',
      timestamp: new Date().toISOString(),
    },
  });
});

// 静态文件（前端）
const frontendPath = path.join(__dirname, '..', 'frontend');
app.use(express.static(frontendPath));

// SPA fallback：所有非 API 路径返回 index.html
app.get(/^\/(?!api\/).*/, (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// ============================================================
// 错误处理
// ============================================================

// 404 处理（仅 API 路径）
app.use('/api/', (req, res) => {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: 'API 路径不存在' },
    timestamp: new Date().toISOString(),
  });
});

// 全局错误处理（兜底）
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('[Server] 未捕获错误:', err);
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: '服务器内部错误',
      // 调试模式下返回堆栈
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
    timestamp: new Date().toISOString(),
  });
});

// ============================================================
// 启动
// ============================================================

app.listen(PORT, () => {
  const mode = MOCK_MODE ? '🎭 Mock' : '🚀 Live';
  console.log('\n========================================');
  console.log(`${mode} 模式启动`);
  console.log(`服务地址: http://localhost:${PORT}`);
  console.log(`API 健康检查: http://localhost:${PORT}/api/health`);
  console.log(`API 文档: POST http://localhost:${PORT}/api/generate`);
  console.log('========================================\n');
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('\n[Server] 收到 SIGTERM 信号，正在关闭...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n[Server] 收到 SIGINT 信号，正在关闭...');
  process.exit(0);
});

module.exports = app;
