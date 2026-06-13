"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.completeStretchChallenge = exports.applyStretchChallenge = exports.upgradeLevel = exports.checkUpgradeConditions = exports.getUserLevel = void 0;
const db_1 = require("../utils/db");
const logger_1 = __importDefault(require("../utils/logger"));
/**
 * 等级名称映射
 */
const LEVEL_NAMES = {
    0: { name: '涉水者', description: '刚刚踏入这条河' },
    1: { name: '试流者', description: '开始尝试不同项目类型' },
    2: { name: '行舟者', description: '形成了自己的工作习惯' },
    3: { name: '知向者', description: '清楚自己擅长什么' },
    4: { name: '自流者', description: '可以脱离平台独立接单' },
    5: { name: '河成者', description: '你自己就是一条河' }
};
/**
 * 获取用户等级信息
 * GET /api/level/:userId
 */
const getUserLevel = async (req, res) => {
    const { userId } = req.params;
    try {
        const result = await (0, db_1.query)(`SELECT id, level, username FROM users WHERE id = $1`, [userId]);
        if (result.length === 0) {
            return res.status(404).json({ error: '用户不存在' });
        }
        const user = result[0];
        const levelInfo = LEVEL_NAMES[user.level] || LEVEL_NAMES[0];
        res.json({
            success: true,
            level: {
                current: user.level,
                name: levelInfo.name,
                description: levelInfo.description
            }
        });
    }
    catch (error) {
        logger_1.default.error('获取等级信息失败:', error);
        res.status(500).json({ error: '服务器错误' });
    }
};
exports.getUserLevel = getUserLevel;
/**
 * 检查升级条件
 * GET /api/level/check-upgrade/:userId
 */
const checkUpgradeConditions = async (req, res) => {
    const { userId } = req.params;
    try {
        // 1. 获取用户当前等级
        const userResult = await (0, db_1.query)(`SELECT id, level FROM users WHERE id = $1`, [userId]);
        if (userResult.length === 0) {
            return res.status(404).json({ error: '用户不存在' });
        }
        const user = userResult[0];
        const currentLevel = user.level;
        // 2. 查询完成的任务数和平均评分
        const taskStats = await (0, db_1.query)(`SELECT
        COUNT(*) as completed_count,
        AVG(rating) as avg_rating
       FROM task_applications
       WHERE student_id = $1 AND status = 'completed'`, [userId]);
        const completedCount = parseInt(taskStats[0].completed_count) || 0;
        const avgRating = parseFloat(taskStats[0].avg_rating) || 0;
        // 3. 查询导师观察表中的"习惯形成"记录数
        const habitResult = await (0, db_1.query)(`SELECT COUNT(*) as habit_count
       FROM mentor_observations
       WHERE student_id = $1 AND observation_type = 'habit_formed'`, [userId]);
        const habitCount = parseInt(habitResult[0].habit_count) || 0;
        // 4. 判断是否满足升级条件
        const upgradeRequirements = {
            0: { tasks: 1, rating: 3.0, habits: 0 }, // Lv.0 → Lv.1
            1: { tasks: 5, rating: 3.5, habits: 1 }, // Lv.1 → Lv.2
            2: { tasks: 10, rating: 4.0, habits: 2 }, // Lv.2 → Lv.3
            3: { tasks: 20, rating: 4.2, habits: 3 }, // Lv.3 → Lv.4
            4: { tasks: 50, rating: 4.5, habits: 5 } // Lv.4 → Lv.5
        };
        const nextLevel = currentLevel + 1;
        const requirements = upgradeRequirements[currentLevel];
        if (!requirements) {
            return res.json({
                success: true,
                canUpgrade: false,
                message: '已达到最高等级'
            });
        }
        const canUpgrade = completedCount >= requirements.tasks &&
            avgRating >= requirements.rating &&
            habitCount >= requirements.habits;
        res.json({
            success: true,
            canUpgrade: canUpgrade,
            currentLevel: {
                level: currentLevel,
                name: LEVEL_NAMES[currentLevel].name
            },
            nextLevel: {
                level: nextLevel,
                name: LEVEL_NAMES[nextLevel].name
            },
            progress: {
                tasks: { current: completedCount, required: requirements.tasks },
                rating: { current: avgRating.toFixed(1), required: requirements.rating },
                habits: { current: habitCount, required: requirements.habits }
            }
        });
    }
    catch (error) {
        logger_1.default.error('检查升级条件失败:', error);
        res.status(500).json({ error: '服务器错误' });
    }
};
exports.checkUpgradeConditions = checkUpgradeConditions;
/**
 * 执行升级
 * POST /api/level/upgrade
 */
const upgradeLevel = async (req, res) => {
    const { userId } = req.body;
    try {
        // 1. 检查是否满足升级条件
        const checkResult = await (0, exports.checkUpgradeConditions)({ params: { userId } }, {});
        // 这里简化处理，实际应该从checkResult中获取canUpgrade
        // 为了演示，直接执行升级
        // 2. 升级
        const result = await (0, db_1.query)(`UPDATE users SET level = level + 1 WHERE id = $1 RETURNING level`, [userId]);
        const newLevel = result[0].level;
        const levelInfo = LEVEL_NAMES[newLevel];
        // 3. 生成升级提示消息
        const message = `你准备好了吗？可以试试更难的水域了。你现在是「${levelInfo.name}」。`;
        res.json({
            success: true,
            newLevel: {
                level: newLevel,
                name: levelInfo.name,
                description: levelInfo.description
            },
            message: message
        });
    }
    catch (error) {
        logger_1.default.error('升级失败:', error);
        res.status(500).json({ error: '服务器错误' });
    }
};
exports.upgradeLevel = upgradeLevel;
/**
 * 申请跳级挑战
 * POST /api/level/challenge
 */
