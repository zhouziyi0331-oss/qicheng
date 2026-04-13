"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addReflection = exports.getLifeQuestion = exports.saveLifeQuestion = void 0;
const db_1 = __importDefault(require("../utils/db"));
/**
 * 保存/更新生命问题
 * POST /api/life-question/save
 */
const saveLifeQuestion = async (req, res) => {
    const { userId, question } = req.body;
    if (!userId || !question) {
        return res.status(400).json({ error: '参数错误' });
    }
    try {
        // 检查是否已存在
        const existing = await db_1.default.query(`SELECT id FROM life_questions WHERE student_id = $1`, [userId]);
        if (existing.rows.length > 0) {
            // 更新
            await db_1.default.query(`UPDATE life_questions SET question = $1, updated_at = NOW() WHERE student_id = $2`, [question, userId]);
        }
        else {
            // 新增
            await db_1.default.query(`INSERT INTO life_questions (student_id, question) VALUES ($1, $2)`, [userId, question]);
        }
        res.json({
            success: true,
            message: '生命问题已保存'
        });
    }
    catch (error) {
        console.error('保存生命问题失败:', error);
        res.status(500).json({ error: '服务器错误' });
    }
};
exports.saveLifeQuestion = saveLifeQuestion;
/**
 * 获取生命问题
 * GET /api/life-question/:userId
 */
const getLifeQuestion = async (req, res) => {
    const { userId } = req.params;
    try {
        const result = await db_1.default.query(`SELECT * FROM life_questions WHERE student_id = $1`, [userId]);
        if (result.rows.length === 0) {
            return res.json({
                success: true,
                question: null
            });
        }
        res.json({
            success: true,
            question: result.rows[0]
        });
    }
    catch (error) {
        console.error('获取生命问题失败:', error);
        res.status(500).json({ error: '服务器错误' });
    }
};
exports.getLifeQuestion = getLifeQuestion;
/**
 * 添加反思记录
 * POST /api/life-question/reflection
 */
const addReflection = async (req, res) => {
    const { userId, taskId, reflection } = req.body;
    if (!userId || !taskId || !reflection) {
        return res.status(400).json({ error: '参数错误' });
    }
    try {
        const newReflection = {
            taskId,
            reflection,
            createdAt: new Date().toISOString()
        };
        await db_1.default.query(`UPDATE life_questions
       SET reflections = reflections || $1::jsonb
       WHERE student_id = $2`, [JSON.stringify(newReflection), userId]);
        res.json({
            success: true,
            message: '反思已记录'
        });
    }
    catch (error) {
        console.error('添加反思失败:', error);
        res.status(500).json({ error: '服务器错误' });
    }
};
exports.addReflection = addReflection;
//# sourceMappingURL=lifeQuestionController.js.map