import { Request, Response, NextFunction } from 'express';
import jumpTestService from '../../services/jumpTestService';
import { AppError } from '../../middleware/errorHandler';
import logger from '../../utils/logger';

/**
 * 跳级测试控制器
 */

// GET /api/v1/students/jump-eligibility - 检查跳级资格
export async function checkJumpEligibility(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const studentId = req.user!.userId;

    const eligibility = await jumpTestService.checkJumpEligibility(studentId);

    res.json({
      success: true,
      data: eligibility,
    });
  } catch (err: unknown) {
    next(err);
  }
}

// POST /api/v1/students/apply-jump - 申请跳级
export async function applyForJumpTest(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const studentId = req.user!.userId;

    const result = await jumpTestService.applyForJumpTest(studentId);

    // 推送测试任务
    const orderId = await jumpTestService.pushJumpTestTask(
      studentId,
      result.jumpRecordId,
      result.testTask
    );

    res.json({
      success: true,
      message: '跳级申请成功，测试任务已推送',
      data: {
        jumpRecordId: result.jumpRecordId,
        orderId,
        testTask: result.testTask,
      },
    });
  } catch (err: unknown) {
    next(err);
  }
}

// POST /api/v1/students/submit-jump-test - 提交跳级测试
export async function submitJumpTest(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const studentId = req.user!.userId;
    const { orderId, submissionContent, fileUrls } = req.body;

    if (!orderId || !submissionContent) {
      throw new AppError(400, '订单ID和提交内容为必填项', 'MISSING_FIELDS');
    }

    // 验证订单归属
    const { query } = require('../../utils/db');
    const order = await query(
      `SELECT id FROM orders WHERE id = $1 AND student_id = $2 AND order_type = 'jump_test'`,
      [orderId, studentId]
    );

    if (order.rows.length === 0) {
      throw new AppError(403, '无权操作此订单', 'FORBIDDEN');
    }

    // 审核跳级测试
    const reviewResult = await jumpTestService.reviewJumpTest(
      orderId,
      submissionContent,
      fileUrls || []
    );

    res.json({
      success: true,
      message: reviewResult.passed ? '恭喜！跳级测试通过' : '跳级测试未通过',
      data: reviewResult,
    });
  } catch (err: unknown) {
    next(err);
  }
}

// GET /api/v1/students/jump-history - 获取跳级历史
export async function getJumpHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const studentId = req.user!.userId;

    const { query } = require('../../utils/db');
    const history = await query(
      `SELECT
        jtr.*,
        o.created_at as order_created_at,
        o.status as order_status
       FROM jump_test_records jtr
       LEFT JOIN orders o ON jtr.test_order_id = o.id
       WHERE jtr.student_id = $1
       ORDER BY jtr.applied_at DESC`,
      [studentId]
    );

    res.json({
      success: true,
      data: history.rows,
    });
  } catch (err: unknown) {
    next(err);
  }
}
