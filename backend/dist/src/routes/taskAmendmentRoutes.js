"use strict";
/**
 * 任务追加需求路由
 *
 * 定义任务追加需求相关的API路由
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
const taskAmendmentController = __importStar(require("../controllers/taskAmendmentController"));
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// =====================================================
// 所有路由都需要认证
// =====================================================
router.use(auth_1.authenticate);
// =====================================================
// 追加需求CRUD路由
// =====================================================
/**
 * 创建追加需求（企业）
 * POST /api/v1/task-amendments
 */
router.post('/', taskAmendmentController.createAmendment);
/**
 * 学生响应追加需求
 * POST /api/v1/task-amendments/:id/respond
 */
router.post('/:id/respond', taskAmendmentController.studentRespond);
/**
 * 企业最终决定（协商后）
 * POST /api/v1/task-amendments/:id/decide
 */
router.post('/:id/decide', taskAmendmentController.companyDecide);
/**
 * 取消追加需求（企业主动取消）
 * POST /api/v1/task-amendments/:id/cancel
 */
router.post('/:id/cancel', taskAmendmentController.cancelAmendment);
// =====================================================
// 查询路由
// =====================================================
/**
 * 获取任务的所有追加需求
 * GET /api/v1/task-amendments/task/:taskId
 */
router.get('/task/:taskId', taskAmendmentController.getTaskAmendments);
/**
 * 获取追加需求详情
 * GET /api/v1/task-amendments/:id
 */
router.get('/:id', taskAmendmentController.getAmendment);
// =====================================================
// AI辅助路由
// =====================================================
/**
 * AI评估追加需求的合理性
 * POST /api/v1/task-amendments/:id/analyze
 */
router.post('/:id/analyze', taskAmendmentController.analyzeAmendment);
exports.default = router;
//# sourceMappingURL=taskAmendmentRoutes.js.map