"use strict";
/**
 * 评价系统路由
 *
 * 定义评价相关的API路由
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
const ratingController = __importStar(require("../controllers/ratingController"));
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// =====================================================
// 所有路由都需要认证
// =====================================================
router.use(auth_1.authenticate);
// =====================================================
// 评价CRUD路由
// =====================================================
/**
 * 创建评价
 * POST /api/v1/ratings
 */
router.post('/', ratingController.createRating);
/**
 * 更新评价
 * PUT /api/v1/ratings/:id
 */
router.put('/:id', ratingController.updateRating);
/**
 * 回复评价
 * POST /api/v1/ratings/:id/respond
 */
router.post('/:id/respond', ratingController.respondToRating);
/**
 * 删除评价（管理员）
 * DELETE /api/v1/ratings/:id
 */
router.delete('/:id', ratingController.deleteRating);
// =====================================================
// 查询路由
// =====================================================
/**
 * 获取任务的评价
 * GET /api/v1/ratings/task/:taskId
 */
router.get('/task/:taskId', ratingController.getTaskRatings);
/**
 * 获取用户收到的评价
 * GET /api/v1/ratings/user/:userId
 */
router.get('/user/:userId', ratingController.getUserRatings);
/**
 * 获取用户评价统计
 * GET /api/v1/ratings/user/:userId/stats
 */
router.get('/user/:userId/stats', ratingController.getUserRatingStats);
/**
 * 获取可用标签
 * GET /api/v1/ratings/tags
 */
router.get('/tags', ratingController.getAvailableTags);
// =====================================================
// 互动路由
// =====================================================
/**
 * 标记评价有用/无用
 * POST /api/v1/ratings/:id/helpful
 */
router.post('/:id/helpful', ratingController.markHelpful);
/**
 * 举报评价
 * POST /api/v1/ratings/:id/report
 */
router.post('/:id/report', ratingController.reportRating);
exports.default = router;
//# sourceMappingURL=ratingRoutes.js.map