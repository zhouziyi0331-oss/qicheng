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
 * 合伙人关系系统
 * GET  /partnerships/:companyId/:studentId      — 获取企业与学生的合伙关系
 * POST /partnerships/update-count               — 更新合作次数
 * POST /partnerships/invite                     — 企业邀请学生成为合伙人
 * POST /partnerships/respond                    — 学生响应合伙邀请
 * GET  /partnerships/student/:studentId         — 获取学生的所有合伙关系
 * GET  /partnerships/company/:companyId         — 获取企业的所有合伙关系
 * POST /partnerships/interaction                — 记录合伙人互动
 */
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const controller = __importStar(require("./controller"));
const router = (0, express_1.Router)();
// 所有路由都需要认证
router.use(auth_1.authenticate);
// 获取特定合伙关系
router.get('/:companyId/:studentId', controller.getPartnership);
// 更新合作次数
router.post('/update-count', controller.updateCollaborationCount);
// 企业邀请学生成为合伙人
router.post('/invite', controller.invitePartner);
// 学生响应合伙邀请
router.post('/respond', controller.respondToInvitation);
// 获取学生的所有合伙关系
router.get('/student/:studentId', controller.getStudentPartnerships);
// 获取企业的所有合伙关系
router.get('/company/:companyId', controller.getCompanyPartnerships);
// 记录合伙人互动
router.post('/interaction', controller.recordInteraction);
exports.default = router;
//# sourceMappingURL=index.js.map