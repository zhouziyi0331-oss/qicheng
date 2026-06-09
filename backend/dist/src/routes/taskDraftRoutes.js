"use strict";
/**
 * 任务草稿箱路由
 *
 * 定义任务草稿相关的API路由
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
const taskDraftController = __importStar(require("../controllers/taskDraftController"));
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// =====================================================
// 所有路由都需要认证
// =====================================================
router.use(auth_1.authenticate);
// =====================================================
// 草稿CRUD路由
// =====================================================
/**
 * 创建新草稿
 * POST /api/v1/task-drafts
 */
router.post('/', taskDraftController.createDraft);
/**
 * 获取草稿列表
 * GET /api/v1/task-drafts
 */
router.get('/', taskDraftController.getDrafts);
/**
 * 获取草稿详情
 * GET /api/v1/task-drafts/:id
 */
router.get('/:id', taskDraftController.getDraft);
/**
 * 更新草稿
 * PUT /api/v1/task-drafts/:id
 */
router.put('/:id', taskDraftController.updateDraft);
/**
 * 删除草稿
 * DELETE /api/v1/task-drafts/:id
 */
router.delete('/:id', taskDraftController.deleteDraft);
/**
 * 复制草稿
 * POST /api/v1/task-drafts/:id/duplicate
 */
router.post('/:id/duplicate', taskDraftController.duplicateDraft);
// =====================================================
// AI辅助路由
// =====================================================
/**
 * AI审核草稿
 * POST /api/v1/task-drafts/:id/review
 */
router.post('/:id/review', taskDraftController.reviewDraft);
/**
 * 获取AI定价建议
 * POST /api/v1/task-drafts/:id/pricing-suggestion
 */
router.post('/:id/pricing-suggestion', taskDraftController.getPricingSuggestion);
// =====================================================
// 发布和历史路由
// =====================================================
/**
 * 发布草稿为正式任务
 * POST /api/v1/task-drafts/:id/publish
 */
router.post('/:id/publish', taskDraftController.publishDraft);
/**
 * 获取草稿历史版本
 * GET /api/v1/task-drafts/:id/history
 */
router.get('/:id/history', taskDraftController.getDraftHistory);
/**
 * 恢复到历史版本
 * POST /api/v1/task-drafts/:id/restore/:historyId
 */
router.post('/:id/restore/:historyId', taskDraftController.restoreDraftVersion);
exports.default = router;
//# sourceMappingURL=taskDraftRoutes.js.map