"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../utils/db");
const logger_1 = __importDefault(require("../utils/logger"));
const vectorEmbeddingService_1 = __importDefault(require("./vectorEmbeddingService"));
class OPCAnalysisService {
    /**
     * 从OPC测试结果生成学生的工作条件画像
     */
    async generateWorkConditionProfile(testResult) {
        logger_1.default.info(`Generating work condition profile for student ${testResult.studentId}`);
        // 1. 分析信息接收方式
        const informationReception = this.analyzeInformationReception(testResult);
        // 2. 分析创作驱动来源
        const creationDrive = this.analyzeCreationDrive(testResult);
        // 3. 分析学习切入方式
        const learningApproach = this.analyzeLearningApproach(testResult);
        // 4. 分析执行节奏
        const executionRhythm = this.analyzeExecutionRhythm(testResult);
        // 5. 分析自主度需求
        const autonomyNeed = this.analyzeAutonomyNeed(testResult);
        // 6. 分析风险承受度
        const riskTolerance = this.analyzeRiskTolerance(testResult);
        // 7. 推导核心优势
        const coreStrengths = this.deriveCoreStrengths(testResult, {
            informationReception,
            creationDrive,
            learningApproach,
            executionRhythm,
            autonomyNeed,
            riskTolerance
        });
        // 8. 生成综合画像文本
        const profileText = this.generateProfileText(testResult.personalityTag, informationReception, creationDrive, learningApproach, executionRhythm, autonomyNeed, riskTolerance, coreStrengths);
        return {
            studentId: testResult.studentId,
            informationReception,
            creationDrive,
            learningApproach,
            executionRhythm,
            autonomyNeed,
            riskTolerance,
            profileText,
            coreStrengths
        };
    }
    /**
     * 分析信息接收方式
     */
    analyzeInformationReception(testResult) {
        const score = testResult.scores.informationProcessing;
        if (score > 7) {
            // 整体型：先看全局再拆解
            return {
                preference: '习惯先理解各部分之间的联系再动手，善于从整体框架出发',
                idealCondition: '项目开始时能看到整体框架和最终效果预期，有明确的参考案例或方向说明',
                unsuitableCondition: '从零散的任务碎片开始工作，没有整体框架就要求立即执行',
                clientType: '能给出明确方向和参考案例的需求方，愿意在开始前花时间讲清楚整体思路'
            };
        }
        else if (score > 4) {
            // 平衡型
            return {
                preference: '既能从整体框架入手，也能从具体任务开始，适应性强',
                idealCondition: '有基本的方向说明，可以边做边理解全局',
                unsuitableCondition: '完全没有任何背景信息的任务',
                clientType: '能提供基本方向的需求方'
            };
        }
        else {
            // 细节型：从具体任务开始
            return {
                preference: '习惯从具体的、可执行的任务开始，在执行中逐步理解全局',
                idealCondition: '有明确的第一步可以立即开始，不需要先理解整个系统',
                unsuitableCondition: '必须先理解整体架构才能开始的项目',
                clientType: '能把大任务拆解成具体小任务的需求方'
            };
        }
    }
    /**
     * 分析创作驱动来源
     */
    analyzeCreationDrive(testResult) {
        const score = testResult.scores.creationDrive;
        if (score > 7) {
            // 视觉驱动型
            return {
                source: '灵感来源于视觉元素，对色彩和构图敏感，善于用画面传递情绪',
                motivation: '看到自己做出的东西好看、有冲击力，能通过视觉表达想法',
                unsuitableTask: '纯文字分析、纯逻辑推演、没有视觉产出的任务',
                projectType: '品牌视觉设计、社交媒体创意内容、产品宣传图制作、UI/UX设计'
            };
        }
        else if (score > 4) {
            // 混合驱动型
            return {
                source: '既能从视觉中获得灵感，也能从逻辑推演中找到乐趣',
                motivation: '看到自己的想法变成可见的成果，无论是视觉还是功能',
                unsuitableTask: '纯粹重复性的、没有创造空间的任务',
                projectType: '产品设计、交互设计、内容创作、多媒体项目'
            };
        }
        else {
            // 逻辑驱动型
            return {
                source: '动力来自解决问题、优化流程、让系统更高效',
                motivation: '看到自己的方案解决了实际问题，提升了效率',
                unsuitableTask: '纯视觉表现、没有明确问题要解决的任务',
                projectType: '功能开发、流程优化、数据分析、系统设计'
            };
        }
    }
    /**
     * 分析学习切入方式
     */
    analyzeLearningApproach(testResult) {
        const score = testResult.scores.learningStyle;
        if (score > 7) {
            // 实践优先型
            return {
                style: '拿到新工具直接上手试，通过实践快速掌握，遇到问题喜欢先自己探索',
                idealStart: '有明确的第一步可以立刻开始，边做边学',
                unsuitableStart: '需要先看大量文档才能动手的项目',
                mentorStyle: '给一个起点，让他边做边学，遇到问题时提供指导'
            };
        }
        else if (score > 4) {
            // 平衡型
            return {
                style: '会先快速浏览文档了解基本概念，然后开始实践',
                idealStart: '有基本的入门指南，可以快速上手',
                unsuitableStart: '完全没有任何参考资料的全新领域',
                mentorStyle: '提供基本的学习资源，然后放手让他探索'
            };
        }
        else {
            // 理论优先型
            return {
                style: '习惯先系统学习理论和原理，理解清楚后再动手',
                idealStart: '有完整的文档和教程，可以先学习再实践',
                unsuitableStart: '需要立即上手、没有时间学习的紧急项目',
                mentorStyle: '提供系统的学习资源和理论指导'
            };
        }
    }
    /**
     * 分析执行节奏
     */
    analyzeExecutionRhythm(testResult) {
        const score = testResult.scores.executionRhythm;
        if (score > 7) {
            // 快速迭代型
            return {
                pattern: '喜欢先出一个快速版本看看方向，再一轮轮打磨优化，而不是一开始就追求完美',
                idealCycle: '周期包含"概念稿→反馈→细化"的迭代过程，允许试错和调整',
                unsuitableCycle: '必须一次做到完美、不允许返工的项目',
                clientExpectation: '需求方能接受迭代的工作方式，愿意在过程中给反馈'
            };
        }
        else if (score > 4) {
            // 平衡型
            return {
                pattern: '会先做一定的规划，然后执行，过程中根据需要调整',
                idealCycle: '有基本的里程碑，但也允许适度调整',
                unsuitableCycle: '完全没有规划的混乱项目，或者完全不允许调整的僵化项目',
                clientExpectation: '需求方有基本的计划，但也能接受合理的调整'
            };
        }
        else {
            // 一次到位型
            return {
                pattern: '习惯先充分规划，然后一次性执行到位，追求高完成度',
                idealCycle: '有充足的时间做前期规划，然后集中执行',
                unsuitableCycle: '需要频繁快速迭代、方向不断变化的项目',
                clientExpectation: '需求方能给出明确稳定的需求，不频繁改动'
            };
        }
    }
    /**
     * 分析自主度需求
     */
    analyzeAutonomyNeed(testResult) {
        const score = testResult.scores.collaborationStyle;
        if (score > 7) {
            // 高自主型
            return {
                level: '在团队中最舒服的状态是自己负责一个完整模块，独立完成后再和他人对接',
                idealCollaboration: '需求方给出方向和目标，具体执行由自己独立完成',
                unsuitableCollaboration: '需要频繁沟通对齐每一个细节、需要实时协作的项目'
            };
        }
        else if (score > 4) {
            // 适度协作型
            return {
                level: '既能独立工作，也能在需要时和团队协作',
                idealCollaboration: '有明确的分工，定期同步进度，关键节点一起讨论',
                unsuitableCollaboration: '完全孤立的工作，或者需要时刻保持同步的工作'
            };
        }
        else {
            // 协作依赖型
            return {
                level: '喜欢在团队中工作，通过讨论和协作来推进任务',
                idealCollaboration: '需求方能频繁沟通，团队成员能随时讨论',
                unsuitableCollaboration: '完全独立、长时间没有反馈的项目'
            };
        }
    }
    /**
     * 分析风险承受度
     */
    analyzeRiskTolerance(testResult) {
        const score = testResult.scores.riskAttitude;
        if (score > 7) {
            // 冒险型
            return {
                attitude: '喜欢尝试新事物，愿意接受不确定性，享受探索的过程',
                idealChallenge: '有创新空间、需要探索的项目，即使结果不确定',
                unsuitableChallenge: '完全按照既定流程、没有任何创新空间的项目'
            };
        }
        else if (score > 4) {
            // 审慎偏冒险型
            return {
                attitude: '愿意接有挑战的项目，但会在心里先评估可行性，不是盲目冒险',
                idealChallenge: '有挑战但有参考案例，方向明确但需要创造性执行',
                unsuitableChallenge: '完全从零探索、没有任何参考的项目，或者完全没有挑战的重复性工作'
            };
        }
        else {
            // 稳健型
            return {
                attitude: '偏好明确的、可控的项目，喜欢在熟悉的领域深耕',
                idealChallenge: '方向明确、有成功案例可参考的项目',
                unsuitableChallenge: '高度不确定、需要大量试错的探索性项目'
            };
        }
    }
    /**
     * 推导核心优势（最适合的项目类型）
     */
    deriveCoreStrengths(testResult, conditions) {
        const strengths = [];
        // 基于创作驱动和信息处理方式推导
        if (testResult.scores.creationDrive > 7 && testResult.scores.informationProcessing > 6) {
            strengths.push('品牌视觉设计', '社交媒体创意内容', '产品宣传图制作');
        }
        else if (testResult.scores.creationDrive > 7) {
            strengths.push('UI/UX设计', '视觉创意', '多媒体内容');
        }
        else if (testResult.scores.creationDrive < 4 && testResult.scores.informationProcessing < 4) {
            strengths.push('功能开发', '数据分析', '流程优化');
        }
        else {
            strengths.push('产品设计', '交互设计', '内容创作');
        }
        return strengths;
    }
    /**
     * 生成综合画像文本（用于向量化匹配）
     */
    generateProfileText(personalityTag, informationReception, creationDrive, learningApproach, executionRhythm, autonomyNeed, riskTolerance, coreStrengths) {
        return `${personalityTag}。工作风格：${informationReception.preference}。创作偏好：${creationDrive.source}。工具习惯：${learningApproach.style}。执行节奏：${executionRhythm.pattern}。协作倾向：${autonomyNeed.level}。风险态度：${riskTolerance.attitude}。核心优势：${coreStrengths.join('、')}。`;
    }
    /**
     * 保存工作条件画像到数据库
     */
    async saveWorkConditionProfile(profile) {
        try {
            // 生成向量
            const profileVector = await vectorEmbeddingService_1.default.generateStudentProfileVector(profile.profileText);
            await (0, db_1.queryOne)(`INSERT INTO student_work_condition_profiles (
          student_id,
          information_reception,
          creation_drive,
          learning_approach,
          execution_rhythm,
          autonomy_need,
          risk_tolerance,
          profile_text,
          profile_vector,
          core_strengths,
          created_at,
          updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
        ON CONFLICT (student_id)
        DO UPDATE SET
          information_reception = $2,
          creation_drive = $3,
          learning_approach = $4,
          execution_rhythm = $5,
          autonomy_need = $6,
          risk_tolerance = $7,
          profile_text = $8,
          profile_vector = $9,
          core_strengths = $10,
          updated_at = NOW()`, [
                profile.studentId,
                JSON.stringify(profile.informationReception),
                JSON.stringify(profile.creationDrive),
                JSON.stringify(profile.learningApproach),
                JSON.stringify(profile.executionRhythm),
                JSON.stringify(profile.autonomyNeed),
                JSON.stringify(profile.riskTolerance),
                profile.profileText,
                profileVector ? JSON.stringify(profileVector) : null,
                profile.coreStrengths
            ]);
            logger_1.default.info(`Saved work condition profile for student ${profile.studentId}${profileVector ? ' with vector' : ''}`);
            // 触发增量匹配：将新学生匹配到所有开放任务
            try {
                const matchingScheduler = require('./matchingScheduler').default;
                // 异步执行，不阻塞主流程
                matchingScheduler.matchNewStudentToOpenTasks(profile.studentId).catch((err) => {
                    logger_1.default.error(`Failed to match new student ${profile.studentId} to open tasks:`, err);
                });
                logger_1.default.info(`Triggered matching for new student ${profile.studentId}`);
            }
            catch (error) {
                logger_1.default.error('Failed to trigger matching:', error);
                // 不抛出错误，匹配失败不应该影响画像保存
            }
        }
        catch (error) {
            logger_1.default.error('Failed to save work condition profile:', error);
            throw error;
        }
    }
}
exports.default = new OPCAnalysisService();
//# sourceMappingURL=opcAnalysisService.js.map