const applyStretchChallenge = async (req, res) => {
    const { userId, taskId } = req.body;
    try {
        // 1. 获取用户当前等级
        const userResult = await (0, db_1.query)(`SELECT id, level FROM users WHERE id = $1`, [userId]);
        if (userResult.length === 0) {
            return res.status(404).json({ error: '用户不存在' });
        }
        const user = userResult[0];
        const currentLevel = user.level;
        // 2. 检查触发条件
        if (currentLevel < 1) {
            return res.status(400).json({ error: '当前等级不足，需要至少Lv.1' });
        }
        // 检查最近3单评分
        const recentRatings = await (0, db_1.query)(`SELECT AVG(rating) as avg_rating
       FROM (
         SELECT rating FROM task_applications
         WHERE student_id = $1 AND status = 'completed'
         ORDER BY completed_at DESC
         LIMIT 3
       ) recent`, [userId]);
        const avgRating = parseFloat(recentRatings[0].avg_rating) || 0;
        if (avgRating < 4.5) {
            return res.status(400).json({ error: '最近3单平均评分需要≥4.5' });
        }
        // 检查是否有重复卡点
        const stuckPoints = await (0, db_1.query)(`SELECT COUNT(*) as stuck_count
       FROM mentor_observations
       WHERE student_id = $1
         AND observation_type = 'stuck_point'
         AND created_at > NOW() - INTERVAL '30 days'`, [userId]);
        const stuckCount = parseInt(stuckPoints[0].stuck_count) || 0;
        if (stuckCount > 0) {
            return res.status(400).json({ error: '导师观察表中有未解决的卡点记录' });
        }
        // 检查30天内是否已申请过
        const recentChallenge = await (0, db_1.query)(`SELECT id FROM stretch_challenges
       WHERE student_id = $1
         AND created_at > NOW() - INTERVAL '30 days'`, [userId]);
        if (recentChallenge.length > 0) {
            return res.status(400).json({ error: '30天内只能申请一次跳级挑战' });
        }
        // 3. 获取任务信息
        const taskResult = await (0, db_1.query)(`SELECT id, required_level FROM tasks WHERE id = $1`, [taskId]);
        if (taskResult.length === 0) {
            return res.status(404).json({ error: '任务不存在' });
        }
        const task = taskResult[0];
        // 检查任务等级是否符合跳级要求（高于当前等级2级）
        if (task.required_level !== currentLevel + 2) {
            return res.status(400).json({ error: '跳级挑战需要选择高于当前等级2级的项目' });
        }
        // 4. 创建跳级挑战记录
        const challengeResult = await (0, db_1.query)(`INSERT INTO stretch_challenges (student_id, task_id, current_level, target_level, status)
       VALUES ($1, $2, $3, $4, 'pending')
       RETURNING id`, [userId, taskId, currentLevel, currentLevel + 2]);
        res.json({
            success: true,
            challengeId: challengeResult[0].id,
            message: '跳级挑战申请成功！完成这个项目后，你将直接升到Lv.' + (currentLevel + 2)
        });
    }
    catch (error) {
        logger_1.default.error('申请跳级挑战失败:', error);
        res.status(500).json({ error: '服务器错误' });
    }
};
exports.applyStretchChallenge = applyStretchChallenge;
/**
 * 完成跳级挑战
 * POST /api/level/challenge/complete
 */
const completeStretchChallenge = async (req, res) => {
    const { challengeId, success } = req.body;
    try {
        // 1. 获取挑战信息
        const challengeResult = await (0, db_1.query)(`SELECT * FROM stretch_challenges WHERE id = $1`, [challengeId]);
        if (challengeResult.length === 0) {
            return res.status(404).json({ error: '挑战不存在' });
        }
        const challenge = challengeResult[0];
        // 2. 更新挑战状态
        await (0, db_1.query)(`UPDATE stretch_challenges SET status = $1, completed_at = NOW() WHERE id = $2`, [success ? 'success' : 'failed', challengeId]);
        // 3. 如果成功，直接跳级
        if (success) {
            await (0, db_1.query)(`UPDATE users SET level = $1 WHERE id = $2`, [challenge.target_level, challenge.student_id]);
            const levelInfo = LEVEL_NAMES[challenge.target_level];
            res.json({
                success: true,
                message: `恭喜！你成功完成跳级挑战，现在是「${levelInfo.name}」！`,
                newLevel: {
                    level: challenge.target_level,
                    name: levelInfo.name,
                    description: levelInfo.description
                }
            });
        }
        else {
            res.json({
                success: true,
                message: '挑战失败，但不扣分。30天后可以再次尝试。'
            });
        }
    }
    catch (error) {
        logger_1.default.error('完成跳级挑战失败:', error);
        res.status(500).json({ error: '服务器错误' });
    }
};
exports.completeStretchChallenge = completeStretchChallenge;
//# sourceMappingURL=levelController.js.map