import { Request, Response } from 'express';
import { OPCV2AssessmentService } from '../services/opcV2AssessmentService';

/**
 * OPC能力画像测试控制器 v2.0
 */
export class OPCV2AssessmentController {
  /**
   * 开始测试
   */
  static async startAssessment(req: Request, res: Response) {
    try {
      const studentId = req.user!.userId;
      const result = await OPCV2AssessmentService.startAssessment(studentId);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * 提交答案
   */
  static async submitAnswer(req: Request, res: Response) {
    try {
      const { assessmentId, questionId, answer } = req.body;
      await OPCV2AssessmentService.submitAnswer(assessmentId, questionId, answer);
      res.json({ success: true, message: '答案已提交' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * 完成测试
   */
  static async completeAssessment(req: Request, res: Response) {
    try {
      const { assessmentId } = req.params;
      const result = await OPCV2AssessmentService.completeAssessment(assessmentId);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * 获取测试进度
   */
  static async getProgress(req: Request, res: Response) {
    try {
      const { assessmentId } = req.params;
      const result = await OPCV2AssessmentService.getAssessmentProgress(assessmentId);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * 获取测试结果
   */
  static async getAssessmentResult(req: Request, res: Response) {
    try {
      const { assessmentId } = req.params;
      const result = await OPCV2AssessmentService.getAssessmentResult(assessmentId);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * 获取最新测试结果
   */
  static async getLatestResult(req: Request, res: Response) {
    try {
      const studentId = req.user!.userId;
      const result = await OPCV2AssessmentService.getLatestResult(studentId);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}
