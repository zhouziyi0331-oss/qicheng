"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateObjectId = exports.validatePagination = exports.validateBody = void 0;
/**
 * 请求验证中间件
 * 验证必需参数
 */
const validateBody = (requiredFields) => {
    return (req, res, next) => {
        const missingFields = [];
        for (const field of requiredFields) {
            if (!req.body[field]) {
                missingFields.push(field);
            }
        }
        if (missingFields.length > 0) {
            return res.status(400).json({
                error: '缺少必要参数',
                missingFields
            });
        }
        next();
    };
};
exports.validateBody = validateBody;
/**
 * 分页参数验证
 */
const validatePagination = (req, res, next) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    if (page < 1) {
        return res.status(400).json({ error: 'page必须大于0' });
    }
    if (limit < 1 || limit > 100) {
        return res.status(400).json({ error: 'limit必须在1-100之间' });
    }
    req.query.page = page.toString();
    req.query.limit = limit.toString();
    next();
};
exports.validatePagination = validatePagination;
/**
 * MongoDB ObjectId验证
 */
const validateObjectId = (paramName) => {
    return (req, res, next) => {
        const id = req.params[paramName];
        // 简单的ObjectId格式验证（24位十六进制字符）
        const objectIdPattern = /^[0-9a-fA-F]{24}$/;
        if (!objectIdPattern.test(id)) {
            return res.status(400).json({
                error: `无效的${paramName}格式`
            });
        }
        next();
    };
};
exports.validateObjectId = validateObjectId;
//# sourceMappingURL=validation.middleware.js.map