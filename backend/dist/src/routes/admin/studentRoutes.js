"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const studentController_1 = require("./studentController");
const router = (0, express_1.Router)();
// 学生列表
router.get('/', studentController_1.getStudentList);
// 学生详情
router.get('/:id', studentController_1.getStudentDetail);
// 学生能力画像
router.get('/:id/ability', studentController_1.getStudentAbility);
// 学生成长轨迹
router.get('/:id/growth', studentController_1.getStudentGrowth);
// 更新学生状态
router.put('/:id/status', studentController_1.updateStudentStatus);
exports.default = router;
//# sourceMappingURL=studentRoutes.js.map