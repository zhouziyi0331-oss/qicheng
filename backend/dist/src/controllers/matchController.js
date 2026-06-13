"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTaskDetailWithMatch = exports.matchTasksForStudent = void 0;
const logger_1 = __importDefault(require("../utils/logger"));
const db_1 = require("../utils/db");
/**
 * 智能项目匹配（升级版）
 * GET /api/tasks/match/:userId
 *
 * 新增功能：
 * 1. 基于OPC人格标签匹配
 * 2. 推荐20%的冒险项目
 * 3. 生成个性化匹配理由
 */
const matchTasksForStudent = async (req, res) => {
    const { userId } = req.params;
    const { limit = 20 } = req.query;
    try {
        // 1. 获取学生信息（包括OPC人格标签）
        const studentResult = await (0, db_1.query)(`SELECT id, level, opc_personality_tag, skills FROM users WHERE id = $1`, [userId]);
        if (studentResult.length === 0) {
            return res.status(404).json({ error: '学生不存在' });
        }
        const student = studentResult[0];
        const studentLevel = student.level || 0;
        const opcTag = student.opc_personality_tag;
        // 2. 获取学生的OPC测试结果（用于生成匹配理由）
        const opcResult = await (0, db_1.query)(`SELECT * FROM user_opc_results WHERE user_id = $1 ORDER BY completed_at DESC LIMIT 1`, [userId]);
        const opcScores = opcResult.length > 0 ? {
            information_processing: opcResult[0].information_processing_normalized,
            creation_drive: opcResult[0].creation_drive_normalized,
            tool_learning: opcResult[0].tool_learning_normalized,
            task_execution: opcResult[0].task_execution_normalized,
            collaboration: opcResult[0].collaboration_normalized,
            risk_attitude: opcResult[0].risk_attitude_normalized
        } : null;
        // 3. 查询可匹配的任务
        // 常规项目：student_level >= task_level
        // 冒险项目：student_level + 2 >= task_level
        const tasksResult = await (0, db_1.query)(`SELECT
        t.*,
        u.company_name,
        CASE
          WHEN t.required_level > $1 THEN true
          ELSE false
        END as is_stretch
      FROM tasks t
      JOIN users u ON t.company_id = u.id
      WHERE t.status = 'published'
        AND t.required_level <= $1 + 2
        AND NOT EXISTS (
          SELECT 1 FROM task_applications ta
          WHERE ta.task_id = t.id AND ta.student_id = $2
        )
      ORDER BY
        CASE WHEN t.required_personality_style = $3 THEN 0 ELSE 1 END,
        t.created_at DESC
      LIMIT $4`, [studentLevel, userId, opcTag, limit]);
        // 4. 计算匹配分数并生成匹配理由
        const tasks = tasksResult.map((task) => {
            const match_score = calculateMatchScore(student, task, opcScores);
            const matchReason = generateMatchReason(student, task, opcScores);
            return {
                ...task,
                match_score: match_score,
                match_reason: matchReason,
                is_stretch_project: task.is_stretch
            };
        });
        // 5. 按匹配分数排序
        tasks.sort((a, b) => b.match_score - a.match_score);
        // 6. 确保冒险项目占比20%
        const stretchTasks = tasks.filter((t) => t.is_stretch_project);
        const regularTasks = tasks.filter((t) => !t.is_stretch_project);
        const targetStretchCount = Math.ceil(tasks.length * 0.2);
        const finalTasks = [
            ...stretchTasks.slice(0, targetStretchCount),
            ...regularTasks.slice(0, tasks.length - targetStretchCount)
        ];
        res.json({
            success: true,
            tasks: finalTasks,
            summary: {
                total: finalTasks.length,
                stretch: stretchTasks.slice(0, targetStretchCount).length,
                regular: regularTasks.slice(0, tasks.length - targetStretchCount).length
            }
        });
    }
    catch (error) {
        logger_1.default.error('项目匹配失败:', error);
        res.status(500).json({ error: '服务器错误' });
    }
};
exports.matchTasksForStudent = matchTasksForStudent;
/**
 * 计算匹配分数
 * 匹配分数 = 技能匹配度 × 0.4 + 人格匹配度 × 0.3 + 等级匹配度 × 0.3
 */
function calculateMatchScore(student, task, opcScores) {
    let score = 0;
    // 1. 技能匹配度（0-40分）
    const studentSkills = student.skills || [];
    const taskSkills = task.required_skills || [];
    const matchedSkills = studentSkills.filter((s) => taskSkills.includes(s));
    const skillScore = taskSkills.length > 0 ? (matchedSkills.length / taskSkills.length) * 40 : 20;
    score += skillScore;
    // 2. 人格匹配度（0-30分）
    if (student.opc_personality_tag && task.required_personality_style) {
        if (student.opc_personality_tag === task.required_personality_style) {
            score += 30; // 完全匹配
        }
        else {
            score += 15; // 部分匹配
        }
    }
    else {
        score += 15; // 无人格标签数据，给中等分
    }
    // 3. 等级匹配度（0-30分）
    const levelDiff = Math.abs(student.level - task.required_level);
    if (levelDiff === 0) {
        score += 30;
    }
    else if (levelDiff === 1) {
        score += 20;
    }
    else if (levelDiff === 2) {
        score += 10;
    }
    else {
        score += 5;
    }
    return Math.round(score);
}
/**
 * 生成个性化匹配理由
 */
