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
 * E-03: 风险预检服务
 * 任务发布前AI自动识别潜在风险
 */
class RiskDetectionService {
    /**
     * 评估任务风险
     */
    async assessTaskRisk(data) {
        const { taskId, title, description, budget, deadline, requiredSkills = [], deliverableRequirements, } = data;
        // 计算工期（如果有deadline）
        let deadlineDays = 0;
        if (deadline) {
            const now = new Date();
            deadlineDays = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        }
        // 构建AI提示词
        const prompt = `你是一位经验丰富的项目风险管理专家。请评估以下任务的风险：

**任务信息**
标题：${title}
描述：${description}
${budget ? `预算：¥${budget}` : '预算：未设置'}
${deadline ? `截止日期：${deadline.toLocaleDateString()}（${deadlineDays}天后）` : '截止日期：未设置'}
${requiredSkills.length > 0 ? `技能要求：${requiredSkills.join(', ')}` : '技能要求：未明确'}
${deliverableRequirements ? `交付要求：${deliverableRequirements}` : '交付要求：未明确'}

请从以下6个维度评估风险（每个维度0-1分）：
1. **需求清晰度** (scope_clarity): 需求是否明确具体
2. **预算充足性** (budget_adequacy): 预算是否合理
3. **工期可行性** (timeline_feasibility): 工期是否现实
4. **需求完整性** (requirement_completeness): 需求描述是否完整
5. **技能可获得性** (skill_availability): 所需技能是否容易找到
6. **沟通清晰度** (communication_clarity): 沟通期望是否明确

请识别具体风险，每个风险包含：
- risk_id: 风险编号（如R001）
- category: 类别（scope/budget/timeline/skill/quality/communication）
- severity: 严重程度（low/medium/high/critical）
- title: 风险标题
- description: 风险描述
- probability: 发生概率（0-1）
- impact: 潜在影响
- mitigation: 缓解建议

请以JSON格式返回：
- risk_dimensions: 6个维度的评分
- identified_risks: 风险列表
- mitigation_suggestions: 总体缓解建议（字符串数组）
- publish_recommendation: 'safe_to_publish' | 'caution_recommended' | 'revision_needed' | 'high_risk_warning'
- analysis: 总体分析文本
- confidence_level: 置信度（0-1）`;
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
            // 解析AI响应
            const aiResult = this.parseAIResponse(content.text);
            // 计算总体风险分数
            const overallScore = this.calculateOverallRiskScore(aiResult.risk_dimensions);
            const overallLevel = this.scoreToRiskLevel(overallScore);
            // 如果有taskId，保存到数据库
            let savedAssessment = null;
            if (taskId) {
                // 获取评估版本
                const versionResult = await database_1.pool.query(`SELECT COALESCE(MAX(assessment_version), 0) + 1 as next_version
           FROM risk_assessments WHERE task_id = $1`, [taskId]);
                const version = versionResult.rows[0].next_version;
                const result = await database_1.pool.query(`INSERT INTO risk_assessments
           (id, task_id, overall_risk_level, overall_risk_score,
            risk_dimensions, identified_risks, mitigation_suggestions,
            publish_recommendation, ai_analysis, confidence_level, assessment_version)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
           RETURNING *`, [
                    (0, uuid_1.v4)(),
                    taskId,
                    overallLevel,
                    overallScore,
                    JSON.stringify(aiResult.risk_dimensions),
                    JSON.stringify(aiResult.identified_risks),
                    aiResult.mitigation_suggestions,
                    aiResult.publish_recommendation,
                    aiResult.analysis,
                    aiResult.confidence_level,
                    version,
                ]);
                savedAssessment = result.rows[0];
            }
            return savedAssessment || {
                id: (0, uuid_1.v4)(),
                task_id: taskId || '',
                overall_risk_level: overallLevel,
                overall_risk_score: overallScore,
                risk_dimensions: aiResult.risk_dimensions,
                identified_risks: aiResult.identified_risks,
                mitigation_suggestions: aiResult.mitigation_suggestions,
                publish_recommendation: aiResult.publish_recommendation,
                ai_analysis: aiResult.analysis,
                confidence_level: aiResult.confidence_level,
            };
        }
        catch (error) {
            console.error('AI风险评估失败:', error);
            // 返回降级方案
            return this.generateFallbackAssessment(taskId, deadlineDays, budget);
        }
    }
    /**
     * 获取任务的风险评估历史
     */
    async getTaskRiskHistory(taskId) {
        const result = await database_1.pool.query(`SELECT * FROM risk_assessments
       WHERE task_id = $1
       ORDER BY assessment_version DESC`, [taskId]);
        return result.rows;
    }
    /**
     * 企业确认风险评估
     */
    async acknowledgeRisk(assessmentId, companyId, decision, notes) {
        await database_1.pool.query(`UPDATE risk_assessments
       SET company_acknowledged = true,
           acknowledged_at = NOW(),
           company_decision = $2,
           company_notes = $3
       WHERE id = $1`, [assessmentId, decision, notes]);
        // 更新统计
        await this.updateRiskStats(companyId);
    }
    /**
     * 获取企业的风险统计
     */
    async getCompanyRiskStats(companyId) {
        const result = await database_1.pool.query(`SELECT
         COUNT(*) as total_assessments,
         COUNT(*) FILTER (WHERE overall_risk_level = 'high') as high_risk_count,
         COUNT(*) FILTER (WHERE overall_risk_level = 'medium') as medium_risk_count,
         COUNT(*) FILTER (WHERE overall_risk_level = 'low') as low_risk_count,
         COUNT(*) FILTER (WHERE company_acknowledged = true) as acknowledged_count,
         COUNT(*) FILTER (WHERE company_decision = 'proceed_anyway') as proceeded_count,
         COUNT(*) FILTER (WHERE company_decision = 'revise_task') as revised_count
       FROM risk_assessments ra
       JOIN tasks t ON ra.task_id = t.id
       WHERE t.company_id = $1`, [companyId]);
        return result.rows[0] || {
            total_assessments: 0,
            high_risk_count: 0,
            medium_risk_count: 0,
            low_risk_count: 0,
            acknowledged_count: 0,
            proceeded_count: 0,
            revised_count: 0,
        };
    }
    /**
     * 获取常见风险类型
     */
    async getCommonRiskTypes() {
        const result = await database_1.pool.query(`SELECT * FROM risk_types WHERE is_active = true ORDER BY category, risk_code`);
        return result.rows;
    }
    /**
     * 解析AI响应
     */
    parseAIResponse(text) {
        try {
            const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('无法解析AI响应');
            }
            const jsonText = jsonMatch[1] || jsonMatch[0];
            return JSON.parse(jsonText);
        }
        catch (error) {
            console.error('解析AI响应失败:', error);
            throw error;
        }
    }
    /**
     * 计算总体风险分数
     */
    calculateOverallRiskScore(dimensions) {
        let totalScore = 0;
        let count = 0;
        for (const key in dimensions) {
            // 注意：维度分数越低，风险越高
            // 所以总体风险分数 = 1 - 平均维度分数
            totalScore += dimensions[key].score;
            count++;
        }
        const avgScore = count > 0 ? totalScore / count : 0;
        return 1 - avgScore; // 风险分数
    }
    /**
     * 分数转风险等级
     */
    scoreToRiskLevel(score) {
        if (score >= 0.7)
            return 'critical';
        if (score >= 0.5)
            return 'high';
        if (score >= 0.3)
            return 'medium';
        return 'low';
    }
    /**
     * 降级方案：基于规则的风险评估
     */
    async generateFallbackAssessment(taskId, deadlineDays, budget) {
        const risks = [];
        let riskScore = 0;
        // 规则1：工期过紧
        if (deadlineDays > 0 && deadlineDays < 7) {
            risks.push({
                risk_id: 'R001',
                category: 'timeline',
                severity: 'high',
                title: '工期过紧',
                description: `${deadlineDays}天的工期可能不足`,
                probability: 0.8,
                impact: '可能导致延期或质量不达标',
                mitigation: '建议延长工期至2周以上',
            });
            riskScore += 0.3;
        }
        // 规则2：预算偏低
        if (budget && budget < 500) {
            risks.push({
                risk_id: 'R002',
                category: 'budget',
                severity: 'medium',
                title: '预算偏低',
                description: '预算可能低于市场平均水平',
                probability: 0.6,
                impact: '可能难以吸引优质学生',
                mitigation: '建议提高预算或减少功能范围',
            });
            riskScore += 0.2;
        }
        const overallLevel = this.scoreToRiskLevel(riskScore);
        const fallbackDimensions = {
            scope_clarity: { score: 0.7, level: 'medium', issues: ['AI服务暂时不可用'] },
            budget_adequacy: { score: budget && budget < 500 ? 0.5 : 0.7, level: 'medium', issues: [] },
            timeline_feasibility: {
                score: deadlineDays < 7 ? 0.4 : 0.7,
                level: deadlineDays < 7 ? 'high' : 'medium',
                issues: [],
            },
            requirement_completeness: { score: 0.7, level: 'medium', issues: [] },
            skill_availability: { score: 0.8, level: 'low', issues: [] },
            communication_clarity: { score: 0.7, level: 'medium', issues: [] },
        };
        const assessment = {
            id: (0, uuid_1.v4)(),
            task_id: taskId || '',
            overall_risk_level: overallLevel,
            overall_risk_score: riskScore,
            risk_dimensions: fallbackDimensions,
            identified_risks: risks,
            mitigation_suggestions: ['AI风险评估服务暂时不可用，已使用规则引擎进行基础评估'],
            publish_recommendation: risks.length > 0 ? 'caution_recommended' : 'safe_to_publish',
            ai_analysis: 'AI服务暂时不可用，已基于规则进行风险评估',
            confidence_level: 0.5,
        };
        // 如果有taskId，保存到数据库
        if (taskId) {
            const versionResult = await database_1.pool.query(`SELECT COALESCE(MAX(assessment_version), 0) + 1 as next_version
         FROM risk_assessments WHERE task_id = $1`, [taskId]);
            const version = versionResult.rows[0].next_version;
            const result = await database_1.pool.query(`INSERT INTO risk_assessments
         (id, task_id, overall_risk_level, overall_risk_score,
          risk_dimensions, identified_risks, mitigation_suggestions,
          publish_recommendation, ai_analysis, confidence_level, assessment_version)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING *`, [
                assessment.id,
                taskId,
                assessment.overall_risk_level,
                assessment.overall_risk_score,
                JSON.stringify(assessment.risk_dimensions),
                JSON.stringify(assessment.identified_risks),
                assessment.mitigation_suggestions,
                assessment.publish_recommendation,
                assessment.ai_analysis,
                assessment.confidence_level,
                version,
            ]);
            return result.rows[0];
        }
        return assessment;
    }
    /**
     * 更新企业风险统计
     */
    async updateRiskStats(companyId) {
        // 这里可以实现定期统计逻辑
        // 暂时留空，可以通过定时任务调用
    }
}
exports.default = new RiskDetectionService();
//# sourceMappingURL=riskDetectionService.js.map