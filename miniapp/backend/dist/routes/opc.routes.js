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
const opcController = __importStar(require("../controllers/opc.controller"));
const matchController = __importStar(require("../controllers/match.controller"));
const router = (0, express_1.Router)();
// 获取测试题（不需要认证）
router.get('/questions', opcController.getQuestions);
// 以下路由需要认证
router.use(auth_1.authMiddleware);
// 提交OPC测评
router.post('/submit', opcController.submitTest);
// 获取指定用户的测评结果
router.get('/result/:userId', opcController.getResult);
// 获取当前用户最新的测评结果
router.get('/latest', opcController.getLatestResult);
// 获取当前用户所有测评历史
router.get('/history', opcController.getUserResults);
// 生成OPC成长报告
router.get('/report/:userId', opcController.generateReport);
// 项目匹配相关
router.get('/match/projects', matchController.getMatchedProjects);
router.get('/match/project/:projectId', matchController.getProjectMatchInfo);
exports.default = router;
//# sourceMappingURL=opc.routes.js.map