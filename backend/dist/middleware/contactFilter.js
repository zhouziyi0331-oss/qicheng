"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.filterContactInfo = filterContactInfo;
exports.contactFilterMiddleware = contactFilterMiddleware;
const config_1 = require("../../config");
const logger_1 = __importDefault(require("../utils/logger"));
const CONTACT_REPLACEMENT = '[联系方式已屏蔽，完成2单后可解锁]';
/**
 * Filter contact information (phone numbers, WeChat IDs, QQ numbers, etc.)
 * from message content. Applied to all chat message endpoints.
 */
function filterContactInfo(content) {
    let filtered = content;
    let wasFiltered = false;
    for (const pattern of config_1.config.contactFilterPatterns) {
        // Reset lastIndex for global patterns
        pattern.lastIndex = 0;
        if (pattern.test(content)) {
            wasFiltered = true;
            pattern.lastIndex = 0; // reset again before replace
            filtered = filtered.replace(pattern, CONTACT_REPLACEMENT);
        }
        pattern.lastIndex = 0;
    }
    return { filtered, wasFiltered };
}
/**
 * Express middleware: filter contact info from req.body.content
 * for chat message routes.
 */
function contactFilterMiddleware(req, _res, next) {
    if (req.body?.content && typeof req.body.content === 'string') {
        const { filtered, wasFiltered } = filterContactInfo(req.body.content);
        if (wasFiltered) {
            logger_1.default.info('Contact info filtered from message', {
                taskId: req.params.taskId,
                userId: req.user?.userId,
            });
            req.body.originalContent = req.body.content; // store original (will be encrypted in DB)
            req.body.content = filtered;
            req.body.isFiltered = true;
        }
    }
    next();
}
//# sourceMappingURL=contactFilter.js.map