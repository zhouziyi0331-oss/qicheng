"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dynamicGrowthPathService = exports.DynamicGrowthPathService = void 0;
const DynamicGrowthPath_1 = require("../models/DynamicGrowthPath");
const AbilityRadar_1 = require("../models/AbilityRadar");
const RealProject_1 = require("../models/RealProject");
const Income_1 = require("../models/Income");
const openai_1 = require("../config/openai");
const logger_1 = require("../utils/logger");
const mongoose_1 = __importDefault(require("mongoose"));
/**
 * 动态成长路径服务
 * 根据用户能力、项目历史，AI动态生成个性化成长建议
 */
class DynamicGrowthPathService {
    /**
     * 生成/更新成长路径
     * 在以下情况触发：
     * 1. 完成测评后
     * 2. 完成项目后
     * 3. 用户手动请求
     */
    async generateGrowthPath(userId) {
        try {
            logger_1.log.info('开始生成成长路径', { userId });
            // 收集用户数据
            const userData = await this.collectUserData(userId);
            // 调用AI生成成长路径
            const aiResult = await this.generateAIGrowthPath(userData);
            // 获取版本号
            const existingCount = await DynamicGrowthPath_1.DynamicGrowthPath.countDocuments({
                userId: new mongoose_1.default.Types.ObjectId(userId)
            });
            const versionNumber = existingCount + 1;
            // 保存成长路径
            const growthPath = await DynamicGrowthPath_1.DynamicGrowthPath.create({
                userId: new mongoose_1.default.Types.ObjectId(userId),
                versionNumber,
                generatedAt: new Date(),
                currentState: userData.currentState,
                phases: aiResult.phases,
                milestones: aiResult.milestones,
                predictions: aiResult.predictions
            });
            logger_1.log.info('成长路径生成成功', { userId, versionNumber });
            return growthPath;
        }
        catch (error) {
            logger_1.log.error('生成成长路径失败', { error: error.message, userId });
            throw new Error('成长路径生成失败');
        }
    }
    /**
     * 收集用户数据
     */
    async collectUserData(userId) {
        const userObjectId = new mongoose_1.default.Types.ObjectId(userId);
        // 获取最新雷达图
        const latestRadar = await AbilityRadar_1.AbilityRadar.findOne({
            userId: userObjectId
        }).sort({ snapshotNumber: -1 });
        // 获取项目统计
        const [completedProjects, totalIncome] = await Promise.all([
            RealProject_1.RealProject.countDocuments({
                userId: userObjectId,
                status: 'completed'
            }),
            Income_1.Income.aggregate([
                {
                    $match: {
                        userId: userObjectId,
                        status: 'confirmed'
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: '$amount' }
                    }
                }
            ])
        ]);
        // 获取最近3个项目
        const recentProjects = await RealProject_1.RealProject.find({
            userId: userObjectId,
            status: 'completed'
        })
            .sort({ completedAt: -1 })
            .limit(3);
        // 计算最强和最弱能力
        const dimensions = latestRadar?.dimensions || [];
        const sortedDimensions = [...dimensions].sort((a, b) => b.score - a.score);
        const strongestAbilities = sortedDimensions.slice(0, 3).map(d => d.name);
        const weakestAbilities = sortedDimensions.slice(-3).map(d => d.name);
        return {
            currentState: {
                overallLevel: latestRadar?.rank || '新手',
                strongestAbilities,
                weakestAbilities,
                completedProjects,
                totalEarnings: totalIncome[0]?.total || 0
            },
            latestRadar,
            recentProjects,
            allDimensions: dimensions
        };
    }
    /**
     * AI生成成长路径
     */
    async generateAIGrowthPath(userData) {
        try {
            const prompt = `根据用户的当前状态，生成个性化的成长路径规划：

**用户当前状态：**
- 综合等级：${userData.currentState.overallLevel}
- 完成项目：${userData.currentState.completedProjects}个
- 总收入：¥${userData.currentState.totalEarnings}
- 最强能力：${userData.currentState.strongestAbilities.join(', ')}
- 待提升能力：${userData.currentState.weakestAbilities.join(', ')}

**能力详情：**
${userData.allDimensions.map((d) => `- ${d.name}: ${d.score}分 (${d.level})`).join('\n')}

**最近完成的项目：**
${userData.recentProjects.map((p, i) => `${i + 1}. ${p.title} (${p.category}, ${p.difficulty})`).join('\n')}

请生成3-5个阶段的成长路径，每个阶段包含：
- 具体的行动建议（学习、实践、社交等）
- 推荐的项目类型和难度
- 能力提升目标

返回JSON格式：
{
  "phases": [
    {
      "phaseNumber": 1,
      "phaseName": "阶段名称",
      "goal": "阶段目标",
      "duration": "预计1-2个月",
      "actions": [
        {
          "actionType": "learn_skill",
          "title": "学习XX技能",
          "description": "详细描述",
          "priority": "high",
          "estimatedTime": "2周",
          "expectedOutcome": "掌握XX"
        }
      ],
      "recommendedProjects": [
        {
          "category": "项目类别",
          "difficulty": "medium",
          "reason": "原因"
        }
      ],
      "abilityGoals": [
        {
          "ability": "沟通表达力",
          "currentScore": 65,
          "targetScore": 75,
          "improvementPath": "通过XX方式提升"
        }
      ]
    }
  ],
  "milestones": [
    {
      "title": "里程碑1",
      "description": "描述",
      "targetDate": null,
      "completed": false
    }
  ],
  "predictions": {
    "expectedLevel": "专家",
    "expectedTimeframe": "6-12个月",
    "expectedEarnings": 50000,
    "confidenceLevel": "中"
  }
}`;
            const completion = await openai_1.openai.chat.completions.create({
                model: openai_1.AI_CONFIG.model,
                messages: [
                    {
                        role: 'system',
                        content: `你是职业成长规划专家，擅长根据用户当前状态制定个性化的成长路径。

要求：
1. 路径要循序渐进，符合用户当前水平
2. 建议要具体可执行，不要空洞
3. 项目推荐要与能力提升目标匹配
4. 预测要基于数据，不要过于乐观`
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.8,
                max_tokens: 4000,
                response_format: { type: 'json_object' }
            });
            const resultText = completion.choices[0].message.content || '{}';
            const result = JSON.parse(resultText);
            return {
                phases: result.phases || [],
                milestones: result.milestones || [],
                predictions: result.predictions || {}
            };
        }
        catch (error) {
            logger_1.log.error('AI生成成长路径失败', { error: error.message });
            throw error;
        }
    }
    /**
     * 获取最新成长路径
     */
    async getLatestGrowthPath(userId) {
        const path = await DynamicGrowthPath_1.DynamicGrowthPath.findOne({
            userId: new mongoose_1.default.Types.ObjectId(userId)
        }).sort({ versionNumber: -1 });
        return path;
    }
    /**
     * 获取成长路径历史
     */
    async getGrowthPathHistory(userId) {
        const paths = await DynamicGrowthPath_1.DynamicGrowthPath.find({
            userId: new mongoose_1.default.Types.ObjectId(userId)
        }).sort({ versionNumber: 1 });
        return paths;
    }
    /**
     * 更新里程碑状态
     */
    async updateMilestone(userId, milestoneTitle, completed) {
        const latestPath = await this.getLatestGrowthPath(userId);
        if (!latestPath) {
            throw new Error('成长路径不存在');
        }
        const milestone = latestPath.milestones.find(m => m.title === milestoneTitle);
        if (!milestone) {
            throw new Error('里程碑不存在');
        }
        milestone.completed = completed;
        if (completed) {
            milestone.completedAt = new Date();
        }
        else {
            milestone.completedAt = undefined;
        }
        await latestPath.save();
        logger_1.log.info('里程碑状态更新', { userId, milestoneTitle, completed });
        return latestPath;
    }
}
exports.DynamicGrowthPathService = DynamicGrowthPathService;
exports.dynamicGrowthPathService = new DynamicGrowthPathService();
//# sourceMappingURL=dynamicGrowthPath.service.js.map