"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
const config_1 = require("../../config");
const logger_1 = __importDefault(require("../utils/logger"));
class ContentAuditService {
    constructor() {
        this.client = new sdk_1.default({
            apiKey: config_1.config.ai.anthropicApiKey,
        });
    }
    /**
     * 审核内容
     */
    async auditContent(request) {
        try {
            const { contentType, contentText, title } = request;
            // 构建审核提示词
            const prompt = this.buildAuditPrompt(contentType, contentText, title);
            // 调用AI进行审核
            const response = await this.client.messages.create({
                model: 'claude-3-5-sonnet-20241022',
                max_tokens: 1024,
                temperature: 0.1,
                messages: [
                    {
                        role: 'user',
                        content: prompt,
                    },
                ],
            });
            // 解析AI响应
            const result = this.parseAuditResponse(response);
            logger_1.default.info('Content audit completed', {
                contentType,
                passed: result.passed,
                confidence: result.confidence,
                flags: result.flags,
            });
            return result;
        }
        catch (error) {
            logger_1.default.error('Content audit failed', { error });
            // 审核失败时默认通过，避免阻塞用户
            return {
                passed: true,
                confidence: 0,
                flags: [],
                reason: 'Audit service unavailable',
            };
        }
    }
    /**
     * 构建审核提示词
     */
    buildAuditPrompt(contentType, contentText, title) {
        const contentTypeText = contentType === 'post' ? '帖子' : '评论';
        return `你是启程平台的内容审核助手。请审核以下${contentTypeText}内容，判断是否违反社区规范。

**社区三原则：**
1. 不吐槽企业：禁止针对具体企业、具体项目的抱怨、指责、负面评价
2. 不吐槽学生：禁止针对具体学生的嘲讽、贬低、人身攻击
3. 聚焦技能与协作：只允许组队招募、技术经验分享、工具教程、作品展示、问题求助

**需要检测的违规类型：**
- company_complaint: 针对企业的负面评价（如"XX公司太坑了"、"这个项目需求太变态"）
- student_attack: 针对学生的攻击（如"某某同学技术太差"、"这人不靠谱"）
- spam: 广告、推广、无关内容
- harassment: 骚扰、辱骂、不友善言论
- off_topic: 与技能协作无关的抱怨或发泄

${title ? `**标题：** ${title}\n` : ''}
**内容：**
${contentText}

请以JSON格式返回审核结果：
{
  "passed": true/false,
  "confidence": 0.0-1.0,
  "flags": ["违规类型1", "违规类型2"],
  "reason": "具体原因说明"
}

**判断标准：**
- confidence > 0.8: 确认违规，passed=false
- confidence 0.6-0.8: 疑似违规，passed=true但需提示用户
- confidence < 0.6: 通过，passed=true

只返回JSON，不要其他解释。`;
    }
    /**
     * 解析AI审核响应
     */
    parseAuditResponse(response) {
        try {
            const content = response.content[0];
            if (content.type !== 'text') {
                throw new Error('Unexpected response type');
            }
            // 提取JSON内容
            const text = content.text.trim();
            let jsonText = text;
            // 如果响应包含markdown代码块，提取JSON
            const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
            if (jsonMatch) {
                jsonText = jsonMatch[1];
            }
            const result = JSON.parse(jsonText);
            return {
                passed: result.passed ?? true,
                confidence: result.confidence ?? 0,
                flags: result.flags ?? [],
                reason: result.reason ?? '',
            };
        }
        catch (error) {
            logger_1.default.error('Failed to parse audit response', { error });
            // 解析失败时默认通过
            return {
                passed: true,
                confidence: 0,
                flags: [],
                reason: 'Failed to parse audit result',
            };
        }
    }
    /**
     * 批量审核（用于管理端复核）
     */
    async batchAudit(contents) {
        const results = new Map();
        for (const content of contents) {
            const result = await this.auditContent({
                contentType: content.type,
                contentText: content.text,
                userId: '', // 批量审核不需要userId
                title: content.title,
            });
            results.set(content.id, result);
        }
        return results;
    }
    /**
     * 检查用户是否被限制
     */
    async checkUserRestriction(userId, restrictionType) {
        try {
            const { queryOne } = require('../utils/db');
            const restriction = await queryOne(`SELECT restriction_type, reason, expires_at
         FROM community_user_restrictions
         WHERE user_id = $1
           AND restriction_type IN ($2, 'full_ban')
           AND expires_at > NOW()
         ORDER BY expires_at DESC
         LIMIT 1`, [userId, restrictionType]);
            if (restriction) {
                return {
                    restricted: true,
                    reason: restriction.reason,
                    expiresAt: restriction.expires_at,
                };
            }
            return { restricted: false };
        }
        catch (error) {
            logger_1.default.error('Failed to check user restriction', { error, userId });
            return { restricted: false };
        }
    }
    /**
     * 添加用户限制
     */
    async addUserRestriction(userId, restrictionType, reason, durationHours, createdBy) {
        try {
            const { query } = require('../utils/db');
            await query(`INSERT INTO community_user_restrictions (
          user_id, restriction_type, reason, expires_at, created_by
        ) VALUES ($1, $2, $3, NOW() + INTERVAL '${durationHours} hours', $4)`, [userId, restrictionType, reason, createdBy || null]);
            logger_1.default.info('User restriction added', {
                userId,
                restrictionType,
                durationHours,
            });
        }
        catch (error) {
            logger_1.default.error('Failed to add user restriction', { error, userId });
            throw error;
        }
    }
}
exports.default = new ContentAuditService();
//# sourceMappingURL=contentAuditService.js.map