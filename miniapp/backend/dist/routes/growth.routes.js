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
const auth_middleware_1 = require("../middleware/auth.middleware");
const growthController = __importStar(require("../controllers/growth.controller"));
const router = (0, express_1.Router)();
// 所有路由都需要认证
router.use(auth_middleware_1.authenticateToken);
// OC测评相关
router.post('/assessment', growthController.submitAssessment);
router.get('/assessments', growthController.getAssessments);
router.get('/assessment/latest', growthController.getLatestAssessment);
// 能力雷达图相关
router.get('/ability-radar', growthController.getAbilityRadarHistory);
router.get('/ability-radar/latest', growthController.getLatestAbilityRadar);
router.get('/ability-radar/compare', growthController.compareRadars);
// 深度对比报告
router.get('/comparison-reports', growthController.getComparisonReports);
router.get('/comparison-reports/latest', growthController.getLatestComparisonReport);
// 动态成长路径
router.post('/growth-path/generate', growthController.generateGrowthPath);
router.get('/growth-path/latest', growthController.getLatestGrowthPath);
router.get('/growth-path/history', growthController.getGrowthPathHistory);
router.post('/growth-path/milestone', growthController.updateMilestone);
// 毕业报告
router.post('/graduation-report/generate', growthController.generateGraduationReport);
router.get('/graduation-report', growthController.getGraduationReport);
router.post('/graduation-report/unlock', growthController.unlockGraduationReport);
exports.default = router;
//# sourceMappingURL=growth.routes.js.map