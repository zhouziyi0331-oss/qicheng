"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MandatoryTermsController = exports.DataAuthorizationController = exports.AgreementController = void 0;
const agreementService_1 = require("../services/agreementService");
/**
 * 协议管理控制器
 */
class AgreementController {
    /**
     * 获取所有有效协议
     */
    static async getActiveAgreements(req, res) {
        try {
            const agreements = await agreementService_1.AgreementService.getActiveAgreements();
            res.json({ success: true, data: agreements });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    /**
     * 获取特定类型的协议
     */
    static async getAgreementByType(req, res) {
        try {
            const { type } = req.params;
            const agreement = await agreementService_1.AgreementService.getAgreementByType(type);
            if (!agreement) {
                return res.status(404).json({ success: false, message: '协议不存在' });
            }
            res.json({ success: true, data: agreement });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    /**
     * 签署协议
     */
    static async signAgreement(req, res) {
        try {
            const userId = req.user.userId;
            const { agreementId } = req.body;
            const ipAddress = req.ip;
            const deviceInfo = req.headers['user-agent'];
            const signature = await agreementService_1.AgreementService.signAgreement(userId, agreementId, ipAddress, deviceInfo);
            res.json({ success: true, data: signature, message: '协议签署成功' });
        }
        catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
    /**
     * 检查用户协议签署状态
     */
    static async checkUserAgreements(req, res) {
        try {
            const userId = req.user.userId;
            const status = await agreementService_1.AgreementService.checkUserAgreements(userId);
            res.json({ success: true, data: status });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    /**
     * 获取用户的协议签署历史
     */
    static async getUserSignatures(req, res) {
        try {
            const userId = req.user.userId;
            const signatures = await agreementService_1.AgreementService.getUserSignatures(userId);
            res.json({ success: true, data: signatures });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}
exports.AgreementController = AgreementController;
/**
 * 数据授权控制器
 */
class DataAuthorizationController {
    /**
     * 获取用户授权设置
     */
    static async getAuthorizationSettings(req, res) {
        try {
            const userId = req.user.userId;
            const settings = await agreementService_1.DataAuthorizationService.getAuthorizationSettings(userId);
            if (!settings) {
                // 如果不存在，初始化
                const newSettings = await agreementService_1.DataAuthorizationService.initializeAuthorization(userId);
                return res.json({ success: true, data: newSettings });
            }
            res.json({ success: true, data: settings });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    /**
     * 更新单个授权设置
     */
    static async updateAuthorization(req, res) {
        try {
            const userId = req.user.userId;
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
            const settings = await agreementService_1.DataAuthorizationService.updateCommercialAuthorization(userId, authorizationType, authorized, changeReason, ipAddress);
            res.json({ success: true, data: settings, message: '授权设置已更新' });
        }
        catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
    /**
     * 批量更新授权设置
     */
    static async batchUpdateAuthorizations(req, res) {
        try {
            const userId = req.user.userId;
            const { authorizations } = req.body;
            const ipAddress = req.ip;
            const settings = await agreementService_1.DataAuthorizationService.batchUpdateAuthorizations(userId, authorizations, ipAddress);
            res.json({ success: true, data: settings, message: '授权设置已更新' });
        }
        catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
    /**
     * 获取授权变更历史
     */
    static async getAuthorizationHistory(req, res) {
        try {
            const userId = req.user.userId;
            const history = await agreementService_1.DataAuthorizationService.getAuthorizationHistory(userId);
            res.json({ success: true, data: history });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}
exports.DataAuthorizationController = DataAuthorizationController;
/**
 * 必读条款控制器
 */
class MandatoryTermsController {
    /**
     * 确认必读条款
     */
    static async confirmTerm(req, res) {
        try {
            const userId = req.user.userId;
            const { termType } = req.body;
            const ipAddress = req.ip;
            const validTerms = ['age_confirmation', 'real_name_commitment', 'data_usage_notice'];
            if (!validTerms.includes(termType)) {
                return res.status(400).json({ success: false, message: '无效的条款类型' });
            }
            const confirmation = await agreementService_1.MandatoryTermsService.confirmTerm(userId, termType, ipAddress);
            res.json({ success: true, data: confirmation, message: '条款确认成功' });
        }
        catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
    /**
     * 检查用户条款确认状态
     */
    static async checkUserTerms(req, res) {
        try {
            const userId = req.user.userId;
            const status = await agreementService_1.MandatoryTermsService.checkUserTerms(userId);
            res.json({ success: true, data: status });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    /**
     * 获取用户的条款确认记录
     */
    static async getUserTerms(req, res) {
        try {
            const userId = req.user.userId;
            const terms = await agreementService_1.MandatoryTermsService.getUserTerms(userId);
            res.json({ success: true, data: terms });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}
exports.MandatoryTermsController = MandatoryTermsController;
//# sourceMappingURL=agreementController.js.map