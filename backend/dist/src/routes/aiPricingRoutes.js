"use strict";
/**
 * AI智能定价路由
 *
 * 定义AI智能定价相关的API路由
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const aiPricingController = __importStar(require("../controllers/aiPricingController"));
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// =====================================================
// 所有路由都需要认证
// =====================================================
router.use(auth_1.authenticate);
// =====================================================
// 定价建议路由
// =====================================================
/**
 * 获取智能定价建议
 * POST /api/v1/ai-pricing/suggest
 */
router.post('/suggest', aiPricingController.getPricingSuggestion);
/**
 * 保存定价历史（任务发布时调用）
 * POST /api/v1/ai-pricing/save-history
 */
router.post('/save-history', aiPricingController.savePricingHistory);
/**
 * 记录定价调整
 * POST /api/v1/ai-pricing/record-adjustment
 */
router.post('/record-adjustment', aiPricingController.recordAdjustment);
// =====================================================
// 分析和统计路由（管理员）
// =====================================================
/**
 * 获取定价准确度分析
 * GET /api/v1/ai-pricing/accuracy
 */
router.get('/accuracy', aiPricingController.getPricingAccuracy);
/**
 * 手动更新市场基准价格
 * POST /api/v1/ai-pricing/update-benchmarks
 */
router.post('/update-benchmarks', aiPricingController.updateBenchmarks);
exports.default = router;
//# sourceMappingURL=aiPricingRoutes.js.map