"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOPCResult = exports.submitOPCTest = void 0;
const logger_1 = __importDefault(require("../utils/logger"));
const db_1 = require("../utils/db");
/**
 * 提交OPC测试结果
 * POST /api/opc/submit
 */
const submitOPCTest = async (req, res) => {
    const { userId, answers } = req.body;
    if (!userId || !answers || !Array.isArray(answers) || answers.length !== 36) {
        return res.status(400).json({ error: '参数错误：需要userId和36道题的答案' });
    }
    try {
        // 1. 按维度分组计算得分
        const dimensionScores = {
            information_processing: [],
            creation_drive: [],
            tool_learning: [],
            task_execution: [],
            collaboration: [],
            risk_attitude: []
        };
        // 题目维度映射（每个维度6题）
        const questionDimensions = [
            'information_processing', 'information_processing', 'information_processing', 'information_processing', 'information_processing', 'information_processing',
            'creation_drive', 'creation_drive', 'creation_drive', 'creation_drive', 'creation_drive', 'creation_drive',
            'tool_learning', 'tool_learning', 'tool_learning', 'tool_learning', 'tool_learning', 'tool_learning',
            'task_execution', 'task_execution', 'task_execution', 'task_execution', 'task_execution', 'task_execution',
            'collaboration', 'collaboration', 'collaboration', 'collaboration', 'collaboration', 'collaboration',
            'risk_attitude', 'risk_attitude', 'risk_attitude', 'risk_attitude', 'risk_attitude', 'risk_attitude'
        ];
        answers.forEach((answer, index) => {
            const dimension = questionDimensions[index];
            dimensionScores[dimension].push(answer.score);
        });
        // 2. 计算每个维度的原始分（0-18）和归一化分（0-100）
        const rawScores = {};
        const normalizedScores = {};
        Object.keys(dimensionScores).forEach(dimension => {
            const scores = dimensionScores[dimension];
            const rawScore = scores.reduce((a, b) => a + b, 0);
            rawScores[dimension] = rawScore;
            normalizedScores[dimension] = Math.round((rawScore / 18) * 100);
        });
        // 3. 生成人格标签
        const personalityTag = generatePersonalityTag(normalizedScores);
        // 4. 生成维度解读
        const interpretations = generateInterpretations(normalizedScores);
        // 5. 生成推荐信息
        const recommendations = generateRecommendations(personalityTag);
        // 6. 保存到数据库
        const result = await (0, db_1.query)(`INSERT INTO user_opc_results (
        user_id, test_version,
        information_processing_score, creation_drive_score, tool_learning_score,
        task_execution_score, collaboration_score, risk_attitude_score,
        information_processing_normalized, creation_drive_normalized, tool_learning_normalized,
        task_execution_normalized, collaboration_normalized, risk_attitude_normalized,
        personality_tag, personality_description, dimension_interpretations,
        recommended_track, recommended_level, recommended_first_task, answers
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
      RETURNING id`, [
            userId, '2.0',
            rawScores.information_processing, rawScores.creation_drive, rawScores.tool_learning,
            rawScores.task_execution, rawScores.collaboration, rawScores.risk_attitude,
            normalizedScores.information_processing, normalizedScores.creation_drive, normalizedScores.tool_learning,
            normalizedScores.task_execution, normalizedScores.collaboration, normalizedScores.risk_attitude,
            personalityTag.key, personalityTag.description, JSON.stringify(interpretations),
            recommendations.track, recommendations.level, recommendations.firstTask, JSON.stringify(answers)
        ]);
        // 7. 更新用户表
        await (0, db_1.query)(`UPDATE users SET opc_personality_tag = $1, opc_completed_at = NOW(), opc_test_version = $2 WHERE id = $3`, [personalityTag.key, '2.0', userId]);
        res.json({
            success: true,
            result: {
                id: result[0].id,
                scores: normalizedScores,
                personalityTag: personalityTag,
                interpretations: interpretations,
                recommendations: recommendations
            }
        });
    }
    catch (error) {
        logger_1.default.error('提交OPC测试失败:', error);
        res.status(500).json({ error: '服务器错误' });
    }
};
exports.submitOPCTest = submitOPCTest;
/**
 * 获取用户OPC测试结果
 * GET /api/opc/result/:userId
 */
