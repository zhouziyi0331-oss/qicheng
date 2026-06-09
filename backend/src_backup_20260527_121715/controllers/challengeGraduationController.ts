import { Request, Response } from 'express';
import { ChallengeService, GraduationService } from '../services/challengeGraduationService';

/**
 * 跳级挑战控制器
 */
export class ChallengeController {
  /**
   * 获取可用的挑战任务
   */
  static async getAvailableChallenges(req: Request, res: Response) {
    try {
      const studentId = req.user!.userId;
      const challenges = await ChallengeService.getAvailableChallenges(studentId);

      res.json({
        success: true,
        data: challenges
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * 开始挑战
   */
  static async startChallenge(req: Request, res: Response) {
    try {
      const studentId = req.user!.userId;
      const { challengeTaskId } = req.body;

      const challenge = await ChallengeService.startChallenge(studentId, challengeTaskId);

      res.json({
        success: true,
        message: '挑战已开始',
        data: challenge
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * 提交挑战作品
   */
  static async submitChallenge(req: Request, res: Response) {
    try {
      const studentId = req.user!.userId;
      const { challengeId } = req.params;
      const { submissionUrl, submissionContent } = req.body;

      const challenge = await ChallengeService.submitChallenge(
        parseInt(challengeId),
        studentId,
        submissionUrl,
        submissionContent
      );

      res.json({
        success: true,
        message: '作品已提交，等待评审',
        data: challenge
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * 评审挑战（管理员）
   */
  static async reviewChallenge(req: Request, res: Response) {
    try {
      const reviewerId = req.user!.userId;
      const { challengeId } = req.params;
      const { score, feedback } = req.body;

      const result = await ChallengeService.reviewChallenge(
        parseInt(challengeId),
        reviewerId,
        score,
        feedback
      );

      res.json({
        success: true,
        message: result.passed ? '挑战通过，学生已升级' : '挑战未通过',
        data: result
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * 获取挑战历史
   */
  static async getChallengeHistory(req: Request, res: Response) {
    try {
      const studentId = req.user!.userId;
      const history = await ChallengeService.getChallengeHistory(studentId);

      res.json({
        success: true,
        data: history
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
}

/**
 * 毕业系统控制器
 */
export class GraduationController {
  /**
   * 检查毕业资格
   */
  static async checkEligibility(req: Request, res: Response) {
    try {
      const studentId = req.user!.userId;
      const eligibility = await GraduationService.checkEligibility(studentId);

      res.json({
        success: true,
        data: eligibility
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * 提交毕业申请
   */
  static async applyForGraduation(req: Request, res: Response) {
    try {
      const studentId = req.user!.userId;
      const { portfolioUrl, selfIntroduction, careerGoals } = req.body;

      const application = await GraduationService.applyForGraduation(
        studentId,
        portfolioUrl,
        selfIntroduction,
        careerGoals
      );

      res.json({
        success: true,
        message: '毕业申请已提交',
        data: application
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * 审核毕业申请（管理员）
   */
  static async reviewGraduation(req: Request, res: Response) {
    try {
      const reviewerId = req.user!.userId;
      const { applicationId } = req.params;
      const { approved, feedback } = req.body;

      const result = await GraduationService.reviewGraduation(
        parseInt(applicationId),
        reviewerId,
        approved,
        feedback
      );

      res.json({
        success: true,
        message: result.approved ? '毕业申请已通过' : '毕业申请未通过',
        data: result
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * 获取毕业生权益
   */
  static async getGraduateBenefits(req: Request, res: Response) {
    try {
      const studentId = req.user!.userId;
      const benefits = await GraduationService.getGraduateBenefits(studentId);

      res.json({
        success: true,
        data: benefits
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * 获取毕业申请列表（管理员）
   */
  static async getApplications(req: Request, res: Response) {
    try {
      const { status } = req.query;
      const applications = await GraduationService.getApplications(status as string);

      res.json({
        success: true,
        data: applications
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
}
