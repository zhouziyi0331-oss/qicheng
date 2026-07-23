"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.graduationReportService = exports.GraduationReportService = void 0;
const GraduationReport_1 = require("../models/GraduationReport");
const Assessment_1 = require("../models/Assessment");
const AbilityRadar_1 = require("../models/AbilityRadar");
const RealProject_1 = require("../models/RealProject");
const PracticeProject_1 = require("../models/PracticeProject");
const Income_1 = require("../models/Income");
const Withdrawal_1 = require("../models/Withdrawal");
const openai_1 = require("../config/openai");
const logger_1 = require("../utils/logger");
const mongoose_1 = __importDefault(require("mongoose"));
const crypto_1 = __importDefault(require("crypto"));
/**
 * 毕业报告服务
 * 生成用户完整学习历程的综合报告
 */
class GraduationReportService {
    /**
     * 生成毕业报告
     */
    async generateGraduationReport(userId) {
        try {
            logger_1.log.info('开始生成毕业报告', { userId });
            const userObjectId = new mongoose_1.default.Types.ObjectId(userId);
            // 检查是否已存在
            const existing = await GraduationReport_1.GraduationReport.findOne({ userId: userObjectId });
            if (existing) {
                throw new Error('毕业报告已存在');
            }
            // 收集所有数据
            const data = await this.collectAllUserData(userId);
            // 创建初始报告
            const report = await GraduationReport_1.GraduationReport.create({
                userId: userObjectId,
                status: 'generating',
                isUnlocked: false
            });
            // 异步生成完整报告
            this.generateFullReport(report._id.toString(), userId, data)
                .catch(error => {
                logger_1.log.error('毕业报告生成失败', { error: error.message, userId });
                GraduationReport_1.GraduationReport.findByIdAndUpdate(report._id, { status: 'failed' });
            });
            return {
                reportId: report._id,
                status: 'generating',
                message: '毕业报告正在生成中，请稍后查看'
            };
        }
        catch (error) {
            logger_1.log.error('启动毕业报告生成失败', { error: error.message, userId });
            throw new Error(error.message || '毕业报告生成失败');
        }
    }
    /**
     * 收集用户所有数据
     */
    async collectAllUserData(userId) {
        const userObjectId = new mongoose_1.default.Types.ObjectId(userId);
        const [assessments, radars, practiceProjects, realProjects, incomes, withdrawals] = await Promise.all([
            Assessment_1.Assessment.find({ userId: userObjectId }).sort({ assessmentNumber: 1 }),
            AbilityRadar_1.AbilityRadar.find({ userId: userObjectId }).sort({ snapshotNumber: 1 }),
            PracticeProject_1.PracticeProject.find({ userId: userObjectId }),
            RealProject_1.RealProject.find({ userId: userObjectId }),
            Income_1.Income.find({ userId: userObjectId, status: 'confirmed' }),
            Withdrawal_1.Withdrawal.find({ userId: userObjectId, status: 'completed' })
        ]);
        return {
            assessments,
            radars,
            practiceProjects,
            realProjects,
            incomes,
            withdrawals
        };
    }
    /**
     * 生成完整报告
     */
    async generateFullReport(reportId, userId, data) {
        try {
            // 1. 计算学习历程总结
            const journeySummary = this.calculateJourneySummary(data);
            // 2. 计算项目成果
            const projectAchievements = this.calculateProjectAchievements(data);
            // 3. 计算能力成长
            const abilityGrowth = this.calculateAbilityGrowth(data);
            // 4. 计算财务成果
            const financialSummary = this.calculateFinancialSummary(data);
            // 5. 准备可视化数据
            const visualData = this.prepareVisualData(data);
            // 6. AI生成个性化评价
            const aiEvaluation = await this.generateAIEvaluation(journeySummary, projectAchievements, abilityGrowth, financialSummary, data);
            // 7. 生成证书
            const certificate = this.generateCertificate(userId, abilityGrowth);
            // 8. 更新报告
            await GraduationReport_1.GraduationReport.findByIdAndUpdate(reportId, {
                journeySummary,
                projectAchievements,
                abilityGrowth,
                financialSummary,
                visualData,
                aiEvaluation,
                certificate,
                status: 'completed',
                generatedAt: new Date()
            });
            logger_1.log.info('毕业报告生成完成', { reportId, userId });
        }
        catch (error) {
            logger_1.log.error('生成完整报告失败', { error: error.message, reportId });
            throw error;
        }
    }
    /**
     * 计算学习历程总结
     */
    calculateJourneySummary(data) {
        const firstAssessment = data.assessments[0];
        const lastAssessment = data.assessments[data.assessments.length - 1];
        const startDate = firstAssessment?.createdAt || new Date();
        const endDate = new Date();
        const totalDays = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        return {
            startDate,
            endDate,
            totalDays,
            firstAssessmentDate: firstAssessment?.createdAt || startDate,
            lastAssessmentDate: lastAssessment?.createdAt || endDate,
            assessmentCount: data.assessments.length
        };
    }
    /**
     * 计算项目成果
     */
    calculateProjectAchievements(data) {
        const practiceProjects = data.practiceProjects.filter((p) => p.status === 'completed').length;
        const realProjects = data.realProjects.filter((p) => p.status === 'completed').length;
        const categories = new Set();
        data.realProjects.forEach((p) => {
            if (p.category)
                categories.add(p.category);
        });
        const ratings = data.realProjects
            .filter((p) => p.clientRating?.score)
            .map((p) => p.clientRating.score);
        const clientSatisfaction = ratings.length > 0
            ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length
            : 0;
        return {
            practiceProjects,
            realProjects,
            totalProjects: practiceProjects + realProjects,
            projectCategories: Array.from(categories),
            clientSatisfaction: Math.round(clientSatisfaction * 10) / 10
        };
    }
    /**
     * 计算能力成长
     */
    calculateAbilityGrowth(data) {
        const firstRadar = data.radars[0];
        const lastRadar = data.radars[data.radars.length - 1];
        if (!firstRadar || !lastRadar) {
            return {
                initialLevel: '新手',
                finalLevel: '新手',
                levelUpCount: 0,
                dimensionGrowth: [],
                allAbilityTags: [],
                totalAbilityCount: 0,
                mostImprovedDimension: { dimension: '', growth: 0 }
            };
        }
        // 计算各维度成长
        const dimensionGrowth = lastRadar.dimensions.map((lastDim) => {
            const firstDim = firstRadar.dimensions.find((d) => d.name === lastDim.name);
            const growth = lastDim.score - (firstDim?.score || 0);
            const growthPercent = firstDim?.score
                ? `${((growth / firstDim.score) * 100).toFixed(1)}%`
                : 'N/A';
            return {
                dimension: lastDim.name,
                initialScore: firstDim?.score || 0,
                finalScore: lastDim.score,
                growth,
                growthPercent
            };
        });
        // 找出进步最大的维度
        const mostImproved = dimensionGrowth.reduce((max, curr) => curr.growth > max.growth ? curr : max, { dimension: '', growth: 0 });
        // 收集所有能力标签
        const allTags = new Set();
        data.radars.forEach((radar) => {
            radar.dimensions.forEach((dim) => {
                dim.tags?.forEach((tag) => allTags.add(tag));
            });
        });
        data.realProjects.forEach((project) => {
            project.abilitiesGained?.forEach((tag) => allTags.add(tag));
            project.abilitiesImproved?.forEach((tag) => allTags.add(tag));
        });
        return {
            initialLevel: firstRadar.rank,
            finalLevel: lastRadar.rank,
            levelUpCount: this.calculateLevelUps(data.radars),
            dimensionGrowth,
            allAbilityTags: Array.from(allTags),
            totalAbilityCount: allTags.size,
            mostImprovedDimension: mostImproved
        };
    }
    /**
     * 计算升级次数
     */
    calculateLevelUps(radars) {
        const levels = ['新手', '进阶', '熟练', '专家', '大师'];
        let levelUps = 0;
        for (let i = 1; i < radars.length; i++) {
            const prevLevel = levels.indexOf(radars[i - 1].rank);
            const currLevel = levels.indexOf(radars[i].rank);
            if (currLevel > prevLevel) {
                levelUps++;
            }
        }
        return levelUps;
    }
    /**
     * 计算财务成果
     */
    calculateFinancialSummary(data) {
        const totalEarnings = data.incomes.reduce((sum, income) => sum + income.amount, 0);
        const totalWithdrawals = data.withdrawals.reduce((sum, w) => sum + w.actualAmount, 0);
        const currentBalance = totalEarnings - totalWithdrawals;
        const projectEarnings = data.realProjects
            .filter((p) => p.status === 'completed')
            .map((p) => p.netIncome || 0);
        const averageProjectEarnings = projectEarnings.length > 0
            ? projectEarnings.reduce((sum, e) => sum + e, 0) / projectEarnings.length
            : 0;
        const highestProjectEarnings = projectEarnings.length > 0
            ? Math.max(...projectEarnings)
            : 0;
        return {
            totalEarnings: Math.round(totalEarnings * 100) / 100,
            totalWithdrawals: Math.round(totalWithdrawals * 100) / 100,
            currentBalance: Math.round(currentBalance * 100) / 100,
            averageProjectEarnings: Math.round(averageProjectEarnings * 100) / 100,
            highestProjectEarnings: Math.round(highestProjectEarnings * 100) / 100
        };
    }
    /**
     * 准备可视化数据
     */
    prepareVisualData(data) {
        const firstRadar = data.radars[0];
        const lastRadar = data.radars[data.radars.length - 1];
        // 成长曲线
        const growthCurve = data.radars.map((radar) => ({
            date: radar.createdAt,
            overallScore: radar.overallScore
        }));
        // 项目时间线
        const projectTimeline = [
            ...data.practiceProjects.map((p) => ({
                date: p.endDate || p.createdAt,
                projectTitle: p.title,
                projectType: 'practice',
                earnings: 0
            })),
            ...data.realProjects.map((p) => ({
                date: p.completedAt || p.createdAt,
                projectTitle: p.title,
                projectType: 'real',
                earnings: p.netIncome || 0
            }))
        ].sort((a, b) => a.date.getTime() - b.date.getTime());
        return {
            abilityRadarComparison: {
                initial: firstRadar,
                final: lastRadar
            },
            growthCurve,
            projectTimeline
        };
    }
    /**
     * AI生成个性化评价
     */
    async generateAIEvaluation(journeySummary, projectAchievements, abilityGrowth, financialSummary, data) {
        try {
            const prompt = `生成用户的毕业报告评价：

**学习历程：**
- 学习时长：${journeySummary.totalDays}天
- 测评次数：${journeySummary.assessmentCount}次

**项目成果：**
- 实践项目：${projectAchievements.practiceProjects}个
- 真实项目：${projectAchievements.realProjects}个
- 客户满意度：${projectAchievements.clientSatisfaction}/5

**能力成长：**
- 初始等级：${abilityGrowth.initialLevel}
- 最终等级：${abilityGrowth.finalLevel}
- 升级次数：${abilityGrowth.levelUpCount}次
- 掌握能力：${abilityGrowth.totalAbilityCount}项
- 最大进步：${abilityGrowth.mostImprovedDimension.dimension} (+${abilityGrowth.mostImprovedDimension.growth}分)

**财务成果：**
- 总收入：¥${financialSummary.totalEarnings}
- 平均项目收入：¥${financialSummary.averageProjectEarnings}

**详细能力成长：**
${abilityGrowth.dimensionGrowth.map((d) => `- ${d.dimension}: ${d.initialScore} → ${d.finalScore} (${d.growthPercent})`).join('\n')}

请生成个性化的毕业评价，包括：
1. 整体评价（200字左右）
2. 优势分析（150字左右）
3. 3-5个成就亮点
4. 成长故事（300字左右，讲述用户的成长历程）
5. 3-5个未来建议
6. 3-5个职业路径建议

返回JSON格式：
{
  "overallAssessment": "整体评价...",
  "strengthsAnalysis": "优势分析...",
  "achievementsHighlight": ["亮点1", "亮点2", "亮点3"],
  "growthStory": "成长故事...",
  "futureRecommendations": ["建议1", "建议2", "建议3"],
  "careerPathSuggestions": ["路径1", "路径2", "路径3"]
}`;
            const completion = await openai_1.openai.chat.completions.create({
                model: openai_1.AI_CONFIG.model,
                messages: [
                    {
                        role: 'system',
                        content: `你是职业发展导师，擅长总结学员的成长历程，给出专业、鼓舞人心的评价。

要求：
1. 评价要基于数据，真实可信
2. 语言要温暖、鼓励，但不夸张
3. 成就亮点要具体，不要空洞
4. 建议要有针对性，可执行`
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.8,
                max_tokens: 3000,
                response_format: { type: 'json_object' }
            });
            const resultText = completion.choices[0].message.content || '{}';
            return JSON.parse(resultText);
        }
        catch (error) {
            logger_1.log.error('AI生成评价失败', { error: error.message });
            return {
                overallAssessment: '恭喜你完成学习历程！',
                strengthsAnalysis: '你在多个领域都有显著成长。',
                achievementsHighlight: [],
                growthStory: '你的成长历程充满了挑战和收获。',
                futureRecommendations: [],
                careerPathSuggestions: []
            };
        }
    }
    /**
     * 生成证书
     */
    generateCertificate(userId, abilityGrowth) {
        const certificateId = `OPC-${Date.now()}-${crypto_1.default.randomBytes(4).toString('hex').toUpperCase()}`;
        // 根据最终等级确定证书等级
        let certLevel = '初级';
        if (abilityGrowth.finalLevel === '大师')
            certLevel = '大师级';
        else if (abilityGrowth.finalLevel === '专家')
            certLevel = '专家级';
        else if (abilityGrowth.finalLevel === '熟练')
            certLevel = '高级';
        else if (abilityGrowth.finalLevel === '进阶')
            certLevel = '中级';
        // 确定专业方向（取评分最高的3个维度）
        const specialization = abilityGrowth.dimensionGrowth
            .sort((a, b) => b.finalScore - a.finalScore)
            .slice(0, 3)
            .map((d) => d.dimension);
        return {
            certificateId,
            issuedAt: new Date(),
            level: certLevel,
            specialization
        };
    }
    /**
     * 获取毕业报告
     */
    async getGraduationReport(userId) {
        const report = await GraduationReport_1.GraduationReport.findOne({
            userId: new mongoose_1.default.Types.ObjectId(userId)
        });
        return report;
    }
    /**
     * 解锁毕业报告
     */
    async unlockGraduationReport(userId) {
        const report = await GraduationReport_1.GraduationReport.findOne({
            userId: new mongoose_1.default.Types.ObjectId(userId)
        });
        if (!report) {
            throw new Error('毕业报告不存在');
        }
        if (report.isUnlocked) {
            throw new Error('毕业报告已解锁');
        }
        report.isUnlocked = true;
        report.unlockedAt = new Date();
        await report.save();
        logger_1.log.info('毕业报告已解锁', { userId, reportId: report._id });
        return report;
    }
}
exports.GraduationReportService = GraduationReportService;
exports.graduationReportService = new GraduationReportService();
//# sourceMappingURL=graduationReport.service.js.map