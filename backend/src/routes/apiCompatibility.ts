/**
 * 前端API兼容层
 *
 * 问题：前端某些API调用使用了完整的 /api/v1/ 前缀路径
 * 解决：创建路由别名，将前端调用映射到实际的后端路由
 */

import { Router, Request, Response, NextFunction } from 'express';

const router = Router();

/**
 * 协议与授权API别名
 * 前端调用：/api/v1/agreement/*
 * 后端实际：/api/v1/agreement/* (已存在)
 */

// 获取生效中的协议（用于注册流程）
router.get('/agreement/active', (req: Request, res: Response, next: NextFunction) => {
  // 转发到实际路由
  req.url = '/agreements';
  next();
});

// 获取协议列表
router.get('/agreement/agreements', (req: Request, res: Response, next: NextFunction) => {
  req.url = '/agreements';
  next();
});

// 获取协议详情
router.get('/agreement/agreements/:agreementId', (req: Request, res: Response, next: NextFunction) => {
  req.url = `/agreements/${req.params.agreementId}`;
  next();
});

// 获取签署记录
router.get('/agreement/signatures', (req: Request, res: Response, next: NextFunction) => {
  req.url = '/agreements/signatures/history';
  next();
});

// 获取授权设置
router.get('/agreement/authorization-settings', (req: Request, res: Response, next: NextFunction) => {
  req.url = '/authorization/settings';
  next();
});

// 获取授权历史
router.get('/agreement/authorization-history', (req: Request, res: Response, next: NextFunction) => {
  req.url = '/authorization/history';
  next();
});

// 获取必读条款
router.get('/agreement/mandatory-terms', (req: Request, res: Response, next: NextFunction) => {
  req.url = '/terms/check/status';
  next();
});

// 签署协议
router.post('/agreement/sign', (req: Request, res: Response, next: NextFunction) => {
  req.url = '/agreements/sign';
  next();
});

// 更新授权
router.post('/agreement/authorization', (req: Request, res: Response, next: NextFunction) => {
  req.url = '/authorization/update';
  next();
});

// 确认必读条款
router.post('/agreement/mandatory-terms/confirm', (req: Request, res: Response, next: NextFunction) => {
  req.url = '/terms/confirm';
  next();
});

/**
 * 沟通中转API别名
 * 前端调用：/api/v1/communication/*
 * 后端实际：/api/v1/communication/* (已存在)
 */

// 获取补充说明列表
router.get('/communication/clarifications/:taskId', (req: Request, res: Response, next: NextFunction) => {
  req.url = `/clarifications/${req.params.taskId}`;
  next();
});

// 获取问题列表
router.get('/communication/questions/:taskId', (req: Request, res: Response, next: NextFunction) => {
  req.url = `/questions/${req.params.taskId}`;
  next();
});

// 获取中转消息
router.get('/communication/relay-messages/:taskId', (req: Request, res: Response, next: NextFunction) => {
  req.url = `/messages/${req.params.taskId}`;
  next();
});

// 获取未读消息数
router.get('/communication/unread-count/:taskId', (req: Request, res: Response, next: NextFunction) => {
  // 这个需要新实现
  res.json({ unreadCount: 0 });
});

// 添加补充说明
router.post('/communication/clarifications', (req: Request, res: Response, next: NextFunction) => {
  req.url = '/clarifications';
  next();
});

// 学生提问
router.post('/communication/questions', (req: Request, res: Response, next: NextFunction) => {
  req.url = '/questions';
  next();
});

// 企业回答问题
router.post('/communication/questions/:questionId/answer', (req: Request, res: Response, next: NextFunction) => {
  req.url = `/questions/${req.params.questionId}/answer`;
  next();
});

// 发送中转消息
router.post('/communication/relay-messages', (req: Request, res: Response, next: NextFunction) => {
  req.url = '/messages';
  next();
});

/**
 * 托管支付API别名
 * 前端调用：/api/v1/escrow/*
 * 后端实际：/api/v1/escrow/* (已存在)
 */

// 这些路由已经存在，不需要别名

/**
 * 社群与作品展示API别名
 * 前端调用：/api/v1/community-portfolio/*
 * 后端实际：/api/v1/community-portfolio/* (已存在)
 */

// 这些路由已经存在，不需要别名

/**
 * OPC成长报告API别名
 * 前端调用：/api/v1/opc-growth/*
 * 后端实际：/api/v1/opc-growth/* (已存在，但部分缺失)
 */

// 获取能力雷达图
router.get('/opc-growth/ability-radar', (req: Request, res: Response, next: NextFunction) => {
  // 转发到ability路由
  req.url = '/ability/radar';
  next();
});

// 获取成长轨迹
router.get('/opc-growth/trajectory', (req: Request, res: Response, next: NextFunction) => {
  // 转发到ability路由
  req.url = '/ability/timeline';
  next();
});

/**
 * 挑战与毕业API别名
 * 前端调用：/api/v1/challenge-graduation/*
 * 后端实际：/api/v1/challenge-graduation/* (已存在)
 */

// 这些路由已经存在，不需要别名

/**
 * AI引擎API别名
 * 前端调用：/api/v1/ai-engine/*
 * 后端实际：/api/v1/ai-engine/* (已存在，但路径不同)
 */

// 获取拆解结果
router.get('/ai-engine/decompose/:taskId', (req: Request, res: Response, next: NextFunction) => {
  req.url = `/decomposition/subtasks/${req.params.taskId}`;
  next();
});

// 获取问答历史
router.get('/ai-engine/qa/history', (req: Request, res: Response, next: NextFunction) => {
  // 需要新实现 - 暂时返回空数组
  res.json({ history: [] });
});

// 获取需求确认结果
router.get('/ai-engine/requirement/:sessionId/result', (req: Request, res: Response, next: NextFunction) => {
  req.url = `/requirement/history/${req.params.sessionId}`;
  next();
});

// 获取审核结果
router.get('/ai-engine/review/:reviewId', (req: Request, res: Response, next: NextFunction) => {
  // 需要查询数据库获取审核结果
  res.json({ reviewId: req.params.reviewId, status: 'pending' });
});

// 任务拆解
router.post('/ai-engine/decompose', (req: Request, res: Response, next: NextFunction) => {
  req.url = '/decomposition/decompose';
  next();
});

// AI问答
router.post('/ai-engine/qa', (req: Request, res: Response, next: NextFunction) => {
  req.url = '/qa/ask';
  next();
});

// 继续需求对话
router.post('/ai-engine/requirement/continue', (req: Request, res: Response, next: NextFunction) => {
  req.url = '/requirement/message';
  next();
});

// 开始需求对话
router.post('/ai-engine/requirement/start', (req: Request, res: Response, next: NextFunction) => {
  req.url = '/requirement/start';
  next();
});

// 提交作品审核
router.post('/ai-engine/review/submit', (req: Request, res: Response, next: NextFunction) => {
  req.url = '/review/task';
  next();
});

export default router;
