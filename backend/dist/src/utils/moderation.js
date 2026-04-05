"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.moderateContent = moderateContent;
exports.filterContactInfo = filterContactInfo;
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
const logger_1 = __importDefault(require("./logger"));
const client = new sdk_1.default({
    apiKey: process.env.ANTHROPIC_API_KEY || '',
});
/**
 * AI 内容审核 - 检测故事墙发帖是否包含敏感内容
 * 返回: { safe: boolean, reason?: string }
 */
async function moderateContent(content) {
    // 开发模式或未配置 API Key：跳过审核
    if (process.env.NODE_ENV === 'development' || !process.env.ANTHROPIC_API_KEY) {
        logger_1.default.info('Content moderation skipped (dev mode)');
        return { safe: true };
    }
    try {
        const response = await client.messages.create({
            model: 'claude-3-haiku-20240307',
            max_tokens: 200,
            messages: [{
                    role: 'user',
                    content: `你是内容审核助手。判断以下用户发帖内容是否安全（不包含色情、暴力、政治敏感、广告、联系方式等）。
只回复 JSON 格式: {"safe": true/false, "reason": "原因"}

用户内容：
${content}`
                }]
        });
        const text = response.content[0].type === 'text' ? response.content[0].text : '{}';
        const result = JSON.parse(text);
        logger_1.default.info('Content moderation result', { safe: result.safe, reason: result.reason });
        return result;
    }
    catch (err) {
        logger_1.default.error('Content moderation error', { error: err.message });
        // 审核失败时默认通过，避免误伤
        return { safe: true };
    }
}
/**
 * 联系方式过滤 - 检测并过滤微信号、QQ号、手机号
 */
function filterContactInfo(content) {
    let filtered = content;
    let wasFiltered = false;
    // 手机号: 1[3-9]\d{9}
    if (/1[3-9]\d{9}/.test(filtered)) {
        filtered = filtered.replace(/1[3-9]\d{9}/g, '[已过滤手机号]');
        wasFiltered = true;
    }
    // 微信号: wx/weixin + 字母数字
    if (/(?:wx|weixin|微信)[:\s]*[a-zA-Z0-9_-]{5,20}/i.test(filtered)) {
        filtered = filtered.replace(/(?:wx|weixin|微信)[:\s]*[a-zA-Z0-9_-]{5,20}/gi, '[已过滤微信号]');
        wasFiltered = true;
    }
    // QQ号: 5-11位数字
    if (/qq[:\s]*\d{5,11}/i.test(filtered)) {
        filtered = filtered.replace(/qq[:\s]*\d{5,11}/gi, '[已过滤QQ号]');
        wasFiltered = true;
    }
    return { filtered, wasFiltered };
}
//# sourceMappingURL=moderation.js.map