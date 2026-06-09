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
 * 指令6: OPC故事墙 + 同类人信息流
 * RULE: NO LEADERBOARD — 永远不按 likes 排序 (PRD Ch.09 & Ch.24)
 *
 * GET  /story/feed           — 故事墙信息流 (按相似度+时间, 非点赞数)
 * POST /story/posts          — 发布故事
 * POST /story/posts/:id/like — 点赞 (仅存储, 不用于排序)
 * POST /story/:id/comment    — 评论故事
 * GET  /story/peers          — 同类人信息流
 * GET  /story-wall           — 故事墙列表（兼容路由）
 * POST /story-wall/submit    — 提交故事（兼容路由）
 */
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const controller = __importStar(require("./controller"));
const router = (0, express_1.Router)();
router.use(auth_1.authenticate, (0, auth_1.requireRole)('student'));
// RULE: NO LEADERBOARD — See PRD Ch.09
router.get('/feed', controller.getFeed);
router.post('/posts', controller.createPost);
router.post('/posts/:id/like', controller.likePost);
router.post('/:id/comment', controller.commentOnStory);
router.get('/peers', controller.getPeersFeed);
// 兼容前端路由
router.get('/story-wall', controller.getStoryWall);
router.post('/story-wall/submit', controller.submitStory);
exports.default = router;
//# sourceMappingURL=index.js.map