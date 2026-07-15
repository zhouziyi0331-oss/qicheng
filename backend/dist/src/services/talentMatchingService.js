"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TalentMatchingService = void 0;
const db_1 = require("../utils/db");
const logger_1 = __importDefault(require("../utils/logger"));
class TalentMatchingService {
    /**
     * 为任务匹配学生
     */
    static async matchStudentsForTask(taskId, topN = 20) {
        const client = await db_1.pool.connect();
        try {
            logger_1.default.info(`[TalentMatching] 开始为任务 ${taskId} 匹配学生`);
            // 1. 获取任务需求的特质
            const taskRequirements = await this.getTaskRequirements(client, taskId);
            if (taskRequirements.requiredTraits.length === 0) {
                logger_1.default.warn(`[TalentMatching] 任务 ${taskId} 没有设置特质需求`);
                return [];
            }
            // 2. 获取所有完成OPC测评的学生
            const studentsResult = await client.query(`
        SELECT DISTINCT u.id as student_id
        FROM users u
        JOIN opc_v2_results opr ON u.id = opr.student_id
        WHERE u.role = 'student'
      `);
            const students = studentsResult.rows;
            logger_1.default.info(`[TalentMatching] 找到 ${students.length} 个候选学生`);
            // 3. 为每个学生计算匹配分数
            const matchResults = [];
            for (const student of students) {
                const studentProfile = await this.getStudentTalentProfile(client, student.student_id);
                const matchResult = await this.calculateMatch(client, studentProfile, taskRequirements);
                matchResults.push(matchResult);
            }
            // 4. 排序并返回TopN
            matchResults.sort((a, b) => b.overallScore - a.overallScore);
            const topMatches = matchResults.slice(0, topN);
            logger_1.default.info(`[TalentMatching] 匹配完成，返回Top${topN}学生`);
            topMatches.slice(0, 5).forEach((match, index) => {
                logger_1.default.info(`  ${index + 1}. 学生${match.studentId}: ${match.overallScore.toFixed(2)}分 - ${match.recommendation}`);
            });
            return topMatches;
        }
        catch (error) {
            logger_1.default.error('[TalentMatching] 匹配失败:', error);
            throw error;
        }
        finally {
            client.release();
        }
    }
    /**
     * 获取任务需求的特质
     */
    static async getTaskRequirements(client, taskId) {
        const result = await client.query(`
      SELECT trt.trait_tag_id, trt.importance, trt.weight, tt.tag_name
      FROM task_requirement_traits trt
      JOIN talent_tags tt ON trt.trait_tag_id = tt.id
      WHERE trt.task_id = $1
      ORDER BY 
        CASE trt.importance
          WHEN 'required' THEN 1
          WHEN 'preferred' THEN 2
          WHEN 'nice_to_have' THEN 3
        END,
        trt.weight DESC
    `, [taskId]);
        return {
            taskId,
            requiredTraits: result.rows.map((row) => ({
                traitTagId: row.trait_tag_id,
                tagName: row.tag_name,
                importance: row.importance,
                weight: row.weight
            }))
        };
    }
    /**
     * 获取学生的天赋画像
     */
    static async getStudentTalentProfile(client, studentId) {
        // 获取学生的天赋标签
        const talentsResult = await client.query(`
      SELECT stt.tag_id, stt.strength, stt.confidence, stt.verified_count,
             tt.tag_name, tt.category
      FROM student_talent_tags stt
      JOIN talent_tags tt ON stt.tag_id = tt.id
      WHERE stt.student_id = $1
      ORDER BY stt.confidence DESC, stt.verified_count DESC
    `, [studentId]);
        // 获取学生的OPC分数
        const opcResult = await client.query(`
      SELECT info_processing_score, creation_drive_score, tool_learning_score,
             task_execution_score, collaboration_score, risk_attitude_score
      FROM opc_v2_results
      WHERE student_id = $1
      ORDER BY created_at DESC
      LIMIT 1
    `, [studentId]);
        const opcScores = opcResult.rows[0] || {
            info_processing_score: 50,
            creation_drive_score: 50,
            tool_learning_score: 50,
            task_execution_score: 50,
            collaboration_score: 50,
            risk_attitude_score: 50
        };
        return {
            studentId,
            talents: talentsResult.rows.map((row) => ({
                tagId: row.tag_id,
                tagName: row.tag_name,
                category: row.category,
                strength: row.strength,
                confidence: parseFloat(row.confidence),
                verifiedCount: row.verified_count
            })),
            opcScores: {
                info_processing: opcScores.info_processing_score,
                creation_drive: opcScores.creation_drive_score,
                tool_learning: opcScores.tool_learning_score,
                task_execution: opcScores.task_execution_score,
                collaboration: opcScores.collaboration_score,
                risk_attitude: opcScores.risk_attitude_score
            }
        };
    }
    /**
     * 计算学生与任务的匹配度
     */
    static async calculateMatch(client, studentProfile, taskRequirements) {
        // 1. 天赋特质匹配度 (50%权重)
        const talentMatch = this.calculateTalentMatch(studentProfile, taskRequirements);
        // 2. OPC兼容性 (20%权重)
        const opcCompatibility = this.calculateOPCCompatibility(studentProfile, taskRequirements);
        // 3. 成长潜力 (30%权重)
        const growthPotential = this.calculateGrowthPotential(studentProfile, taskRequirements);
        // 综合得分
        const overallScore = (talentMatch.score * 0.5 +
            opcCompatibility * 0.2 +
            growthPotential * 0.3) * 100;
        // 生成推荐
        const recommendation = this.generateRecommendation(overallScore, talentMatch, studentProfile);
        return {
            studentId: studentProfile.studentId,
            taskId: taskRequirements.taskId,
            overallScore,
            talentMatchScore: talentMatch.score * 100,
            opcCompatibilityScore: opcCompatibility * 100,
            growthPotentialScore: growthPotential * 100,
            matchedTraits: talentMatch.matchedTraits,
            missingRequiredTraits: talentMatch.missingRequiredTraits,
            recommendation,
            reasoning: talentMatch.reasoning
        };
    }
    /**
     * 计算天赋特质匹配度
     */
    static calculateTalentMatch(studentProfile, taskRequirements) {
        const matchedTraits = [];
        const missingRequiredTraits = [];
        const reasoning = [];
        let totalWeight = 0;
        let matchedWeight = 0;
        for (const requirement of taskRequirements.requiredTraits) {
            totalWeight += requirement.weight;
            // 查找学生是否有这个特质
            const studentTalent = studentProfile.talents.find(t => t.tagId === requirement.traitTagId);
            if (studentTalent) {
                // 有这个特质
                // 强度权重
                const strengthWeight = {
                    'emerging': 0.6,
                    'clear': 0.8,
                    'prominent': 0.9,
                    'core': 1.0
                }[studentTalent.strength] || 0.5;
                // 置信度权重
                const confidenceWeight = studentTalent.confidence;
                // 重要性加成
                const importanceBonus = {
                    'required': 1.2,
                    'preferred': 1.0,
                    'nice_to_have': 0.8
                }[requirement.importance] || 1.0;
                const matchScore = strengthWeight * confidenceWeight * importanceBonus * requirement.weight;
                matchedWeight += matchScore;
                matchedTraits.push({
                    tagName: requirement.tagName,
                    studentStrength: studentTalent.strength,
                    studentConfidence: studentTalent.confidence,
                    importance: requirement.importance
                });
                reasoning.push(`✓ ${requirement.tagName}: ${studentTalent.strength}级别，置信度${(studentTalent.confidence * 100).toFixed(0)}%`);
            }
            else {
                // 没有这个特质
                if (requirement.importance === 'required') {
                    missingRequiredTraits.push(requirement.tagName);
                    reasoning.push(`✗ 缺少必需特质: ${requirement.tagName}`);
                }
                else {
                    reasoning.push(`- 未显现: ${requirement.tagName} (${requirement.importance})`);
                }
            }
        }
        // 如果缺少必需特质，严重扣分
        let score = totalWeight > 0 ? matchedWeight / totalWeight : 0;
        if (missingRequiredTraits.length > 0) {
            score = score * 0.5; // 扣50%
        }
        return {
            score: Math.min(score, 1.0),
            matchedTraits,
            missingRequiredTraits,
            reasoning
        };
    }
    /**
     * 计算OPC兼容性
     */
    static calculateOPCCompatibility(studentProfile, taskRequirements) {
        // 这里可以根据任务的特性，判断需要什么样的OPC倾向
        // 简化处理：平衡的OPC分数视为良好
        const scores = studentProfile.opcScores;
        // 计算分数的标准差，越小越平衡
        const avg = (scores.info_processing +
            scores.creation_drive +
            scores.tool_learning +
            scores.task_execution +
            scores.collaboration +
            scores.risk_attitude) / 6;
        // 标准差
        const variance = [
            scores.info_processing,
            scores.creation_drive,
            scores.tool_learning,
            scores.task_execution,
            scores.collaboration,
            scores.risk_attitude
        ].reduce((sum, score) => sum + Math.pow(score - avg, 2), 0) / 6;
        const stdDev = Math.sqrt(variance);
        // 标准差越小，越平衡，得分越高
        // 标准差0-30分：很好，30-50：一般，50+：偏科
        if (stdDev < 15)
            return 1.0;
        if (stdDev < 25)
            return 0.85;
        if (stdDev < 35)
            return 0.7;
        return 0.6;
    }
    /**
     * 计算成长潜力
     */
    static calculateGrowthPotential(studentProfile, taskRequirements) {
        // 1. 学习能力相关的特质
        const learningTalents = studentProfile.talents.filter(t => ['快速学习', '举一反三', '知识整合', '实践学习型'].includes(t.tagName));
        const learningScore = learningTalents.length > 0
            ? learningTalents.reduce((sum, t) => sum + t.confidence, 0) / learningTalents.length
            : 0.5;
        // 2. 主动性相关的特质
        const proactiveTalents = studentProfile.talents.filter(t => ['自驱力强', '主动优化', '挑战精神'].includes(t.tagName));
        const proactiveScore = proactiveTalents.length > 0
            ? proactiveTalents.reduce((sum, t) => sum + t.confidence, 0) / proactiveTalents.length
            : 0.5;
        // 3. 天赋标签的数量和质量
        const talentQuality = studentProfile.talents.length > 0
            ? studentProfile.talents.filter(t => t.strength !== 'emerging').length / studentProfile.talents.length
            : 0;
        // 综合成长潜力
        return learningScore * 0.4 + proactiveScore * 0.4 + talentQuality * 0.2;
    }
    /**
     * 生成推荐
     */
    static generateRecommendation(overallScore, talentMatch, studentProfile) {
        if (talentMatch.missingRequiredTraits.length > 0) {
            return `不适合 - 缺少必需特质: ${talentMatch.missingRequiredTraits.join(', ')}`;
        }
        if (overallScore >= 80) {
            return '强烈推荐 - 天赋特质高度匹配';
        }
        else if (overallScore >= 70) {
            return '推荐 - 特质匹配良好';
        }
        else if (overallScore >= 60) {
            return '可考虑 - 有成长空间';
        }
        else if (overallScore >= 50) {
            return '成长型匹配 - 需要学习';
        }
        else {
            return '不太适合 - 特质匹配度较低';
        }
    }
}
exports.TalentMatchingService = TalentMatchingService;
//# sourceMappingURL=talentMatchingService.js.map