"use strict";
/**
 * AI导师长期记忆服务
 *
 * 功能：
 * 1. 生成和更新学生长期画像摘要（200字内）
 * 2. 提取高频卡点、最近突破、能力快照
 * 3. 生成风格自适应引导指令
 * 4. 为AI-06提供跨订单上下文
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const uuid_1 = require("uuid");
const database_1 = require("../config/database");
const aiTaskQueue_1 = require("./aiTaskQueue");
const addAITask = aiTaskQueue_1.enqueueAITask;
const logger_1 = __importDefault(require("../utils/logger"));
class MentorMemoryService {
    /**
     * 订单完成后更新学生长期画像
     */
    async updateStudentProfile(studentId, orderId) {
        try {
            logger_1.default.info(`[MentorMemory] 开始更新学生画像: ${studentId}`);
            // 1. 收集数据
            const studentData = await this.collectStudentData(studentId);
            // 2. 分析高频卡点
            const topStuckPoints = await this.analyzeTopStuckPoints(studentId);
            // 3. 提取最近突破
            const recentBreakthroughs = await this.extractRecentBreakthroughs(studentId);
            // 4. 获取能力快照
            const abilitySnapshot = await this.getAbilitySnapshot(studentId);
            // 5. 计算工作模式
            const workPatterns = await this.calculateWorkPatterns(studentId);
            // 6. 生成引导风格
            const guidanceStyle = await this.generateGuidanceStyle(studentId, abilitySnapshot);
            // 7. 生成长期画像摘要（调用AI）
            const profileSummary = await this.generateProfileSummary(studentId, topStuckPoints, recentBreakthroughs, abilitySnapshot, workPatterns);
            // 8. 保存到缓存表
            await this.saveProfileCache({
                student_id: studentId,
                profile_summary: profileSummary,
                top_stuck_points: topStuckPoints,
                recent_breakthroughs: recentBreakthroughs,
                ability_snapshot: abilitySnapshot,
                work_patterns: workPatterns,
                guidance_style: guidanceStyle,
                last_updated: new Date(),
                update_trigger: `订单完成#${orderId}`
            });
            logger_1.default.info(`[MentorMemory] 学生画像更新完成: ${studentId}`);
        }
        catch (error) {
            logger_1.default.error('[MentorMemory] 更新学生画像失败:', error);
            throw error;
        }
    }
    /**
     * 收集学生基础数据
     */
    async collectStudentData(studentId) {
        const result = await database_1.pool.query(`
      SELECT
        u.id,
        u.current_level,
        u.username,
        u.created_at as joined_at,
        COUNT(DISTINCT o.id) as total_orders,
        AVG(o.client_rating) as avg_rating
      FROM users u
      LEFT JOIN orders o ON u.id = o.student_id AND o.status = 'completed'
      WHERE u.id = $1
      GROUP BY u.id, u.current_level, u.username, u.created_at
    `, [studentId]);
        return result.rows[0];
    }
    /**
     * 分析高频卡点（Top 3）
     */
    async analyzeTopStuckPoints(studentId) {
        const result = await database_1.pool.query(`
      SELECT
        observation_category as category,
        COUNT(*) as count,
        MAX(observed_at) as last_occurred,
        BOOL_OR(
          obs_content LIKE '%独立解决%' OR
          obs_content LIKE '%突破%' OR
          obs_content LIKE '%掌握%'
        ) as resolved
      FROM mentor_growth_observations
      WHERE user_id = $1
        AND observation_category = 'stuck_point'
        AND observed_at > NOW() - INTERVAL '90 days'
      GROUP BY observation_category
      ORDER BY count DESC
      LIMIT 3
    `, [studentId]);
        return result.rows.map(row => ({
            category: row.category || '未分类卡点',
            count: parseInt(row.count),
            last_occurred: row.last_occurred,
            resolved: row.resolved || false
        }));
    }
    /**
     * 提取最近突破（Top 3）
     */
    async extractRecentBreakthroughs(studentId) {
        const result = await database_1.pool.query(`
      SELECT
        breakthrough as description,
        order_id,
        observed_at as achieved_at
      FROM mentor_growth_observations
      WHERE user_id = $1
        AND breakthrough IS NOT NULL
        AND breakthrough != ''
        AND observed_at > NOW() - INTERVAL '90 days'
      ORDER BY observed_at DESC
      LIMIT 3
    `, [studentId]);
        return result.rows;
    }
    /**
     * 获取能力快照
     */
    async getAbilitySnapshot(studentId) {
        const result = await database_1.pool.query(`
      SELECT
        u.current_level as level,
        uap.six_dimensions,
        uap.personality_tag,
        uap.core_strengths
      FROM users u
      LEFT JOIN user_ability_profiles uap ON u.id = uap.user_id
      WHERE u.id = $1
      ORDER BY uap.version DESC
      LIMIT 1
    `, [studentId]);
        if (result.rows.length === 0) {
            return {
                level: 0,
                six_dimensions: {},
                personality_tag: '未知',
                core_strengths: []
            };
        }
        return {
            level: result.rows[0].level || 0,
            six_dimensions: result.rows[0].six_dimensions || {},
            personality_tag: result.rows[0].personality_tag || '未知',
            core_strengths: result.rows[0].core_strengths || []
        };
    }
    /**
     * 计算工作模式
     */
    async calculateWorkPatterns(studentId) {
        const result = await database_1.pool.query(`
      SELECT
        AVG(EXTRACT(EPOCH FROM (deadline_at - completed_at)) / 86400) as avg_delivery_days_before_deadline,
        AVG(revision_count) as avg_revision_rounds,
        AVG(client_rating) as recent_5_orders_avg_score
      FROM (
        SELECT
          o.deadline_at,
          o.completed_at,
          o.client_rating,
          COUNT(os.id) as revision_count
        FROM orders o
        LEFT JOIN order_submissions os ON o.id = os.order_id
        WHERE o.student_id = $1
          AND o.status = 'completed'
        GROUP BY o.id, o.deadline_at, o.completed_at, o.client_rating
        ORDER BY o.completed_at DESC
        LIMIT 5
      ) recent_orders
    `, [studentId]);
        if (result.rows.length === 0) {
            return {
                avg_delivery_days_before_deadline: 0,
                avg_revision_rounds: 0,
                recent_5_orders_avg_score: 0
            };
        }
        return {
            avg_delivery_days_before_deadline: parseFloat(result.rows[0].avg_delivery_days_before_deadline || 0).toFixed(1),
            avg_revision_rounds: parseFloat(result.rows[0].avg_revision_rounds || 0).toFixed(1),
            recent_5_orders_avg_score: parseFloat(result.rows[0].recent_5_orders_avg_score || 0).toFixed(2)
        };
    }
    /**
     * 生成引导风格（基于六维画像）
     */
    async generateGuidanceStyle(studentId, abilitySnapshot) {
        const sixDimensions = abilitySnapshot.six_dimensions || {};
        // 提取六维分数
        const creativeDrive = sixDimensions.creative_drive || 50; // 创作驱动
        const collaborationTendency = sixDimensions.collaboration_tendency || 50; // 协作倾向
        const riskAttitude = sixDimensions.risk_attitude || 50; // 风险态度
        let styleType;
        let analogyPreference;
        let stepDetailLevel;
        let tone;
        let systemPromptInjection = '';
        // 根据创作驱动判断视觉型/逻辑型
        if (creativeDrive >= 65) {
            styleType = 'visual';
            analogyPreference = 'image_based';
            stepDetailLevel = 'moderate';
            tone = 'warm';
            systemPromptInjection = '用视觉类比引导，不说"调整结构"，说"试试把这部分想象成一张海报的构图"。多用画面感的语言。';
        }
        else if (creativeDrive <= 45) {
            styleType = 'logical';
            analogyPreference = 'step_based';
            stepDetailLevel = 'high';
            tone = 'precise';
            systemPromptInjection = '用步骤和逻辑引导，不说"感觉不对"，说"第三步的输入和第四步的输出不匹配"。多用结构化的语言。';
        }
        else {
            styleType = 'collaborative';
            analogyPreference = 'concept_based';
            stepDetailLevel = 'moderate';
            tone = 'encouraging';
            systemPromptInjection = '平衡视觉和逻辑，根据具体问题灵活调整引导方式。';
        }
        // 根据协作倾向调整
        if (collaborationTendency <= 45) {
            styleType = 'independent';
            systemPromptInjection += ' 多问"你觉得呢"，少给方向。他需要自己想出来。';
        }
        else if (collaborationTendency >= 65) {
            systemPromptInjection += ' 可以建议他去找XX聊聊，或者去社区搜类似案例。';
        }
        // 根据风险态度调整
        if (riskAttitude <= 45) {
            styleType = 'steady';
            systemPromptInjection += ' 每次只给最小的下一步，不要建议跨度大的方向。';
        }
        else if (riskAttitude >= 65) {
            styleType = 'adventurous';
            systemPromptInjection += ' 可以给更大胆的建议，甚至主动推荐挑战项目。';
        }
        return {
            style_type: styleType,
            analogy_preference: analogyPreference,
            step_detail_level: stepDetailLevel,
            tone: tone,
            system_prompt_injection: systemPromptInjection
        };
    }
    /**
     * 生成长期画像摘要（调用AI）
     */
    async generateProfileSummary(studentId, topStuckPoints, recentBreakthroughs, abilitySnapshot, workPatterns) {
        // 构建Prompt
        const prompt = `
根据该学生的以下数据，生成一段200字内的长期画像摘要：

**基本信息：**
- 当前等级：Lv.${abilitySnapshot.level}
- 人格标签：${abilitySnapshot.personality_tag}
- 核心优势：${abilitySnapshot.core_strengths.join('、') || '待发现'}

**历史高频卡点（Top 3）：**
${topStuckPoints.map((sp, i) => `${i + 1}. ${sp.category}（出现${sp.count}次，${sp.resolved ? '已突破' : '仍在克服'}）`).join('\n')}

**最近突破（Top 3）：**
${recentBreakthroughs.map((bt, i) => `${i + 1}. ${bt.description}`).join('\n')}

**工作模式：**
- 平均提前${workPatterns.avg_delivery_days_before_deadline}天交付
- 平均修改${workPatterns.avg_revision_rounds}轮
- 最近5单平均评分：${workPatterns.recent_5_orders_avg_score}/5.0

**摘要格式要求：**
"该学生属于[人格标签]，擅长[Top1优势]。历史高频卡点为[Top1卡点类型]，但最近[X]单已独立解决。工作节奏偏[快/稳/随性]，适合[推荐项目方向]。"

请生成摘要（严格控制在200字内）：
    `.trim();
        try {
            // 调用AI生成摘要（使用claude-haiku-4-5，快速且便宜）
            const Anthropic = require('@anthropic-ai/sdk');
            const anthropic = new Anthropic({
                apiKey: process.env.ANTHROPIC_API_KEY
            });
            const message = await anthropic.messages.create({
                model: 'claude-haiku-4-5',
                max_tokens: 300,
                temperature: 0.7,
                messages: [{
                        role: 'user',
                        content: prompt
                    }]
            });
            const summary = message.content[0].text.trim();
            // 确保不超过200字
            return summary.length > 200 ? summary.substring(0, 200) + '...' : summary;
        }
        catch (error) {
            logger_1.default.error('[MentorMemory] AI生成摘要失败，使用模板:', error);
            // 降级：使用模板生成
            const topStuckPoint = topStuckPoints[0]?.category || '未知';
            const topBreakthrough = recentBreakthroughs[0]?.description || '持续成长中';
            return `该学生属于${abilitySnapshot.personality_tag}，当前Lv.${abilitySnapshot.level}。历史高频卡点为${topStuckPoint}，最近突破：${topBreakthrough}。工作节奏稳定，平均提前${workPatterns.avg_delivery_days_before_deadline}天交付。`;
        }
    }
    /**
     * 保存画像缓存
     */
    async saveProfileCache(cache) {
        await database_1.pool.query(`
      INSERT INTO mentor_student_profile_cache (
        student_id, profile_summary, top_stuck_points, recent_breakthroughs,
        ability_snapshot, work_patterns, guidance_style, last_updated, update_trigger
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (student_id) DO UPDATE SET
        profile_summary = EXCLUDED.profile_summary,
        top_stuck_points = EXCLUDED.top_stuck_points,
        recent_breakthroughs = EXCLUDED.recent_breakthroughs,
        ability_snapshot = EXCLUDED.ability_snapshot,
        work_patterns = EXCLUDED.work_patterns,
        guidance_style = EXCLUDED.guidance_style,
        last_updated = EXCLUDED.last_updated,
        update_trigger = EXCLUDED.update_trigger
    `, [
            cache.student_id,
            cache.profile_summary,
            JSON.stringify(cache.top_stuck_points),
            JSON.stringify(cache.recent_breakthroughs),
            JSON.stringify(cache.ability_snapshot),
            JSON.stringify(cache.work_patterns),
            JSON.stringify(cache.guidance_style),
            cache.last_updated,
            cache.update_trigger
        ]);
    }
    /**
     * 获取学生长期画像（供AI-06调用）
     */
    async getStudentProfile(studentId) {
        const result = await database_1.pool.query(`
      SELECT * FROM mentor_student_profile_cache WHERE student_id = $1
    `, [studentId]);
        if (result.rows.length === 0) {
            return null;
        }
        const row = result.rows[0];
        return {
            student_id: row.student_id,
            profile_summary: row.profile_summary,
            top_stuck_points: row.top_stuck_points,
            recent_breakthroughs: row.recent_breakthroughs,
            ability_snapshot: row.ability_snapshot,
            work_patterns: row.work_patterns,
            guidance_style: row.guidance_style,
            last_updated: row.last_updated,
            update_trigger: row.update_trigger
        };
    }
    /**
     * 构建AI-06的System Prompt（包含长期记忆和风格指令）
     */
    async buildSystemPromptForAI06(studentId, basePrompt) {
        const profile = await this.getStudentProfile(studentId);
        if (!profile) {
            // 如果没有画像缓存，返回基础Prompt
            return basePrompt;
        }
        // 拼接长期记忆段
        const memorySection = `
## 学生长期记忆
${profile.profile_summary}

**高频卡点：**
${profile.top_stuck_points.map(sp => `- ${sp.category}（${sp.resolved ? '已突破' : '仍在克服'}）`).join('\n')}

**最近突破：**
${profile.recent_breakthroughs.map(bt => `- ${bt.description}`).join('\n')}
    `.trim();
        // 拼接风格指令段
        const styleSection = `
## 引导风格指令
${profile.guidance_style.system_prompt_injection}
    `.trim();
        // 完整System Prompt
        return `${basePrompt}

${memorySection}

${styleSection}
    `.trim();
    }
    /**
     * 记录成长观察（供其他服务调用）
     */
    async recordGrowthObservation(studentId, orderId, observationType, content, category, isSignificant = false, tags = []) {
        await database_1.pool.query(`
      INSERT INTO mentor_growth_observations (
        id, user_id, order_id, obs_type, obs_content,
        observation_category, is_significant, tags, observed_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
    `, [
            (0, uuid_1.v4)(),
            studentId,
            orderId,
            observationType,
            content,
            category,
            isSignificant,
            tags
        ]);
        logger_1.default.info(`[MentorMemory] 成长观察已记录: ${studentId} - ${observationType}`);
    }
    /**
     * 批量初始化学生画像（用于迁移现有学生）
     */
    async batchInitializeProfiles(studentIds) {
        try {
            // 如果没有指定学生ID，获取所有学生
            let students;
            if (studentIds && studentIds.length > 0) {
                const result = await database_1.pool.query(`
          SELECT id FROM users WHERE id = ANY($1) AND role = 'student'
        `, [studentIds]);
                students = result.rows;
            }
            else {
                const result = await database_1.pool.query(`
          SELECT id FROM users WHERE role = 'student'
        `);
                students = result.rows;
            }
            logger_1.default.info(`[MentorMemory] 开始批量初始化 ${students.length} 个学生画像`);
            for (const student of students) {
                try {
                    // 检查是否已有画像
                    const existing = await this.getStudentProfile(student.id);
                    if (existing) {
                        logger_1.default.info(`[MentorMemory] 学生 ${student.id} 已有画像，跳过`);
                        continue;
                    }
                    // 初始化画像（使用最近一个订单作为触发器）
                    const lastOrder = await database_1.pool.query(`
            SELECT id FROM orders WHERE student_id = $1 ORDER BY created_at DESC LIMIT 1
          `, [student.id]);
                    const orderId = lastOrder.rows.length > 0 ? lastOrder.rows[0].id : 'initial_migration';
                    await this.updateStudentProfile(student.id, orderId);
                    logger_1.default.info(`[MentorMemory] 学生 ${student.id} 画像初始化完成`);
                }
                catch (error) {
                    logger_1.default.error(`[MentorMemory] 学生 ${student.id} 画像初始化失败:`, error);
                    // 继续处理下一个学生
                }
            }
            logger_1.default.info(`[MentorMemory] 批量初始化完成`);
        }
        catch (error) {
            logger_1.default.error('[MentorMemory] 批量初始化失败:', error);
            throw error;
        }
    }
}
exports.default = new MentorMemoryService();
//# sourceMappingURL=mentorMemoryService.js.map