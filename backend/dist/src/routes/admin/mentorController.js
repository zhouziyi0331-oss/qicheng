"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMentorList = getMentorList;
exports.getMentorDetail = getMentorDetail;
exports.updateMentorStatus = updateMentorStatus;
exports.getMentorSessions = getMentorSessions;
const logger_1 = __importDefault(require("../../utils/logger"));
const db_1 = require("../../utils/db");
/**
 * 获取导师列表
 */
async function getMentorList(req, res) {
    try {
        const { page = 1, pageSize = 20, status, keyword } = req.query;
        const offset = (Number(page) - 1) * Number(pageSize);
        const conditions = ['u.role = $1'];
        const params = ['mentor'];
        let paramIndex = 2;
        if (status) {
            conditions.push(`mp.status = $${paramIndex}`);
            params.push(status);
            paramIndex++;
        }
        if (keyword) {
            conditions.push(`(u.nickname LIKE $${paramIndex} OR mp.expertise LIKE $${paramIndex})`);
            params.push(`%${keyword}%`);
            paramIndex++;
        }
        const whereClause = `WHERE ${conditions.join(' AND ')}`;
        const countResult = await (0, db_1.query)(`SELECT COUNT(*) as total
       FROM users u
       LEFT JOIN mentor_profiles mp ON u.id = mp.user_id
       ${whereClause}`, params);
        const total = parseInt(countResult[0].total);
        params.push(Number(pageSize), offset);
        const mentors = await (0, db_1.query)(`SELECT
        u.id,
        u.nickname,
        u.avatar_url,
        u.phone,
        u.created_at,
        mp.expertise,
        mp.bio,
        mp.rating_avg,
        mp.session_count,
        mp.status
       FROM users u
       LEFT JOIN mentor_profiles mp ON u.id = mp.user_id
       ${whereClause}
       ORDER BY u.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`, params);
        res.json({
            list: mentors,
            pagination: {
                page: Number(page),
                pageSize: Number(pageSize),
                total,
                totalPages: Math.ceil(total / Number(pageSize))
            }
        });
    }
    catch (error) {
        logger_1.default.error('获取导师列表失败:', error);
        res.status(500).json({ message: '获取导师列表失败' });
    }
}
/**
 * 获取导师详情
 */
async function getMentorDetail(req, res) {
    try {
        const { id } = req.params;
        const mentor = await (0, db_1.query)(`SELECT
        u.id,
        u.nickname,
        u.avatar_url,
        u.phone,
        u.created_at,
        mp.expertise,
        mp.bio,
        mp.rating_avg,
        mp.session_count,
        mp.status
       FROM users u
       LEFT JOIN mentor_profiles mp ON u.id = mp.user_id
       WHERE u.id = $1 AND u.role = 'mentor'`, [id]);
        if (mentor.length === 0) {
            return res.status(404).json({ message: '导师不存在' });
        }
        // 获取导师的咨询记录
        const sessions = await (0, db_1.query)(`SELECT
        ms.id,
        ms.student_id,
        ms.status,
        ms.duration_minutes,
        ms.rating,
        ms.created_at,
        u.nickname as student_name
       FROM mentor_sessions ms
       LEFT JOIN users u ON ms.student_id = u.id
       WHERE ms.mentor_id = $1
       ORDER BY ms.created_at DESC
       LIMIT 10`, [id]);
        res.json({
            ...mentor[0],
            recentSessions: sessions
        });
    }
    catch (error) {
        logger_1.default.error('获取导师详情失败:', error);
        res.status(500).json({ message: '获取导师详情失败' });
    }
}
/**
 * 更新导师状态
 */
async function updateMentorStatus(req, res) {
    try {
        const { id } = req.params;
        const { status } = req.body;
        await (0, db_1.query)(`UPDATE mentor_profiles
       SET status = $1,
           updated_at = NOW()
       WHERE user_id = $2`, [status, id]);
        res.json({ message: '导师状态更新成功' });
    }
    catch (error) {
        logger_1.default.error('更新导师状态失败:', error);
        res.status(500).json({ message: '更新导师状态失败' });
    }
}
/**
 * 获取咨询会话列表
 */
async function getMentorSessions(req, res) {
    try {
        const { page = 1, pageSize = 20, status, mentorId, studentId } = req.query;
        const offset = (Number(page) - 1) * Number(pageSize);
        const conditions = [];
        const params = [];
        let paramIndex = 1;
        if (status) {
            conditions.push(`ms.status = $${paramIndex}`);
            params.push(status);
            paramIndex++;
        }
        if (mentorId) {
            conditions.push(`ms.mentor_id = $${paramIndex}`);
            params.push(mentorId);
            paramIndex++;
        }
        if (studentId) {
            conditions.push(`ms.student_id = $${paramIndex}`);
            params.push(studentId);
            paramIndex++;
        }
        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
        const countResult = await (0, db_1.query)(`SELECT COUNT(*) as total
       FROM mentor_sessions ms
       ${whereClause}`, params);
        const total = parseInt(countResult[0].total);
        params.push(Number(pageSize), offset);
        const sessions = await (0, db_1.query)(`SELECT
        ms.id,
        ms.mentor_id,
        ms.student_id,
        ms.status,
        ms.duration_minutes,
        ms.rating,
        ms.feedback,
        ms.created_at,
        u_mentor.nickname as mentor_name,
        u_student.nickname as student_name
       FROM mentor_sessions ms
       LEFT JOIN users u_mentor ON ms.mentor_id = u_mentor.id
       LEFT JOIN users u_student ON ms.student_id = u_student.id
       ${whereClause}
       ORDER BY ms.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`, params);
        res.json({
            list: sessions,
            pagination: {
                page: Number(page),
                pageSize: Number(pageSize),
                total,
                totalPages: Math.ceil(total / Number(pageSize))
            }
        });
    }
    catch (error) {
        logger_1.default.error('获取咨询会话列表失败:', error);
        res.status(500).json({ message: '获取咨询会话列表失败' });
    }
}
//# sourceMappingURL=mentorController.js.map