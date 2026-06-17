"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const controller_1 = require("./controller");
const controller_2 = require("./controller");
const router = (0, express_1.Router)();
// 所有上传接口都需要认证
router.use(controller_1.authenticate);
// POST /api/v1/upload/image - 上传单个图片（带安全验证）
router.post('/image', controller_1.uploadImages[0], controller_1.uploadImages[1], controller_2.uploadSingleImage);
// POST /api/v1/upload/images - 上传多个图片（带安全验证）
router.post('/images', controller_1.uploadImages[0], controller_1.uploadImages[1], controller_2.uploadMultipleImages);
// POST /api/v1/upload/document - 上传文档（带安全验证）
router.post('/document', controller_1.uploadDocuments[0], controller_1.uploadDocuments[1], controller_2.uploadDocument);
exports.default = router;
//# sourceMappingURL=index.js.map