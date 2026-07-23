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
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const mentorController = __importStar(require("../controllers/mentor.controller"));
const router = (0, express_1.Router)();
// 所有路由都需要认证
router.use(auth_1.authMiddleware);
// AI对话
router.post('/chat', mentorController.chat);
// 获取对话历史
router.get('/history/:taskId', mentorController.getHistory);
// 获取接单第一步引导
router.get('/:taskId/first-step', mentorController.getFirstStep);
// 学生说"我卡住了"
router.post('/:taskId/stuck', mentorController.reportStuck);
// 完成里程碑时的见证
router.post('/:taskId/milestone', mentorController.celebrateMilestone);
// 获取热情火花列表
router.get('/passion-sparks', mentorController.getPassionSparks);
// 获取穿越感时刻列表
router.get('/flow-moments', mentorController.getFlowMoments);
// 获取成长统计
router.get('/growth-stats', mentorController.getGrowthStats);
exports.default = router;
//# sourceMappingURL=mentor.routes.js.map