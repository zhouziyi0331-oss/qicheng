import { Request, Response } from 'express';
import { OPCAssessmentService, GrowthReportService } from '../services/opcGrowthService';

export class OPCGrowthController {
  static async startAssessment(req: Request, res: Response) {
    try {
      const studentId = req.user!.userId;
      const { assessmentType } = req.body;
      const result = await OPCAssessmentService.startAssessment(studentId, assessmentType);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async submitAnswer(req: Request, res: Response) {
    try {
      const { assessmentId, questionId, answer } = req.body;
      await OPCAssessmentService.submitAnswer(assessmentId, questionId, answer);
      res.json({ success: true, message: '答案已提交' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async completeAssessment(req: Request, res: Response) {
    try {
      const { assessmentId } = req.params;
      const result = await OPCAssessmentService.completeAssessment(parseInt(assessmentId));
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getAssessmentResult(req: Request, res: Response) {
    try {
      const { assessmentId } = req.params;
      const result = await OPCAssessmentService.getAssessmentResult(parseInt(assessmentId));
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async generateGrowthReport(req: Request, res: Response) {
    try {
      const studentId = req.user!.userId;
      const { reportPeriod, periodStart, periodEnd } = req.body;
      const result = await GrowthReportService.generateReport(
        studentId,
        reportPeriod,
        new Date(periodStart),
        new Date(periodEnd)
      );
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async createAbilitySnapshot(req: Request, res: Response) {
    try {
      const studentId = req.user!.userId;
      await GrowthReportService.createAbilitySnapshot(studentId);
      res.json({ success: true, message: '快照已创建' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}
