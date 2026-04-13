import { Request, Response } from 'express';
import { AgreementService, DataAuthorizationService, MandatoryTermsService } from '../services/agreementService';

/**
 * 协议管理控制器
 */
export class AgreementController {
  /**
   * 获取所有有效协议
   */
  static async getActiveAgreements(req: Request, res: Response) {
    try {
      const agreements = await AgreementService.getActiveAgreements();
      res.json({ success: true, data: agreements });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * 获取特定类型的协议
   */
  static async getAgreementByType(req: Request, res: Response) {
    try {
      const { type } = req.params;
      const agreement = await AgreementService.getAgreementByType(type);

      if (!agreement) {
        return res.status(404).json({ success: false, message: '协议不存在' });
      }

      res.json({ success: true, data: agreement });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * 签署协议
   */
  static async signAgreement(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const { agreementId } = req.body;
      const ipAddress = req.ip;
      const deviceInfo = req.headers['user-agent'];

      const signature = await AgreementService.signAgreement(
        userId,
        agreementId,
        ipAddress,
        deviceInfo
      );

      res.json({ success: true, data: signature, message: '协议签署成功' });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  /**
   * 检查用户协议签署状态
   */
  static async checkUserAgreements(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const status = await AgreementService.checkUserAgreements(userId);
      res.json({ success: true, data: status });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * 获取用户的协议签署历史
   */
  static async getUserSignatures(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const signatures = await AgreementService.getUserSignatures(userId);
      res.json({ success: true, data: signatures });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

/**
 * 数据授权控制器
 */
export class DataAuthorizationController {
  /**
   * 获取用户授权设置
   */
  static async getAuthorizationSettings(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const settings = await DataAuthorizationService.getAuthorizationSettings(userId);

      if (!settings) {
        // 如果不存在，初始化
        const newSettings = await DataAuthorizationService.initializeAuthorization(userId);
        return res.json({ success: true, data: newSettings });
      }

      res.json({ success: true, data: settings });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * 更新单个授权设置
   */
  static async updateAuthorization(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const { authorizationType, authorized, changeReason } = req.body;
      const ipAddress = req.ip;

      const validTypes = [
        'commercial_use_authorized',
        'marketing_authorized',
        'third_party_share_authorized',
        'ai_training_authorized'
      ];

      if (!validTypes.includes(authorizationType)) {
        return res.status(400).json({ success: false, message: '无效的授权类型' });
      }

      const settings = await DataAuthorizationService.updateCommercialAuthorization(
        userId,
        authorizationType,
        authorized,
        changeReason,
        ipAddress
      );

      res.json({ success: true, data: settings, message: '授权设置已更新' });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  /**
   * 批量更新授权设置
   */
  static async batchUpdateAuthorizations(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const { authorizations } = req.body;
      const ipAddress = req.ip;

      const settings = await DataAuthorizationService.batchUpdateAuthorizations(
        userId,
        authorizations,
        ipAddress
      );

      res.json({ success: true, data: settings, message: '授权设置已更新' });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  /**
   * 获取授权变更历史
   */
  static async getAuthorizationHistory(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const history = await DataAuthorizationService.getAuthorizationHistory(userId);
      res.json({ success: true, data: history });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

/**
 * 必读条款控制器
 */
export class MandatoryTermsController {
  /**
   * 确认必读条款
   */
  static async confirmTerm(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const { termType } = req.body;
      const ipAddress = req.ip;

      const validTerms = ['age_confirmation', 'real_name_commitment', 'data_usage_notice'];

      if (!validTerms.includes(termType)) {
        return res.status(400).json({ success: false, message: '无效的条款类型' });
      }

      const confirmation = await MandatoryTermsService.confirmTerm(userId, termType, ipAddress);
      res.json({ success: true, data: confirmation, message: '条款确认成功' });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  /**
   * 检查用户条款确认状态
   */
  static async checkUserTerms(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const status = await MandatoryTermsService.checkUserTerms(userId);
      res.json({ success: true, data: status });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * 获取用户的条款确认记录
   */
  static async getUserTerms(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const terms = await MandatoryTermsService.getUserTerms(userId);
      res.json({ success: true, data: terms });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}
