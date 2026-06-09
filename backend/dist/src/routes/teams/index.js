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
 * 组队系统路由
 */
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const teamCtrl = __importStar(require("./teamController"));
const router = (0, express_1.Router)();
// 队伍管理
router.post('/', auth_1.authenticate, (0, auth_1.requireRole)('student'), teamCtrl.createTeam);
router.get('/my-teams', auth_1.authenticate, (0, auth_1.requireRole)('student'), teamCtrl.getMyTeams);
router.get('/:teamId', auth_1.authenticate, teamCtrl.getTeamInfo);
// 队伍申请
router.post('/:teamId/apply', auth_1.authenticate, (0, auth_1.requireRole)('student'), teamCtrl.applyToJoinTeam);
router.post('/:teamId/review-application', auth_1.authenticate, (0, auth_1.requireRole)('student'), teamCtrl.reviewApplication);
// 任务分配
router.post('/:teamId/assign-module', auth_1.authenticate, (0, auth_1.requireRole)('student'), teamCtrl.assignModule);
// 邀请链接
router.post('/:teamId/generate-invite', auth_1.authenticate, (0, auth_1.requireRole)('student'), teamCtrl.generateInviteLink);
router.post('/join-by-code', auth_1.authenticate, (0, auth_1.requireRole)('student'), teamCtrl.joinByInviteCode);
// 队伍操作
router.post('/:teamId/leave', auth_1.authenticate, (0, auth_1.requireRole)('student'), teamCtrl.leaveTeam);
router.post('/:teamId/disband', auth_1.authenticate, (0, auth_1.requireRole)('student'), teamCtrl.disbandTeam);
exports.default = router;
//# sourceMappingURL=index.js.map