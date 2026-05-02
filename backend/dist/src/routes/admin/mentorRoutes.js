"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const mentorController_1 = require("./mentorController");
const router = (0, express_1.Router)();
// 导师列表
router.get('/', mentorController_1.getMentorList);
// 导师详情
router.get('/:id', mentorController_1.getMentorDetail);
// 更新导师状态
router.put('/:id/status', mentorController_1.updateMentorStatus);
// 咨询会话列表
router.get('/sessions', mentorController_1.getMentorSessions);
exports.default = router;
//# sourceMappingURL=mentorRoutes.js.map