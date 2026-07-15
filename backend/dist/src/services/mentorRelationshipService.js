"use strict";
/**
 * Phase 3.1: 引路人机制服务
 * 让经验丰富的学生成为新人的引路人，建立传承关系
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
const logger_1 = __importDefault(require("../utils/logger"));
class MentorRelationshipService {
    /**
     * 检查学生是否有资格成为引路人
     */
    async checkQualification(studentId) {
        const client = await database_1.pool.connect();
        try {
            // 获取学生数据
            const studentData = await client.query(`
        SELECT
          u.level,
          COUNT(DISTINCT ta.id) as completed_tasks,
          COALESCE(AVG(r.rating), 0) as avg_rating
        FROM users u
        LEFT JOIN task_assignments ta ON u.user_id = ta.student_id
          AND ta.status = 'completed'
        LEFT JOIN ratings r ON ta.id = r.task_assignment_id
        WHERE u.user_id = $1
        GROUP BY u.user_id, u.level
      `, [studentId]);
            if (studentData.rows.length === 0) {
                return {
                    qualified: false,
                    reason: '用户不存在',
                    requirements: {
                        completedTasks: { current: 0, required: 10, met: false },
                        level: { current: 0, required: 3, met: false },
                        avgRating: { current: 0, required: 4.0, met: false }
                    }
                };
            }
            const data = studentData.rows[0];
            const completedTasks = parseInt(data.completed_tasks);
            const level = data.level;
            const avgRating = parseFloat(data.avg_rating);
            // 资格要求
            const REQUIRED_TASKS = 10;
            const REQUIRED_LEVEL = 3;
            const REQUIRED_RATING = 4.0;
            const requirements = {
                completedTasks: {
                    current: completedTasks,
                    required: REQUIRED_TASKS,
                    met: completedTasks >= REQUIRED_TASKS
                },
                level: {
                    current: level,
                    required: REQUIRED_LEVEL,
                    met: level >= REQUIRED_LEVEL
                },
                avgRating: {
                    current: avgRating,
                    required: REQUIRED_RATING,
                    met: avgRating >= REQUIRED_RATING
                }
            };
            const qualified = requirements.completedTasks.met &&
                requirements.level.met &&
                requirements.avgRating.met;
            let reason = '';
            if (!qualified) {
                const missing = [];
                if (!requirements.completedTasks.met)
                    missing.push('完成任务数不足');
                if (!requirements.level.met)
                    missing.push('等级不足');
                if (!requirements.avgRating.met)
                    missing.push('评分不足');
                reason = missing.join('，');
            }
            return { qualified, reason: qualified ? '符合资格' : reason, requirements };
        }
        finally {
            client.release();
        }
    }
    /**
     * 申请成为引路人
     */
    async applyToBeMentor(params) {
        const client = await database_1.pool.connect();
        try {
            // 检查资格
            const qualCheck = await this.checkQualification(params.studentId);
            if (!qualCheck.qualified) {
                return {
                    success: false,
                    message: `暂不符合资格：${qualCheck.reason}`
                };
            }
            // 检查是否已经申请过
            const existingApp = await client.query(`
        SELECT id, status FROM mentor_applications
        WHERE student_id = $1
        ORDER BY created_at DESC
        LIMIT 1
      `, [params.studentId]);
            if (existingApp.rows.length > 0) {
                const status = existingApp.rows[0].status;
                if (status === 'pending') {
                    return { success: false, message: '已有待审核的申请' };
                }
                if (status === 'approved') {
                    return { success: false, message: '你已经是引路人了' };
                }
            }
            // 创建申请
            const result = await client.query(`
        INSERT INTO mentor_applications (
          student_id, application_reason, experience_summary,
          completed_tasks_count, current_level, avg_rating
        )
        SELECT
          $1, $2, $3,
          COUNT(DISTINCT ta.id),
          u.level,
          COALESCE(AVG(r.rating), 0)
        FROM users u
        LEFT JOIN task_assignments ta ON u.user_id = ta.student_id AND ta.status = 'completed'
        LEFT JOIN ratings r ON ta.id = r.task_assignment_id
        WHERE u.user_id = $1
        GROUP BY u.user_id, u.level
        RETURNING id
      `, [params.studentId, params.applicationReason, params.experienceSummary]);
            logger_1.default.info('[MentorRelationship] 申请成为引路人', {
                studentId: params.studentId,
                applicationId: result.rows[0].id
            });
            return {
                success: true,
                applicationId: result.rows[0].id,
                message: '申请已提交，等待审核'
            };
        }
        finally {
            client.release();
        }
    }
    /**
     * 为新人匹配引路人
     * 匹配策略：相似OPC + 同赛道 + 可用名额
     */
    async findMentorForStudent(studentId) {
        const client = await database_1.pool.connect();
        try {
            // 获取学生的OPC标签和兴趣赛道
            const studentInfo = await client.query(`
        SELECT
          opc.personality_type,
          opc.dimensions,
          u.name,
          ARRAY_AGG(DISTINCT t.track) as interested_tracks
        FROM users u
        LEFT JOIN opc_test_results opc ON u.user_id = opc.student_id
          AND opc.test_version = 'v2'
        LEFT JOIN task_assignments ta ON u.user_id = ta.student_id
        LEFT JOIN tasks t ON ta.task_id = t.id
        WHERE u.user_id = $1
        GROUP BY u.user_id, u.name, opc.personality_type, opc.dimensions
      `, [studentId]);
            if (studentInfo.rows.length === 0) {
                return [];
            }
            const student = studentInfo.rows[0];
            const studentOpc = student.personality_type;
            const studentDimensions = student.dimensions || {};
            const studentTracks = student.interested_tracks || [];
            // 查找合格的引路人
            const mentors = await client.query(`
        SELECT
          mq.student_id,
          u.name,
          u.level,
          opc.personality_type,
          opc.dimensions,
          mq.qualification_level,
          mq.bio,
          mq.specialties,
          mq.available_slots,
          mq.active_mentees,
          mq.avg_mentee_satisfaction,
          ARRAY_AGG(DISTINCT t.track) as experienced_tracks
        FROM mentor_qualifications mq
        JOIN users u ON mq.student_id = u.user_id
        LEFT JOIN opc_test_results opc ON u.user_id = opc.student_id
          AND opc.test_version = 'v2'
        LEFT JOIN task_assignments ta ON u.user_id = ta.student_id
          AND ta.status = 'completed'
        LEFT JOIN tasks t ON ta.task_id = t.id
        WHERE mq.is_qualified = true
          AND mq.available_slots > mq.active_mentees
          AND mq.student_id != $1
        GROUP BY mq.student_id, u.user_id, u.name, u.level,
                 opc.personality_type, opc.dimensions,
                 mq.qualification_level, mq.bio, mq.specialties,
                 mq.available_slots, mq.active_mentees, mq.avg_mentee_satisfaction
        LIMIT 20
      `, [studentId]);
            // 计算匹配分数
            const matches = mentors.rows.map(mentor => {
                let matchScore = 0;
                let matchReasons = [];
                // OPC相似度匹配（30分）
                if (mentor.personality_type === studentOpc) {
                    matchScore += 30;
                    matchReasons.push('相同人格类型');
                }
                else if (mentor.dimensions && studentDimensions) {
                    // 计算维度相似度
                    const dimensions = ['逻辑推理', '创意表达', '数据敏感', '工具学习', '沟通协作', '自驱完成'];
                    let dimScore = 0;
                    dimensions.forEach(dim => {
                        const diff = Math.abs((mentor.dimensions[dim] || 0) - (studentDimensions[dim] || 0));
                        dimScore += Math.max(0, 10 - diff); // 差距越小分数越高
                    });
                    matchScore += Math.round(dimScore / 2); // 最多15分
                    if (dimScore > 30) {
                        matchReasons.push('能力维度相似');
                    }
                }
                // 赛道匹配（30分）
                const mentorTracks = mentor.experienced_tracks || [];
                const commonTracks = studentTracks.filter(t => mentorTracks.includes(t));
                if (commonTracks.length > 0) {
                    matchScore += 30;
                    matchReasons.push(`同在${commonTracks[0]}赛道`);
                }
                // 引路人等级（20分）
                matchScore += mentor.qualification_level * 4;
                // 满意度（20分）
                if (mentor.avg_mentee_satisfaction) {
                    matchScore += mentor.avg_mentee_satisfaction * 4;
                }
                return {
                    mentorId: mentor.student_id,
                    mentorName: mentor.name,
                    mentorLevel: mentor.level,
                    mentorOpcLabel: mentor.personality_type || '未知',
                    qualificationLevel: mentor.qualification_level,
                    matchScore,
                    matchReason: matchReasons.join('、') || '经验丰富的引路人',
                    specialties: mentor.specialties || [],
                    bio: mentor.bio
                };
            });
            // 按匹配分数排序
            matches.sort((a, b) => b.matchScore - a.matchScore);
            return matches.slice(0, 5); // 返回前5个最匹配的
        }
        finally {
            client.release();
        }
    }
    /**
     * 建立引路人关系
     */
    async createRelationship(params) {
        const client = await database_1.pool.connect();
        try {
            await client.query('BEGIN');
            // 检查引路人是否还有名额
            const mentorCheck = await client.query(`
        SELECT available_slots, active_mentees
        FROM mentor_qualifications
        WHERE student_id = $1 AND is_qualified = true
      `, [params.mentorStudentId]);
            if (mentorCheck.rows.length === 0) {
                await client.query('ROLLBACK');
                return { success: false, message: '该引路人不存在或未通过资格审核' };
            }
            const { available_slots, active_mentees } = mentorCheck.rows[0];
            if (active_mentees >= available_slots) {
                await client.query('ROLLBACK');
                return { success: false, message: '该引路人当前名额已满' };
            }
            // 检查是否已存在关系
            const existing = await client.query(`
        SELECT id, status FROM mentor_relationships
        WHERE mentor_student_id = $1 AND mentee_student_id = $2
      `, [params.mentorStudentId, params.menteeStudentId]);
            if (existing.rows.length > 0 && existing.rows[0].status === 'active') {
                await client.query('ROLLBACK');
                return { success: false, message: '已经建立了引路人关系' };
            }
            // 创建关系
            const relationshipId = `mentor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            await client.query(`
        INSERT INTO mentor_relationships (
          id, mentor_student_id, mentee_student_id,
          relationship_type, status, matched_reason, last_interaction_at
        )
        VALUES ($1, $2, $3, 'guide', 'active', $4, NOW())
      `, [relationshipId, params.mentorStudentId, params.menteeStudentId, params.matchedReason]);
            // 更新引路人的活跃mentee数量
            await client.query(`
        UPDATE mentor_qualifications
        SET active_mentees = active_mentees + 1,
            total_mentees = total_mentees + 1
        WHERE student_id = $1
      `, [params.mentorStudentId]);
            await client.query('COMMIT');
            logger_1.default.info('[MentorRelationship] 建立引路人关系', {
                relationshipId,
                mentorId: params.mentorStudentId,
                menteeId: params.menteeStudentId
            });
            return {
                success: true,
                relationshipId,
                message: '成功建立引路人关系'
            };
        }
        catch (error) {
            await client.query('ROLLBACK');
            throw error;
        }
        finally {
            client.release();
        }
    }
    /**
     * 记录引路人互动
     */
    async recordInteraction(params) {
        const client = await database_1.pool.connect();
        try {
            await client.query('BEGIN');
            // 记录互动
            await client.query(`
        INSERT INTO mentor_interactions (
          relationship_id, interaction_type, content,
          mentor_student_id, mentee_student_id, context
        )
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [
                params.relationshipId,
                params.interactionType,
                params.content,
                params.mentorStudentId,
                params.menteeStudentId,
                params.context ? JSON.stringify(params.context) : null
            ]);
            // 更新关系表的互动统计
            await client.query(`
        UPDATE mentor_relationships
        SET total_interactions = total_interactions + 1,
            last_interaction_at = NOW()
        WHERE id = $1
      `, [params.relationshipId]);
            // 更新引路人资格表的互动统计
            await client.query(`
        UPDATE mentor_qualifications
        SET total_interactions = total_interactions + 1
        WHERE student_id = $1
      `, [params.mentorStudentId]);
            await client.query('COMMIT');
            return true;
        }
        catch (error) {
            await client.query('ROLLBACK');
            logger_1.default.error('[MentorRelationship] 记录互动失败:', error);
            return false;
        }
        finally {
            client.release();
        }
    }
}
exports.default = new MentorRelationshipService();
//# sourceMappingURL=mentorRelationshipService.js.map