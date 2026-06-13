"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
const database_1 = require("../config/database");
const uuid_1 = require("uuid");
const config_1 = __importDefault(require("../config"));
const anthropic = new sdk_1.default({
    apiKey: config_1.default.ai.anthropicApiKey,
});
/**
 * E-21: AI审核报告透明化服务
 * AI自动审核交付物并生成改进指引
 */
class AIReviewService {
    /**
     * AI审核任务交付物
     */
    async reviewTaskDeliverable(data) {
        const { taskId, taskTitle, taskDescription, deliverableDescription, deliverableFiles = [], deliverableUrl, requirements = [], } = data;
        // 获取当前审核版本
        const versionResult = await database_1.pool.query(`SELECT COALESCE(MAX(review_version), 0) + 1 as next_version
       FROM ai_review_reports WHERE task_id = $1`, [taskId]);
        const reviewVersion = versionResult.rows[0].next_version;
        // 构建AI审核提示词
        const prompt = `你是一位专业的软件交付物审核专家。请审核以下任务的交付物：

**任务信息**
标题：${taskTitle}
描述：${taskDescription}

**交付要求**
${requirements.length > 0 ? requirements.map((r, i) => `${i + 1}. ${r}`).join('\n') : '无明确要求'}

**学生提交的交付物**
描述：${deliverableDescription}
${deliverableUrl ? `链接：${deliverableUrl}` : ''}
${deliverableFiles.length > 0 ? `文件：${deliverableFiles.join(', ')}` : ''}

请从以下维度评估交付物质量（0-1分）：
1. 功能完整性 (40%)
2. 代码质量 (20%)
3. 文档完整性 (15%)
4. UI设计 (15%)
5. 性能表现 (10%)

请以JSON格式返回审核结果，包含：
- quality_scores: 各维度评分和反馈
- strengths: 优点列表（字符串数组）
- issues: 问题列表（包含severity, category, title, description, suggestion）
- recommendations: 改进建议（字符串数组）
- ai_recommendation: 'approve' | 'minor_revisions' | 'major_revisions' | 'reject'
- confidence_level: 置信度（0-1）
- analysis: 总体分析文本`;
        try {
            const message = await anthropic.messages.create({
                model: 'claude-3-5-sonnet-20241022',
                max_tokens: 4000,
                messages: [
                    {
                        role: 'user',
                        content: prompt,
                    },
                ],
            });
            const content = message.content[0];
            if (content.type !== 'text') {
                throw new Error('AI返回格式错误');
            }
            // 解析AI响应
            const aiResult = this.parseAIResponse(content.text);
            // 计算总分
            const overallScore = this.calculateOverallScore(aiResult.quality_scores);
            const overallGrade = this.scoreToGrade(overallScore);
            // 保存审核报告
            const result = await database_1.pool.query(`INSERT INTO ai_review_reports
         (id, task_id, review_version, overall_score, overall_grade,
          quality_scores, strengths, issues, recommendations,
          ai_recommendation, confidence_level, ai_analysis)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         RETURNING *`, [
                (0, uuid_1.v4)(),
                taskId,
                reviewVersion,
                overallScore,
                overallGrade,
                JSON.stringify(aiResult.quality_scores),
                aiResult.strengths,
                JSON.stringify(aiResult.issues),
                aiResult.recommendations,
                aiResult.ai_recommendation,
                aiResult.confidence_level,
                aiResult.analysis,
            ]);
            return result.rows[0];
        }
        catch (error) {
            logger.error('AI审核失败:', error);
            // 返回降级方案
            return this.generateFallbackReview(taskId, reviewVersion);
        }
    }
    /**
     * 企业驳回后生成AI改进指引
     */
    async generateRevisionGuide(data) {
        const { taskId, rejectionReason, rejectionDetails, reviewReportId, companyId } = data;
        // 获取任务信息
        const taskResult = await database_1.pool.query(`SELECT title, description FROM tasks WHERE id = $1`, [taskId]);
        if (taskResult.rows.length === 0) {
            throw new Error('任务不存在');
        }
        const task = taskResult.rows[0];
        // 获取指引版本
        const versionResult = await database_1.pool.query(`SELECT COALESCE(MAX(guide_version), 0) + 1 as next_version
       FROM ai_revision_guides WHERE task_id = $1`, [taskId]);
        const guideVersion = versionResult.rows[0].next_version;
        // 构建AI提示词
        const prompt = `你是一位帮助学生改进作品的导师。企业驳回了学生的交付物，请将驳回理由转化为学生可执行的改进步骤。

**任务信息**
标题：${task.title}
描述：${task.description}

**企业驳回理由**
${rejectionReason}

请生成具体的改进指引，包含：
1. revision_steps: 改进步骤列表（每步包含title, description, files_to_modify, estimated_time, priority, examples）
2. verification_checklist: 验收清单（item, category, required）
3. estimated_hours: 预计修改工作量（小时）
4. difficulty_level: 'easy' | 'medium' | 'hard'

请以JSON格式返回。步骤要具体可执行，避免模糊描述。`;
        try {
            const message = await anthropic.messages.create({
                model: 'claude-3-5-sonnet-20241022',
                max_tokens: 3000,
                messages: [
                    {
                        role: 'user',
                        content: prompt,
                    },
                ],
            });
            const content = message.content[0];
            if (content.type !== 'text') {
                throw new Error('AI返回格式错误');
            }
            const aiResult = this.parseRevisionGuide(content.text);
            // 保存改进指引
            const result = await database_1.pool.query(`INSERT INTO ai_revision_guides
         (id, task_id, review_report_id, rejection_reason, rejection_details,
          guide_version, revision_steps, verification_checklist,
          estimated_hours, difficulty_level, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING *`, [
                (0, uuid_1.v4)(),
                taskId,
                reviewReportId,
                rejectionReason,
                rejectionDetails ? JSON.stringify(rejectionDetails) : null,
                guideVersion,
                JSON.stringify(aiResult.revision_steps),
                JSON.stringify(aiResult.verification_checklist),
                aiResult.estimated_hours,
                aiResult.difficulty_level,
                companyId,
            ]);
            return result.rows[0];
        }
        catch (error) {
            logger.error('生成改进指引失败:', error);
            return this.generateFallbackGuide(taskId, guideVersion, rejectionReason, companyId);
        }
    }
    /**
     * 获取任务的审核历史
     */
    async getReviewHistory(taskId) {
        const result = await database_1.pool.query(`SELECT * FROM ai_review_reports
       WHERE task_id = $1
       ORDER BY review_version DESC`, [taskId]);
        return result.rows;
    }
    /**
     * 获取任务的改进指引
     */
    async getRevisionGuides(taskId) {
        const result = await database_1.pool.query(`SELECT * FROM ai_revision_guides
       WHERE task_id = $1
       ORDER BY guide_version DESC`, [taskId]);
        return result.rows;
    }
    /**
     * 学生标记已查看改进指引
     */
    async markGuideAsViewed(guideId, studentId) {
        await database_1.pool.query(`UPDATE ai_revision_guides
       SET student_viewed = true,
           viewed_at = NOW()
       WHERE id = $1`, [guideId]);
    }
    /**
     * 学生对改进指引评分
     */
    async rateGuideHelpfulness(guideId, rating, feedback) {
        await database_1.pool.query(`UPDATE ai_revision_guides
       SET helpfulness_rating = $2,
           student_feedback = $3
       WHERE id = $1`, [guideId, rating, feedback]);
    }
    /**
     * 解析AI审核响应
     */
    parseAIResponse(text) {
        try {
            // 提取JSON（去除markdown代码块标记）
            const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('无法解析AI响应');
            }
            const jsonText = jsonMatch[1] || jsonMatch[0];
            return JSON.parse(jsonText);
        }
        catch (error) {
            logger.error('解析AI响应失败:', error);
            throw error;
        }
    }
    /**
     * 解析改进指引
     */
    parseRevisionGuide(text) {
        try {
            const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('无法解析改进指引');
            }
            const jsonText = jsonMatch[1] || jsonMatch[0];
            return JSON.parse(jsonText);
        }
        catch (error) {
            logger.error('解析改进指引失败:', error);
            throw error;
        }
    }
    /**
     * 计算总分
     */
    calculateOverallScore(qualityScores) {
        let totalScore = 0;
        let totalWeight = 0;
        for (const key in qualityScores) {
            const { score, weight } = qualityScores[key];
            totalScore += score * weight;
            totalWeight += weight;
        }
        return totalWeight > 0 ? totalScore / totalWeight : 0;
    }
    /**
     * 分数转等级
     */
    scoreToGrade(score) {
        if (score >= 0.95)
            return 'A+';
        if (score >= 0.9)
            return 'A';
        if (score >= 0.85)
            return 'B+';
        if (score >= 0.8)
            return 'B';
        if (score >= 0.7)
            return 'C';
        if (score >= 0.6)
            return 'D';
        return 'F';
    }
    /**
     * 降级方案：生成基础审核报告
     */
    async generateFallbackReview(taskId, reviewVersion) {
        const fallbackScores = {
            functionality: { score: 0.7, weight: 0.4, feedback: 'AI审核服务暂时不可用，请人工审核' },
            quality: { score: 0.7, weight: 0.6, feedback: '建议人工验收' },
        };
        const result = await database_1.pool.query(`INSERT INTO ai_review_reports
       (id, task_id, review_version, overall_score, overall_grade,
        quality_scores, strengths, issues, recommendations,
        ai_recommendation, confidence_level, ai_analysis, reviewed_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'hybrid')
       RETURNING *`, [
            (0, uuid_1.v4)(),
            taskId,
            reviewVersion,
            0.7,
            'C',
            JSON.stringify(fallbackScores),
            ['交付物已提交'],
            JSON.stringify([]),
            ['建议人工审核交付物质量'],
            'minor_revisions',
            0.3,
            'AI审核服务暂时不可用，已生成基础报告',
        ]);
        return result.rows[0];
    }
    /**
     * 降级方案：生成基础改进指引
     */
    async generateFallbackGuide(taskId, guideVersion, rejectionReason, companyId) {
        const fallbackSteps = [
            {
                step: 1,
                title: '理解企业反馈',
                description: `企业的驳回理由是：${rejectionReason}。请仔细阅读并理解需要改进的地方。`,
                estimated_time: '10分钟',
                priority: 'high',
            },
            {
                step: 2,
                title: '针对性修改',
                description: '根据企业反馈，逐项进行修改和完善。',
                estimated_time: '1-2小时',
                priority: 'high',
            },
            {
                step: 3,
                title: '自我检查',
                description: '修改完成后，对照任务要求进行自我检查，确保所有问题都已解决。',
                estimated_time: '20分钟',
                priority: 'medium',
            },
        ];
        const fallbackChecklist = [
            { item: '已解决企业提出的问题', category: 'general', required: true },
            { item: '交付物完整', category: 'completeness', required: true },
        ];
        const result = await database_1.pool.query(`INSERT INTO ai_revision_guides
       (id, task_id, rejection_reason, guide_version, revision_steps,
        verification_checklist, estimated_hours, difficulty_level, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`, [
            (0, uuid_1.v4)(),
            taskId,
            rejectionReason,
            guideVersion,
            JSON.stringify(fallbackSteps),
            JSON.stringify(fallbackChecklist),
            2,
            'medium',
            companyId,
        ]);
        return result.rows[0];
    }
}
exports.default = new AIReviewService();
//# sourceMappingURL=aiReviewService.js.map