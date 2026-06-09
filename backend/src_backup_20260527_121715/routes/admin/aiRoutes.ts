import { Router } from 'express';
import {
  getAICallLogs,
  getAICallStats,
  getPromptTemplates,
  createPromptTemplate,
  updatePromptTemplate,
  deletePromptTemplate
} from './aiController';

const router = Router();

// AI调用日志
router.get('/logs', getAICallLogs);

// AI调用统计
router.get('/stats', getAICallStats);

// Prompt模板列表
router.get('/prompts', getPromptTemplates);

// 创建Prompt模板
router.post('/prompts', createPromptTemplate);

// 更新Prompt模板
router.put('/prompts/:id', updatePromptTemplate);

// 删除Prompt模板
router.delete('/prompts/:id', deletePromptTemplate);

export default router;
