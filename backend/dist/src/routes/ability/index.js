"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * 指令5: 六维能力分析系统 + 成长时间线
 * GET /ability/radar          — 六维雷达图 (基础版免费)
 * GET /ability/radar/detailed — 详细版 (付费 ¥69)
 * GET /ability/timeline       — 成长时间线
 * GET /ability/emotion-state  — 获取情绪状态
 * GET /ability/growth-comparison — 成长对比数据（入驻时 vs 当前）
 * GET /ability/growth-dashboard — 成长仪表盘数据
 * POST /ability/update-after-task — 任务完成后更新能力
 */
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const controller = __importStar(require("./controller"));
const router = (0, express_1.Router)();
router.use(auth_1.authenticate, (0, auth_1.requireRole)('student'));
router.get('/radar', controller.getRadar);
router.get('/radar/detailed', controller.getDetailedRadar);
router.get('/timeline', controller.getTimeline);
router.get('/emotion-state', controller.getEmotionState);
router.get('/growth-comparison', controller.getGrowthComparison);
router.get('/growth-dashboard', controller.getGrowthDashboard);
router.post('/update-after-task', controller.updateAfterTask);
exports.default = router;
//# sourceMappingURL=index.js.map