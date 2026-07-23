"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const database_1 = require("../config/database");
const User_1 = require("../models/User");
const Assessment_1 = require("../models/Assessment");
const AbilityRadar_1 = require("../models/AbilityRadar");
const RealProject_1 = require("../models/RealProject");
const Income_1 = require("../models/Income");
const Withdrawal_1 = require("../models/Withdrawal");
const ComparisonReport_1 = require("../models/ComparisonReport");
const DynamicGrowthPath_1 = require("../models/DynamicGrowthPath");
const GraduationReport_1 = require("../models/GraduationReport");
/**
 * 生成个性化系统测试数据
 */
async function generatePersonalizedTestData() {
    try {
        console.log('开始生成个性化系统测试数据...\n');
        // 清空相关集合
        await Promise.all([
            Assessment_1.Assessment.deleteMany({}),
            AbilityRadar_1.AbilityRadar.deleteMany({}),
            RealProject_1.RealProject.deleteMany({}),
            Income_1.Income.deleteMany({}),
            Withdrawal_1.Withdrawal.deleteMany({}),
            ComparisonReport_1.ComparisonReport.deleteMany({}),
            DynamicGrowthPath_1.DynamicGrowthPath.deleteMany({}),
            GraduationReport_1.GraduationReport.deleteMany({})
        ]);
        // 获取已有用户
        const users = await User_1.User.find().limit(3);
        if (users.length === 0) {
            console.log('❌ 没有找到用户，请先运行基础数据种子脚本');
            return;
        }
        console.log(`✓ 找到 ${users.length} 个用户\n`);
        // 为每个用户生成完整的成长历程
        for (let i = 0; i < users.length; i++) {
            const user = users[i];
            console.log(`[用户${i + 1}] ${user.nickname || user.openId}`);
            console.log('─────────────────────────────');
            // 1. 第一次OC测评
            const assessment1 = await createAssessment(user._id, 1, {
                communicationScore: 60 + i * 5,
                executionScore: 65 + i * 5,
                innovationScore: 55 + i * 5,
                logicScore: 70 + i * 5
            });
            console.log(`  ✓ 第1次测评: ${assessment1.result.identityTags.join(', ')}`);
            // 2. 第一次测评的雷达图
            const radar1 = await createAbilityRadar(user._id, 1, 'assessment', assessment1._id, {
                communicationScore: 60 + i * 5,
                executionScore: 65 + i * 5,
                innovationScore: 55 + i * 5,
                logicScore: 70 + i * 5
            });
            console.log(`  ✓ 雷达图快照#1: 综合${radar1.overallScore}分 (${radar1.rank})`);
            // 3. 完成第1个真实项目
            const project1 = await createRealProject(user._id, 1, 'easy', 1500);
            console.log(`  ✓ 真实项目#1: ${project1.title} (净收入¥${project1.netIncome})`);
            // 4. 项目1的收入
            await createIncome(user._id, 'real_project', project1._id, project1.netIncome);
            console.log(`  ✓ 收入记录: +¥${project1.netIncome}`);
            // 5. 项目1完成后的雷达图
            const radar2 = await createAbilityRadar(user._id, 2, 'project_completed', project1._id, {
                communicationScore: 65 + i * 5,
                executionScore: 70 + i * 5,
                innovationScore: 58 + i * 5,
                logicScore: 72 + i * 5
            });
            console.log(`  ✓ 雷达图快照#2: 综合${radar2.overallScore}分 (${radar2.rank}, 成长+${radar2.overallScore - radar1.overallScore})`);
            // 6. 第1次对比报告（测评 vs 项目1）
            const comparison1 = await createComparisonReport(user._id, 1, radar1, radar2);
            console.log(`  ✓ 对比报告#1: 整体成长+${comparison1.analysis.overallGrowth}分`);
            // 7. 完成第2个真实项目
            const project2 = await createRealProject(user._id, 2, 'medium', 2800);
            console.log(`  ✓ 真实项目#2: ${project2.title} (净收入¥${project2.netIncome})`);
            await createIncome(user._id, 'real_project', project2._id, project2.netIncome);
            console.log(`  ✓ 收入记录: +¥${project2.netIncome}`);
            // 8. 项目2完成后的雷达图
            const radar3 = await createAbilityRadar(user._id, 3, 'project_completed', project2._id, {
                communicationScore: 72 + i * 5,
                executionScore: 75 + i * 5,
                innovationScore: 65 + i * 5,
                logicScore: 78 + i * 5
            });
            console.log(`  ✓ 雷达图快照#3: 综合${radar3.overallScore}分 (${radar3.rank}, 成长+${radar3.overallScore - radar2.overallScore})`);
            // 9. 第2次对比报告（项目2 vs 项目1）
            const comparison2 = await createComparisonReport(user._id, 2, radar2, radar3);
            console.log(`  ✓ 对比报告#2: 整体成长+${comparison2.analysis.overallGrowth}分`);
            // 10. 动态成长路径
            const growthPath = await createDynamicGrowthPath(user._id, radar3, 2, project1.netIncome + project2.netIncome);
            console.log(`  ✓ 成长路径: ${growthPath.phases.length}个阶段`);
            // 11. 申请提现
            if (i === 0) {
                const withdrawal = await createWithdrawal(user._id, 1000);
                console.log(`  ✓ 提现记录: ¥${withdrawal.amount} (实际到账¥${withdrawal.actualAmount})`);
            }
            console.log();
        }
        // 为第一个用户生成毕业报告（演示用）
        const firstUser = users[0];
        const graduationReport = await GraduationReport_1.GraduationReport.create({
            userId: firstUser._id,
            status: 'completed',
            isUnlocked: false,
            journeySummary: {
                startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
                endDate: new Date(),
                totalDays: 90,
                firstAssessmentDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
                lastAssessmentDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                assessmentCount: 1
            },
            projectAchievements: {
                practiceProjects: 4,
                realProjects: 2,
                totalProjects: 6,
                projectCategories: ['UI设计', 'Web开发'],
                clientSatisfaction: 4.7
            },
            abilityGrowth: {
                initialLevel: '新手',
                finalLevel: '进阶',
                levelUpCount: 1,
                dimensionGrowth: [],
                allAbilityTags: ['执行力', '沟通力', '逻辑思维', 'UI设计'],
                totalAbilityCount: 4,
                mostImprovedDimension: { dimension: '执行力', growth: 10 }
            },
            financialSummary: {
                totalEarnings: 4300,
                totalWithdrawals: 1000,
                currentBalance: 3300,
                averageProjectEarnings: 2150,
                highestProjectEarnings: 2800
            },
            aiEvaluation: {
                overallAssessment: '在过去的3个月里，你从新手成长为进阶选手，完成了6个项目，获得客户高度认可。',
                strengthsAnalysis: '你的执行力和逻辑思维是最大优势，能够高效完成任务。',
                achievementsHighlight: [
                    '3个月内完成6个项目',
                    '客户满意度达到4.7/5',
                    '执行力提升10分'
                ],
                growthStory: '从第一次测评开始，你就展现出了强大的执行力。通过不断的项目实践，你的沟通能力和逻辑思维都有显著提升。',
                futureRecommendations: [
                    '继续提升创新能力',
                    '尝试更高难度的项目',
                    '学习团队协作技能'
                ],
                careerPathSuggestions: [
                    '产品经理方向',
                    '项目管理方向',
                    '技术专家方向'
                ]
            },
            certificate: {
                certificateId: `OPC-${Date.now()}-TEST`,
                issuedAt: new Date(),
                level: '中级',
                specialization: ['执行力', '逻辑思维', 'UI设计']
            }
        });
        console.log(`[毕业报告] 为用户1生成毕业报告 (证书: ${graduationReport.certificate.certificateId})\n`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('✓ 个性化系统测试数据生成完成！');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        console.log('生成的数据：');
        console.log(`  • OC测评: ${await Assessment_1.Assessment.countDocuments({})} 条`);
        console.log(`  • 能力雷达图: ${await AbilityRadar_1.AbilityRadar.countDocuments({})} 个快照`);
        console.log(`  • 真实项目: ${await RealProject_1.RealProject.countDocuments({})} 个`);
        console.log(`  • 收入记录: ${await Income_1.Income.countDocuments({})} 条`);
        console.log(`  • 提现记录: ${await Withdrawal_1.Withdrawal.countDocuments({})} 条`);
        console.log(`  • 对比报告: ${await ComparisonReport_1.ComparisonReport.countDocuments({})} 份`);
        console.log(`  • 成长路径: ${await DynamicGrowthPath_1.DynamicGrowthPath.countDocuments({})} 份`);
        console.log(`  • 毕业报告: ${await GraduationReport_1.GraduationReport.countDocuments({})} 份\n`);
    }
    catch (error) {
        console.error('生成测试数据失败:', error);
    }
}
// 辅助函数
async function createAssessment(userId, number, scores) {
    return await Assessment_1.Assessment.create({
        userId,
        assessmentNumber: number,
        answers: [],
        result: {
            identityTags: ['执行者', '思考者', '沟通者'][Math.floor(Math.random() * 3)] === '执行者'
                ? ['执行者', '实干家']
                : ['思考者', '分析师'],
            abilityScores: [
                { dimension: '沟通表达力', score: scores.communicationScore, level: getLevel(scores.communicationScore) },
                { dimension: '执行推进力', score: scores.executionScore, level: getLevel(scores.executionScore) },
                { dimension: '创新思维力', score: scores.innovationScore, level: getLevel(scores.innovationScore) },
                { dimension: '逻辑分析力', score: scores.logicScore, level: getLevel(scores.logicScore) },
                { dimension: '团队协作力', score: 60, level: '初级' },
                { dimension: '学习适应力', score: 65, level: '中级' },
                { dimension: '问题解决力', score: 68, level: '中级' },
                { dimension: '资源整合力', score: 55, level: '初级' }
            ],
            personalityType: 'INTJ',
            strengthAreas: ['执行力', '逻辑思维'],
            improvementAreas: ['创新能力']
        },
        completedAt: new Date()
    });
}
async function createAbilityRadar(userId, number, triggerType, triggerRefId, scores) {
    const dimensions = [
        { name: '沟通表达力', score: scores.communicationScore },
        { name: '执行推进力', score: scores.executionScore },
        { name: '创新思维力', score: scores.innovationScore },
        { name: '逻辑分析力', score: scores.logicScore },
        { name: '团队协作力', score: 60 },
        { name: '学习适应力', score: 65 },
        { name: '问题解决力', score: 68 },
        { name: '资源整合力', score: 55 }
    ].map(d => ({
        ...d,
        description: `${d.name}相关能力`,
        level: getLevel(d.score),
        growth: 0,
        tags: []
    }));
    const overallScore = Math.round(dimensions.reduce((sum, d) => sum + d.score, 0) / dimensions.length);
    return await AbilityRadar_1.AbilityRadar.create({
        userId,
        snapshotNumber: number,
        triggerType,
        triggerRefId,
        dimensions,
        overallScore,
        rank: getRank(overallScore)
    });
}
async function createRealProject(userId, number, difficulty, budget) {
    const titles = [
        '电商小程序首页设计',
        'CRM系统前端开发',
        '品牌Logo设计',
        '企业官网响应式改造',
        '移动App UI设计'
    ];
    const project = await RealProject_1.RealProject.create({
        userId,
        projectNumber: number,
        title: titles[Math.floor(Math.random() * titles.length)],
        description: '这是一个真实的客户项目',
        category: ['UI设计', 'Web开发', '小程序开发'][Math.floor(Math.random() * 3)],
        difficulty,
        requiredAbilities: ['执行力', '沟通力'],
        budget,
        actualEarnings: budget,
        platformCommission: Math.round(budget * 0.15 * 100) / 100,
        netIncome: Math.round((budget * 0.85) * 100) / 100,
        status: 'completed',
        appliedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        acceptedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000),
        startedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000),
        completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        deliverables: [
            {
                type: 'design',
                url: 'https://example.com/file.pdf',
                description: '设计稿'
            }
        ],
        clientRating: {
            score: 4.5 + Math.random() * 0.5,
            comment: '非常满意，完成质量高',
            tags: ['高效', '专业']
        },
        abilitiesGained: ['项目管理'],
        abilitiesImproved: ['沟通表达', '执行力']
    });
    return project;
}
async function createIncome(userId, source, refId, amount) {
    return await Income_1.Income.create({
        userId,
        source,
        sourceRefId: refId,
        amount,
        description: `完成项目收入`,
        status: 'confirmed',
        confirmedAt: new Date()
    });
}
async function createWithdrawal(userId, amount) {
    const fee = Math.max(1, Math.round(amount * 0.01 * 100) / 100);
    return await Withdrawal_1.Withdrawal.create({
        userId,
        amount,
        fee,
        actualAmount: amount - fee,
        withdrawalMethod: 'wechat',
        withdrawalAccount: '****1234',
        status: 'completed',
        completedAt: new Date()
    });
}
async function createComparisonReport(userId, number, beforeRadar, afterRadar) {
    const dimensionChanges = afterRadar.dimensions.map((afterDim, index) => {
        const beforeDim = beforeRadar.dimensions[index];
        const change = afterDim.score - beforeDim.score;
        return {
            dimension: afterDim.name,
            beforeScore: beforeDim.score,
            afterScore: afterDim.score,
            change,
            changePercent: `${((change / beforeDim.score) * 100).toFixed(1)}%`,
            evaluation: `${afterDim.name}有显著提升`
        };
    });
    return await ComparisonReport_1.ComparisonReport.create({
        userId,
        comparisonNumber: number,
        beforeSnapshot: {
            type: beforeRadar.triggerType === 'assessment' ? 'assessment' : 'project',
            refId: beforeRadar.triggerRefId,
            date: beforeRadar.createdAt,
            abilityRadarId: beforeRadar._id,
            overallScore: beforeRadar.overallScore
        },
        afterSnapshot: {
            type: afterRadar.triggerType === 'assessment' ? 'assessment' : 'project',
            refId: afterRadar.triggerRefId,
            date: afterRadar.createdAt,
            abilityRadarId: afterRadar._id,
            overallScore: afterRadar.overallScore
        },
        analysis: {
            dimensionChanges,
            newAbilities: ['项目管理'],
            improvedAbilities: ['沟通表达', '执行力'],
            stableAbilities: ['逻辑分析'],
            overallGrowth: afterRadar.overallScore - beforeRadar.overallScore,
            summary: '这段时间能力有显著提升',
            recommendations: ['继续保持', '多做项目']
        }
    });
}
async function createDynamicGrowthPath(userId, latestRadar, projectCount, totalEarnings) {
    return await DynamicGrowthPath_1.DynamicGrowthPath.create({
        userId,
        versionNumber: 1,
        currentState: {
            overallLevel: latestRadar.rank,
            strongestAbilities: ['执行力', '逻辑思维'],
            weakestAbilities: ['创新力'],
            completedProjects: projectCount,
            totalEarnings
        },
        phases: [
            {
                phaseNumber: 1,
                phaseName: '能力巩固期',
                goal: '提升执行力到80分',
                duration: '1-2个月',
                actions: [
                    {
                        actionType: 'do_project',
                        title: '接中等难度项目',
                        description: '通过实践提升能力',
                        priority: 'high',
                        estimatedTime: '2周',
                        expectedOutcome: '执行力+5分'
                    }
                ],
                recommendedProjects: [
                    {
                        category: 'UI设计',
                        difficulty: 'medium',
                        reason: '符合当前水平'
                    }
                ],
                abilityGoals: [
                    {
                        ability: '执行力',
                        currentScore: 75,
                        targetScore: 80,
                        improvementPath: '多做项目'
                    }
                ]
            }
        ],
        milestones: [
            {
                title: '完成5个项目',
                description: '达到进阶水平',
                completed: false
            }
        ],
        predictions: {
            expectedLevel: '熟练',
            expectedTimeframe: '3-4个月',
            expectedEarnings: 10000,
            confidenceLevel: '中'
        }
    });
}
function getLevel(score) {
    if (score >= 85)
        return '专家';
    if (score >= 70)
        return '高级';
    if (score >= 50)
        return '中级';
    return '初级';
}
function getRank(score) {
    if (score >= 90)
        return '大师';
    if (score >= 80)
        return '专家';
    if (score >= 70)
        return '熟练';
    if (score >= 50)
        return '进阶';
    return '新手';
}
// 执行
(0, database_1.connectDatabase)().then(() => {
    generatePersonalizedTestData().then(() => {
        mongoose_1.default.connection.close();
        process.exit(0);
    });
});
//# sourceMappingURL=seedPersonalized.js.map