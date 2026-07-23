"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.comparisonReportService = exports.ComparisonReportService = void 0;
const ComparisonReport_1 = require("../models/ComparisonReport");
const AbilityRadar_1 = require("../models/AbilityRadar");
const Assessment_1 = require("../models/Assessment");
const RealProject_1 = require("../models/RealProject");
const openai_1 = require("../config/openai");
const logger_1 = require("../utils/logger");
const mongoose_1 = __importDefault(require("mongoose"));
/**
 * 深度对比报告服务
 * 对比规则：
 * - 第1次：测评 vs 第1次项目
 * - 第2次：第2次项目 vs 第1次项目
 * - 第N次：第N次项目 vs 第(N-1)次项目
 */
class ComparisonReportService {
    /**
     * 生成对比报告
     * 在完成项目后自动触发
     */
    async generateComparisonReport(userId, triggeredByProjectId) {
        try {
            logger_1.log.info('开始生成对比报告', { userId, triggeredByProjectId });
            // 获取用户所有雷达图快照
            const radars = await AbilityRadar_1.AbilityRadar.find({
                userId: new mongoose_1.default.Types.ObjectId(userId)
            }).sort({ snapshotNumber: 1 });
            if (radars.length < 2) {
                logger_1.log.info('雷达图快照不足2个，无法生成对比报告', { userId });
                return null;
            }
            // 获取已有对比报告数量
            const existingCount = await ComparisonReport_1.ComparisonReport.countDocuments({
                userId: new mongoose_1.default.Types.ObjectId(userId)
            });
            const comparisonNumber = existingCount + 1;
            // 确定对比的两个快照
            let beforeSnapshot, afterSnapshot;
            if (comparisonNumber === 1) {
                // 第1次对比：测评 vs 第1次项目
                beforeSnapshot = radars.find(r => r.triggerType === 'assessment');
                afterSnapshot = radars.find(r => r.triggerType === 'project_completed');
            }
            else {
                // 第N次对比：当前项目 vs 上一次项目
                const projectRadars = radars.filter(r => r.triggerType === 'project_completed');
                if (projectRadars.length >= 2) {
                    afterSnapshot = projectRadars[projectRadars.length - 1];
                    beforeSnapshot = projectRadars[projectRadars.length - 2];
                }
            }
            if (!beforeSnapshot || !afterSnapshot) {
                logger_1.log.error('无法确定对比的快照', { userId, comparisonNumber });
                return null;
            }
            // 获取相关信息
            const [beforeRef, afterRef] = await Promise.all([
                this.getSnapshotReference(beforeSnapshot),
                this.getSnapshotReference(afterSnapshot)
            ]);
            // AI生成对比分析
            const analysis = await this.generateAIAnalysis(userId, beforeSnapshot, afterSnapshot, beforeRef, afterRef);
            // 创建对比报告
            const report = await ComparisonReport_1.ComparisonReport.create({
                userId: new mongoose_1.default.Types.ObjectId(userId),
                comparisonNumber,
                beforeSnapshot: {
                    type: beforeSnapshot.triggerType === 'assessment' ? 'assessment' : 'project',
                    refId: beforeSnapshot.triggerRefId,
                    date: beforeSnapshot.createdAt,
                    abilityRadarId: beforeSnapshot._id,
                    overallScore: beforeSnapshot.overallScore
                },
                afterSnapshot: {
                    type: afterSnapshot.triggerType === 'assessment' ? 'assessment' : 'project',
                    refId: afterSnapshot.triggerRefId,
                    date: afterSnapshot.createdAt,
                    abilityRadarId: afterSnapshot._id,
                    overallScore: afterSnapshot.overallScore
                },
                analysis
            });
            logger_1.log.info('对比报告生成成功', { userId, reportId: report._id });
            return report;
        }
        catch (error) {
            logger_1.log.error('生成对比报告失败', { error: error.message, userId });
            throw new Error('对比报告生成失败');
        }
    }
    /**
     * 获取快照引用信息
     */
    async getSnapshotReference(snapshot) {
        if (snapshot.triggerType === 'assessment') {
            const assessment = await Assessment_1.Assessment.findById(snapshot.triggerRefId);
            return {
                type: 'assessment',
                title: `第${assessment?.assessmentNumber || 1}次测评`,
                data: assessment
            };
        }
        else {
            const project = await RealProject_1.RealProject.findById(snapshot.triggerRefId);
            return {
                type: 'project',
                title: project?.title || '项目',
                data: project
            };
        }
    }
    /**
     * AI生成对比分析
     */
    async generateAIAnalysis(userId, beforeSnapshot, afterSnapshot, beforeRef, afterRef) {
        try {
            // 计算各维度变化
            const dimensionChanges = afterSnapshot.dimensions.map((afterDim) => {
                const beforeDim = beforeSnapshot.dimensions.find((d) => d.name === afterDim.name);
                const change = afterDim.score - (beforeDim?.score || 0);
                const changePercent = beforeDim?.score
                    ? `${((change / beforeDim.score) * 100).toFixed(1)}%`
                    : 'N/A';
                return {
                    dimension: afterDim.name,
                    beforeScore: beforeDim?.score || 0,
                    afterScore: afterDim.score,
                    change,
                    changePercent,
                    evaluation: '' // AI填充
                };
            });
            // 构建AI提示词
            const prompt = `分析用户的能力成长对比：

**对比时间段：**
- 起点：${beforeRef.title} (${beforeSnapshot.createdAt.toLocaleDateString()})
- 终点：${afterRef.title} (${afterSnapshot.createdAt.toLocaleDateString()})

**综合评分变化：**
- 之前：${beforeSnapshot.overallScore}分 (${beforeSnapshot.rank})
- 之后：${afterSnapshot.overallScore}分 (${afterSnapshot.rank})
- 变化：${afterSnapshot.overallScore - beforeSnapshot.overallScore}分

**各维度变化：**
${dimensionChanges.map((d) => `- ${d.dimension}: ${d.beforeScore} → ${d.afterScore} (${d.change > 0 ? '+' : ''}${d.change}分)`).join('\n')}

${afterRef.type === 'project' ? `
**期间完成的项目：**
- 项目：${afterRef.data.title}
- 类别：${afterRef.data.category}
- 难度：${afterRef.data.difficulty}
- 客户评分：${afterRef.data.clientRating?.score || 'N/A'}/5
` : ''}

请分析用户的成长情况，生成详细的对比报告。

返回JSON格式：
{
  "dimensionEvaluations": [
    {
      "dimension": "沟通表达力",
      "evaluation": "这段时间沟通能力显著提升，原因是..."
    }
  ],
  "newAbilities": ["新增能力1", "新增能力2"],
  "improvedAbilities": ["提升的能力1", "提升的能力2"],
  "stableAbilities": ["保持稳定的能力1"],
  "overallGrowth": 15,
  "summary": "这段时间用户在XX方面取得了显著进步...",
  "recommendations": ["建议1", "建议2", "建议3"]
}`;
            const completion = await openai_1.openai.chat.completions.create({
                model: openai_1.AI_CONFIG.model,
                messages: [
                    {
                        role: 'system',
                        content: '你是能力成长分析专家，擅长对比分析用户的能力变化，并给出专业建议。'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 3000,
                response_format: { type: 'json_object' }
            });
            const resultText = completion.choices[0].message.content || '{}';
            const aiResult = JSON.parse(resultText);
            // 合并AI评价到维度变化中
            dimensionChanges.forEach((dim) => {
                const aiEval = aiResult.dimensionEvaluations?.find((e) => e.dimension === dim.dimension);
                if (aiEval) {
                    dim.evaluation = aiEval.evaluation;
                }
            });
            return {
                dimensionChanges,
                newAbilities: aiResult.newAbilities || [],
                improvedAbilities: aiResult.improvedAbilities || [],
                stableAbilities: aiResult.stableAbilities || [],
                overallGrowth: aiResult.overallGrowth || 0,
                summary: aiResult.summary || '',
                recommendations: aiResult.recommendations || []
            };
        }
        catch (error) {
            logger_1.log.error('AI生成对比分析失败', { error: error.message });
            // 返回基础分析
            return {
                dimensionChanges: [],
                newAbilities: [],
                improvedAbilities: [],
                stableAbilities: [],
                overallGrowth: 0,
                summary: '对比分析生成失败',
                recommendations: []
            };
        }
    }
    /**
     * 获取用户的对比报告历史
     */
    async getUserComparisonReports(userId) {
        const reports = await ComparisonReport_1.ComparisonReport.find({
            userId: new mongoose_1.default.Types.ObjectId(userId)
        }).sort({ comparisonNumber: 1 });
        return reports;
    }
    /**
     * 获取最新对比报告
     */
    async getLatestComparisonReport(userId) {
        const report = await ComparisonReport_1.ComparisonReport.findOne({
            userId: new mongoose_1.default.Types.ObjectId(userId)
        }).sort({ comparisonNumber: -1 });
        return report;
    }
}
exports.ComparisonReportService = ComparisonReportService;
exports.comparisonReportService = new ComparisonReportService();
//# sourceMappingURL=comparisonReport.service.js.map