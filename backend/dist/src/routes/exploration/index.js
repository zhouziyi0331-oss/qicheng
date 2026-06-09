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
 * 模式探索系统
 * GET  /exploration/patterns/:userId       — 获取用户的模式探索记录
 * POST /exploration/pattern/apply          — 应用某个模式
 * POST /exploration/pattern/mark-life      — 标记为人生模式
 * POST /exploration/reflection             — 提交反思记录
 * GET  /exploration/reflections/:userId    — 获取反思记录
 * GET  /exploration/suggestions            — 获取探索建议
 * POST /exploration/tag                    — 为探索记录添加标签
 * GET  /exploration/tags/:userId           — 获取用户的所有标签
 */
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const controller = __importStar(require("./controller"));
const router = (0, express_1.Router)();
// 所有路由都需要认证
router.use(auth_1.authenticate);
router.get('/patterns/:userId', controller.getPatterns);
router.post('/pattern/apply', controller.applyPattern);
router.post('/pattern/mark-life', controller.markAsLifePattern);
router.post('/reflection', controller.submitReflection);
router.get('/reflections/:userId', controller.getReflections);
router.get('/suggestions', controller.getSuggestions);
router.post('/tag', controller.addTag);
router.get('/tags/:userId', controller.getTags);
exports.default = router;
//# sourceMappingURL=index.js.map