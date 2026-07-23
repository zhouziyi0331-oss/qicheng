"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminFinancialController = exports.AdminFinancialController = void 0;
const financial_service_1 = require("../../services/financial.service");
/**
 * 管理员财务管理控制器
 */
class AdminFinancialController {
    /**
     * POST /api/admin/financial/recalculate/:userId
     * 重新计算用户余额（对账）
     */
    async recalculateBalance(req, res) {
        try {
            const { userId } = req.params;
            const balance = await financial_service_1.financialService.recalculateUserBalance(userId);
            res.json({
                success: true,
                message: '余额已重新计算',
                balance
            });
        }
        catch (error) {
            console.error('重新计算余额失败:', error);
            res.status(500).json({ error: error.message || '重新计算余额失败' });
        }
    }
    /**
     * POST /api/admin/financial/recalculate-all
     * 批量重新计算所有用户余额
     */
    async recalculateAllBalances(req, res) {
        try {
            const { User } = require('../models/User');
            const users = await User.find({});
            let successCount = 0;
            let failedCount = 0;
            const errors = [];
            for (const user of users) {
                try {
                    await financial_service_1.financialService.recalculateUserBalance(user._id.toString());
                    successCount++;
                }
                catch (error) {
                    failedCount++;
                    errors.push({
                        userId: user._id,
                        error: error.message
                    });
                }
            }
            res.json({
                success: true,
                message: '批量对账完成',
                stats: {
                    total: users.length,
                    success: successCount,
                    failed: failedCount
                },
                errors: errors.length > 0 ? errors : undefined
            });
        }
        catch (error) {
            console.error('批量对账失败:', error);
            res.status(500).json({ error: error.message || '批量对账失败' });
        }
    }
}
exports.AdminFinancialController = AdminFinancialController;
exports.adminFinancialController = new AdminFinancialController();
//# sourceMappingURL=financial.admin.controller.js.map