function generateMatchReason(student, task, opcScores) {
    const reasons = [];
    // 1. 基于OPC人格标签的理由
    if (student.opc_personality_tag && task.required_personality_style) {
        if (student.opc_personality_tag === task.required_personality_style) {
            const styleDescriptions = {
                'visual_storyteller': '你习惯用画面思考',
                'system_builder': '你擅长设计系统和规则',
                'creative_executor': '你喜欢快速迭代',
                'logic_analyzer': '你擅长拆解复杂问题',
                'stable_deliverer': '你追求稳定高质量交付',
                'explorer_integrator': '你擅长整合不同工具',
                'balanced': '你的工作风格灵活'
            };
            const description = styleDescriptions[student.opc_personality_tag] || '你的工作风格';
            reasons.push(`${description}，这个项目正好需要这种方式`);
        }
    }
    // 2. 基于OPC维度得分的理由
    if (opcScores) {
        if (opcScores.task_execution >= 60 && task.is_urgent) {
            reasons.push('你的快速执行能力适合这个紧急项目');
        }
        if (opcScores.collaboration >= 60 && task.is_team_project) {
            reasons.push('你擅长团队协作，这个项目需要多人配合');
        }
        if (opcScores.risk_attitude >= 60 && task.is_stretch) {
            reasons.push('这是一个冒险项目，能让你快速成长');
        }
    }
    // 3. 基于技能匹配的理由
    const studentSkills = student.skills || [];
    const taskSkills = task.required_skills || [];
    const matchedSkills = studentSkills.filter((s) => taskSkills.includes(s));
    if (matchedSkills.length > 0) {
        reasons.push(`你掌握的${matchedSkills.slice(0, 2).join('、')}技能正好匹配`);
    }
    // 4. 基于等级的理由
    if (task.is_stretch) {
        reasons.push('略高于你当前等级，是个挑战机会');
    }
    // 如果没有生成任何理由，给一个默认理由
    if (reasons.length === 0) {
        reasons.push('这个项目适合你当前的能力水平');
    }
    return reasons.join('；');
}
/**
 * 获取任务详情（增强版，包含匹配理由）
 * GET /api/tasks/:taskId/detail/:userId
 */
const getTaskDetailWithMatch = async (req, res) => {
    const { taskId, userId } = req.params;
    try {
        // 1. 获取任务详情
        const taskResult = await (0, db_1.query)(`SELECT t.*, u.company_name, u.avatar as company_avatar
       FROM tasks t
       JOIN users u ON t.company_id = u.id
       WHERE t.id = $1`, [taskId]);
        if (taskResult.length === 0) {
            return res.status(404).json({ error: '任务不存在' });
        }
        const task = taskResult[0];
        // 2. 获取学生信息
        const studentResult = await (0, db_1.query)(`SELECT id, level, opc_personality_tag, skills FROM users WHERE id = $1`, [userId]);
        if (studentResult.length === 0) {
            return res.status(404).json({ error: '学生不存在' });
        }
        const student = studentResult[0];
        // 3. 获取OPC测试结果
        const opcResult = await (0, db_1.query)(`SELECT * FROM user_opc_results WHERE user_id = $1 ORDER BY completed_at DESC LIMIT 1`, [userId]);
        const opcScores = opcResult.length > 0 ? {
            information_processing: opcResult[0].information_processing_normalized,
            creation_drive: opcResult[0].creation_drive_normalized,
            tool_learning: opcResult[0].tool_learning_normalized,
            task_execution: opcResult[0].task_execution_normalized,
            collaboration: opcResult[0].collaboration_normalized,
            risk_attitude: opcResult[0].risk_attitude_normalized
        } : null;
        // 4. 计算匹配分数和理由
        const match_score = calculateMatchScore(student, task, opcScores);
        const matchReason = generateMatchReason(student, task, opcScores);
        // 5. 判断是否为冒险项目
        const isStretch = task.required_level > student.level;
        res.json({
            success: true,
            task: {
                ...task,
                match_score: match_score,
                match_reason: matchReason,
                is_stretch_project: isStretch
            }
        });
    }
    catch (error) {
        logger_1.default.error('获取任务详情失败:', error);
        res.status(500).json({ error: '服务器错误' });
    }
};
exports.getTaskDetailWithMatch = getTaskDetailWithMatch;
//# sourceMappingURL=matchController.js.map