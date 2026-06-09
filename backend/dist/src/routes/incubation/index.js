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
 * 创业孵化系统
 * GET  /incubation/projects/:userId        — 获取用户的孵化项目
 * POST /incubation/project/create          — 创建孵化项目
 * POST /incubation/project/update          — 更新项目进度
 * GET  /incubation/milestones/:projectId   — 获取项目里程碑
 * POST /incubation/milestone/create        — 创建里程碑
 * POST /incubation/milestone/complete      — 完成里程碑
 * GET  /incubation/resources               — 获取孵化资源
 */
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const controller = __importStar(require("./controller"));
const router = (0, express_1.Router)();
// 所有路由都需要认证
router.use(auth_1.authenticate);
router.get('/projects/:userId', controller.getProjects);
router.post('/project/create', controller.createProject);
router.post('/project/update', controller.updateProject);
router.get('/milestones/:projectId', controller.getMilestones);
router.post('/milestone/create', controller.createMilestone);
router.post('/milestone/complete', controller.completeMilestone);
router.get('/resources', controller.getResources);
exports.default = router;
//# sourceMappingURL=index.js.map