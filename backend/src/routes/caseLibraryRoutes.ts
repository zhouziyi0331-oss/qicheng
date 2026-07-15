/**
 * Phase 2.4: 案例库路由
 */

import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import caseLibraryService from '../services/caseLibraryService';
import logger from '../utils/logger';

const router = Router();

/**
 * 搜索案例
 * GET /api/v1/case-library/search
 * Query params: caseType, category, difficulty, tags[], search, limit, offset
 */
router.get(
  '/search',
  authenticate,
  requireRole('student'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {
        caseType,
        category,
        difficulty,
        tags,
        search,
        limit,
        offset
      } = req.query;

      logger.info('[CaseLibrary] 搜索案例', {
        userId: req.user!.userId,
        caseType,
        category,
        difficulty,
        search
      });

      const filter = {
        caseType: caseType as 'stuck' | 'breakthrough' | 'success' | undefined,
        category: category as string | undefined,
        difficulty: difficulty ? parseInt(difficulty as string) : undefined,
        tags: tags ? (Array.isArray(tags) ? tags as string[] : [tags as string]) : undefined,
        search: search as string | undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined
      };

      const result = await caseLibraryService.searchCases(filter);

      res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      logger.error('[CaseLibrary] 搜索案例失败:', error);
      next(error);
    }
  }
);

/**
 * 获取案例详情
 * GET /api/v1/case-library/cases/:caseId
 */
router.get(
  '/cases/:caseId',
  authenticate,
  requireRole('student'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { caseId } = req.params;

      logger.info('[CaseLibrary] 获取案例详情', {
        userId: req.user!.userId,
        caseId
      });

      const caseData = await caseLibraryService.getCaseById(caseId);

      if (!caseData) {
        return res.status(404).json({
          success: false,
          message: '案例不存在'
        });
      }

      res.json({
        success: true,
        data: caseData
      });
    } catch (error: any) {
      logger.error('[CaseLibrary] 获取案例详情失败:', error);
      next(error);
    }
  }
);

/**
 * 标记案例为有帮助
 * POST /api/v1/case-library/cases/:caseId/helpful
 */
router.post(
  '/cases/:caseId/helpful',
  authenticate,
  requireRole('student'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { caseId } = req.params;
      const userId = req.user!.userId;

      logger.info('[CaseLibrary] 标记案例有帮助', { userId, caseId });

      const success = await caseLibraryService.markCaseHelpful(caseId, userId);

      res.json({
        success,
        message: success ? '标记成功' : '已经标记过了'
      });
    } catch (error: any) {
      logger.error('[CaseLibrary] 标记案例有帮助失败:', error);
      next(error);
    }
  }
);

/**
 * 获取案例统计
 * GET /api/v1/case-library/stats
 */
router.get(
  '/stats',
  authenticate,
  requireRole('student'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      logger.info('[CaseLibrary] 获取案例统计', { userId: req.user!.userId });

      const stats = await caseLibraryService.getCaseStats();

      res.json({
        success: true,
        data: stats
      });
    } catch (error: any) {
      logger.error('[CaseLibrary] 获取案例统计失败:', error);
      next(error);
    }
  }
);

/**
 * 提取案例（管理员功能）
 * POST /api/v1/case-library/extract
 */
router.post(
  '/extract',
  authenticate,
  requireRole('admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      logger.info('[CaseLibrary] 开始提取案例', { userId: req.user!.userId });

      const extractedCount = await caseLibraryService.extractCasesFromObservations();

      res.json({
        success: true,
        data: { extractedCount },
        message: `成功提取 ${extractedCount} 个案例`
      });
    } catch (error: any) {
      logger.error('[CaseLibrary] 提取案例失败:', error);
      next(error);
    }
  }
);

export default router;
