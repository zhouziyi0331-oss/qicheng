"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const aiController_1 = require("./aiController");
const router = (0, express_1.Router)();
// AI调用日志
router.get('/logs', aiController_1.getAICallLogs);
// AI调用统计
router.get('/stats', aiController_1.getAICallStats);
// Prompt模板列表
router.get('/prompts', aiController_1.getPromptTemplates);
// 创建Prompt模板
router.post('/prompts', aiController_1.createPromptTemplate);
// 更新Prompt模板
router.put('/prompts/:id', aiController_1.updatePromptTemplate);
// 删除Prompt模板
router.delete('/prompts/:id', aiController_1.deletePromptTemplate);
exports.default = router;
//# sourceMappingURL=aiRoutes.js.map