const getOPCResult = async (req, res) => {
    const { userId } = req.params;
    try {
        const result = await (0, db_1.query)(`SELECT * FROM user_opc_results WHERE user_id = $1 ORDER BY completed_at DESC LIMIT 1`, [userId]);
        if (result.length === 0) {
            return res.status(404).json({ error: '未找到测试结果' });
        }
        const data = result[0];
        res.json({
            success: true,
            result: {
                scores: {
                    information_processing: data.information_processing_normalized,
                    creation_drive: data.creation_drive_normalized,
                    tool_learning: data.tool_learning_normalized,
                    task_execution: data.task_execution_normalized,
                    collaboration: data.collaboration_normalized,
                    risk_attitude: data.risk_attitude_normalized
                },
                personalityTag: {
                    key: data.personality_tag,
                    description: data.personality_description
                },
                interpretations: data.dimension_interpretations,
                recommendations: {
                    track: data.recommended_track,
                    level: data.recommended_level,
                    firstTask: data.recommended_first_task
                },
                completedAt: data.completed_at
            }
        });
    }
    catch (error) {
        logger_1.default.error('获取OPC结果失败:', error);
        res.status(500).json({ error: '服务器错误' });
    }
};
exports.getOPCResult = getOPCResult;
/**
 * 生成人格标签
 */
function generatePersonalityTag(scores) {
    const { information_processing, creation_drive, tool_learning, task_execution, collaboration, risk_attitude } = scores;
    const PERSONALITY_TAGS = {
        visual_storyteller: {
            key: 'visual_storyteller',
            name: '视觉叙事者',
            description: '你擅长用画面讲故事，能看到各个元素之间的联系，把抽象概念转化成具体视觉。',
            track: 'AI内容创作',
            level: 'Lv.1 试流者',
            firstTask: 'AI图文内容制作（小红书/公众号配图、产品宣传图等）'
        },
        system_builder: {
            key: 'system_builder',
            name: '系统构建者',
            description: '你习惯先理解底层逻辑再动手，擅长设计规则和系统。',
            track: 'AI工具开发',
            level: 'Lv.1 试流者',
            firstTask: '工作流搭建、Agent设计、自动化系统'
        },
        creative_executor: {
            key: 'creative_executor',
            name: '创意执行者',
            description: '你享受从0到1的创作过程，喜欢快速出稿再打磨。',
            track: 'AI内容创作',
            level: 'Lv.1 试流者',
            firstTask: '社交媒体内容、广告素材制作'
        },
        logic_analyzer: {
            key: 'logic_analyzer',
            name: '逻辑拆解者',
            description: '你擅长把复杂问题拆成可执行的步骤，逻辑清晰，独立工作能力强。',
            track: 'AI数据处理',
            level: 'Lv.1 试流者',
            firstTask: '数据处理、代码实现、精细执行项目'
        },
        stable_deliverer: {
            key: 'stable_deliverer',
            name: '稳健交付者',
            description: '你追求稳定高质量的交付，做事有规划，不轻易冒险。',
            track: '通用赛道',
            level: 'Lv.1 试流者',
            firstTask: '对质量要求高、周期明确的项目'
        },
        explorer_integrator: {
            key: 'explorer_integrator',
            name: '探索整合者',
            description: '你擅长快速掌握新工具，并把不同的东西组合在一起创造新价值。',
            track: 'AI工具应用',
            level: 'Lv.1 试流者',
            firstTask: '探索性项目、新工具应用、跨领域整合'
        },
        balanced: {
            key: 'balanced',
            name: '混合型',
            description: '你的工作风格比较灵活，能根据项目需要调整自己的方式。建议通过完成前3个任务，让系统更精准地识别你的方向。',
            track: '通用赛道',
            level: 'Lv.0 涉水者',
            firstTask: '尝试不同类型的项目，找到自己的方向'
        }
    };
    // 判断人格标签
    if (creation_drive <= 40 && information_processing >= 60) {
        return PERSONALITY_TAGS.visual_storyteller;
    }
    if (creation_drive >= 60 && information_processing >= 60 && tool_learning >= 60) {
        return PERSONALITY_TAGS.system_builder;
    }
    if (creation_drive <= 40 && task_execution >= 60 && risk_attitude >= 60) {
        return PERSONALITY_TAGS.creative_executor;
    }
    if (information_processing <= 40 && creation_drive >= 60 && collaboration <= 40) {
        return PERSONALITY_TAGS.logic_analyzer;
    }
    if (task_execution <= 40 && risk_attitude <= 40 && collaboration <= 40) {
        return PERSONALITY_TAGS.stable_deliverer;
    }
    if (tool_learning <= 40 && information_processing >= 60 && risk_attitude >= 60) {
        return PERSONALITY_TAGS.explorer_integrator;
    }
    return PERSONALITY_TAGS.balanced;
}
/**
 * 生成维度解读
 */
