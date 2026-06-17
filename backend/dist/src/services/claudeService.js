"use strict";
/**
 * Claude API 服务
 * 提供统一的Claude API调用接口
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.claudeService = void 0;
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
const logger_1 = __importDefault(require("../utils/logger"));
const anthropic = new sdk_1.default({
    apiKey: process.env.ANTHROPIC_API_KEY,
});
class ClaudeService {
    /**
     * 调用Claude API生成文本
     */
    async generateText(messages, options) {
        try {
            const response = await anthropic.messages.create({
                model: options?.model || 'claude-3-5-sonnet-20241022',
                max_tokens: options?.maxTokens || 4096,
                temperature: options?.temperature || 1.0,
                system: options?.system,
                messages: messages.map(msg => ({
                    role: msg.role,
                    content: msg.content,
                })),
            });
            const content = response.content[0].type === 'text'
                ? response.content[0].text
                : '';
            return {
                content,
                usage: {
                    input_tokens: response.usage.input_tokens,
                    output_tokens: response.usage.output_tokens,
                },
            };
        }
        catch (error) {
            logger_1.default.error('Claude API调用失败:', error);
            throw error;
        }
    }
    /**
     * 简化的单次对话接口
     */
    async chat(prompt, options) {
        const messages = typeof prompt === 'string'
            ? [{ role: 'user', content: prompt }]
            : prompt;
        const response = await this.generateText(messages, options);
        return response.content;
    }
}
exports.claudeService = new ClaudeService();
//# sourceMappingURL=claudeService.js.map