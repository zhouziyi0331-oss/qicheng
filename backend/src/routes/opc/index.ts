/**
 * OPC能力画像测试系统
 * GET  /student/test/result    — 获取学生测试结果
 * GET  /opc/report/:userId     — 获取用户详细报告
 * GET  /opc/questions          — 获取测试题目
 * POST /opc/submit             — 提交测试答案
 */
import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import * as controller from './controller';

const router = Router();

// 学生获取自己的测试结果
router.get('/student/test/result', authenticate, controller.getTestResult);

// 获取用户详细报告（需要权限验证）
router.get('/opc/report/:userId', authenticate, controller.getOpcReport);

// 获取测试题目
router.get('/opc/questions', authenticate, controller.getTestQuestions);

// 提交测试答案
router.post('/opc/submit', authenticate, controller.submitTest);

export default router;