function generateInterpretations(scores) {
    const DIMENSION_INTERPRETATIONS = {
        information_processing: {
            low: '拆解型：你喜欢把大问题切成小块逐一解决。面对复杂任务，你习惯先分解再执行。这种风格让你在需要精细执行的项目中表现出色。',
            mid: '平衡型：你能根据情况选择拆解或整合的方式。既能关注细节，也能看到全局。',
            high: '整合型：你喜欢先看到全貌再动手。面对复杂任务，你习惯先理解各部分之间的关系。这种风格让你在做品牌视觉、系列内容时能保持整体一致性。'
        },
        creation_drive: {
            low: '视觉型：你的创作灵感来源于画面。你对色彩、构图、光影敏感，能用视觉语言传达情绪和故事。你适合AI生图、视频制作、视觉设计类项目。',
            mid: '混合型：你在视觉和逻辑之间找到了平衡，既能做视觉内容，也能做结构化工作。',
            high: '逻辑型：你的创作灵感来源于规则和结构。你擅长信息架构、系统设计、逻辑梳理。你适合AI工具开发、工作流设计类项目。'
        },
        tool_learning: {
            low: '探索型：你习惯边用边学，拿到新工具直接上手试。这种方式让你快速产出，但有时会漏掉一些高级功能。建议每完成3个项目，花一点时间系统了解工具的核心逻辑。',
            mid: '适应型：你能根据工具类型选择学习方式，既能快速上手，也能深入学习。',
            high: '手册型：你习惯先看文档教程，理解原理再动手。这种方式让你能充分发挥工具的能力，但上手速度可能稍慢。'
        },
        task_execution: {
            low: '规划型：你喜欢先做详细计划，按步骤执行。这种风格让你在长周期项目中保持稳定，但在快速迭代的项目中可能需要更灵活。',
            mid: '灵活型：你不太喜欢僵硬的计划，更倾向于在过程中调整。你适合需要快速响应和迭代的项目。',
            high: '迭代型：你喜欢先快速出一个粗糙版本，再一轮轮打磨。这种风格让你能快速验证方向，适合探索性项目。'
        },
        collaboration: {
            low: '独立型：你更喜欢自己掌控完整的工作流程。在团队项目中，你最适合负责一个相对独立的模块。',
            mid: '弹性型：你能根据项目需要选择独立或协作的方式，适应性强。',
            high: '协作型：你享受和他人分工配合的过程。你擅长沟通协调，能在团队中发挥连接作用。'
        },
        risk_attitude: {
            low: '稳健型：你选择有把握的任务，确保交付质量。这种风格让你能稳定输出，但可能错过一些成长机会。建议偶尔尝试"冒险项目"。',
            mid: '审慎型：你愿意尝试新东西，但会在心里先评估可行性。这种平衡让你既能接有挑战的项目，又不会让自己陷入失控。',
            high: '冒险型：你愿意挑战没做过的事，边做边学。这种风格让你成长快速，但要注意控制风险，避免接超出能力太多的项目。'
        }
    };
    const interpretations = {};
    Object.keys(scores).forEach(dimension => {
        const score = scores[dimension];
        const templates = DIMENSION_INTERPRETATIONS[dimension];
        if (score <= 40) {
            interpretations[dimension] = templates.low;
        }
        else if (score <= 60) {
            interpretations[dimension] = templates.mid;
        }
        else {
            interpretations[dimension] = templates.high;
        }
    });
    return interpretations;
}
/**
 * 生成推荐信息
 */
function generateRecommendations(personalityTag) {
    return {
        track: personalityTag.track,
        level: personalityTag.level,
        firstTask: personalityTag.firstTask
    };
}
//# sourceMappingURL=opcController.js.map