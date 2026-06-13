/**
 * 学生增强档案API路由 - E-05功能
 * 提供投资简报式的学生信息展示
 */

import { Router, Request, Response } from 'express';
import { authenticate, requireRole } from '../../middleware/auth';
import studentProfileEnhancer from '../../services/studentProfileEnhancer';
import logger from '../../utils/logger';

const router = Router();

/**
 * GET /api/students/:studentId/enhanced-profile
 * 获取学生的增强档案（投资简报式）
 */
router.get('/:studentId/enhanced-profile', authenticate, async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;

    const profile = await studentProfileEnhancer.generateEnhancedProfile(studentId);

    res.json({
      success: true,
      data: profile,
    });
  } catch (error) {
    logger.error('Error getting enhanced profile:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get enhanced profile',
    });
  }
});

/**
 * POST /api/students/batch-enhanced-profiles
 * 批量获取学生增强档案
 */
router.post('/batch-enhanced-profiles', authenticate, requireRole('company'), async (req: Request, res: Response) => {
  try {
    const { studentIds } = req.body;

    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'studentIds must be a non-empty array',
      });
    }

    if (studentIds.length > 20) {
      return res.status(400).json({
        success: false,
        error: 'Maximum 20 students per batch',
      });
    }

    const profiles = await studentProfileEnhancer.batchGenerateProfiles(studentIds);

    // 转换为数组
    const profilesArray = Array.from(profiles.values());

    res.json({
      success: true,
      data: {
        profiles: profilesArray,
        total: profilesArray.length,
      },
    });
  } catch (error) {
    logger.error('Error getting batch enhanced profiles:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get batch profiles',
    });
  }
});

export default router;
