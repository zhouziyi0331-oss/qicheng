// 启程小猫 - 增强版AI导师路由

import express from 'express';
import { authenticate } from '../../middleware/auth';
import {
  initiateRequirementConfirmation,
  analyzeStudentUnderstanding,
  provideInspirationalGuidance,
  celebrateProgressAndGuideNext,
  reviewSubmission,
  translateCompanyFeedback,
  translateStudentQuestion
} from './enhanced-controller';

const router = express.Router();

// ══════════════════════════════════════════════════════════════
// 阶段1：需求理解与确认
// ══════════════════════════════════════════════════════════════

// 任务匹配后，发起需求确认对话
router.post('/tasks/:taskId/requirement-confirmation/start', authenticate, initiateRequirementConfirmation);

// 分析学生对需求的理解
router.post('/tasks/:taskId/requirement-confirmation/analyze', authenticate, analyzeStudentUnderstanding);

// ══════════════════════════════════════════════════════════════
// 阶段2：执行引导（启发式教学）
// ══════════════════════════════════════════════════════════════

// 学生求助时的启发式引导
router.post('/tasks/:taskId/guidance/help', authenticate, provideInspirationalGuidance);

// 学生完成步骤后的鼓励
router.post('/tasks/:taskId/guidance/celebrate', authenticate, celebrateProgressAndGuideNext);

// ══════════════════════════════════════════════════════════════
// 阶段3：质量审核
// ══════════════════════════════════════════════════════════════

// AI审核学生提交的作品
router.post('/tasks/:taskId/review/submission', authenticate, reviewSubmission);

// ══════════════════════════════════════════════════════════════
// 阶段4：沟通桥梁
// ══════════════════════════════════════════════════════════════

// 翻译企业反馈给学生
router.post('/tasks/:taskId/translate/company-feedback', authenticate, translateCompanyFeedback);

// 翻译学生疑问给企业
router.post('/tasks/:taskId/translate/student-question', authenticate, translateStudentQuestion);

export default router;
