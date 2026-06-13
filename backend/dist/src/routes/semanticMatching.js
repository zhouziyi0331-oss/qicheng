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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const semanticMatchingController = __importStar(require("../controllers/semanticMatchingController"));
const qichengTeacherController = __importStar(require("../controllers/qichengTeacherController"));
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
/**
 * 语义匹配相关路由
 */
// 企业端：触发任务匹配
router.post('/tasks/:taskId/trigger-matching', auth_1.authenticateToken, semanticMatchingController.triggerMatching);
// 企业端：查看匹配的学生
router.get('/tasks/:taskId/matched-students', auth_1.authenticateToken, semanticMatchingController.getMatchedStudents);
// 企业端：推送任务给选中的学生
router.post('/tasks/:taskId/push-to-students', auth_1.authenticateToken, semanticMatchingController.pushToStudents);
// 学生端：查看推荐任务
router.get('/students/recommended-tasks', auth_1.authenticateToken, semanticMatchingController.getRecommendedTasks);
/**
 * 启程老师翻译相关路由
 */
// 获取任务的启程老师翻译
router.get('/tasks/:taskId/translation', auth_1.authenticateToken, qichengTeacherController.getTaskTranslation);
// 为任务生成需求摘要
router.post('/tasks/:taskId/generate-summary', auth_1.authenticateToken, qichengTeacherController.generateRequirementSummary);
exports.default = router;
//# sourceMappingURL=semanticMatching.js.map