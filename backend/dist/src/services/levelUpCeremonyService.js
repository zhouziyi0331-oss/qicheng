"use strict";
/**
 * Phase 1.4: 升级通关仪式服务
 *
 * 功能：
 * 1. 检测学生升级事件
 * 2. 生成个性化庆祝文案
 * 3. 触发通关仪式通知
 * 4. 记录升级里程碑
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.levelUpCeremonyService = void 0;
const db_1 = require("../utils/db");
const logger_1 = __importDefault(require("../utils/logger"));
const uuid_1 = require("uuid");
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
const anthropic = new sdk_1.default({
    apiKey: process.env.ANTHROPIC_API_KEY || ''
});
class LevelUpCeremonyService {
    /**
     * 触发升级通关仪式
     */
    async triggerLevelUpCeremony(data) {
        try {
            logger_1.default.info('[LevelUpCeremony] 开始生成升级仪式', data);
            // 1. 获取学生成长上下文
            const context = await this.getStudentGrowthContext(data.studentId);
            // 2. 生成个性化庆祝文案（AI生成）
            const ceremonyContent = await this.generateCeremonyContent(data, context);
            // 3. 保存仪式记录
            const ceremonyId = await this.saveCeremonyRecord(data, ceremonyContent);
            // 4. 触发通知（通过notificationQueue和前端事件）
            await this.triggerCeremonyNotification(data.studentId, ceremonyId, ceremonyContent, data.newLevel);
            logger_1.default.info('[LevelUpCeremony] 升级仪式生成成功', {
                ceremonyId,
                studentId: data.studentId,
                newLevel: data.newLevel
            });
            return {
                success: true,
                ceremonyId,
                ceremonyContent
            };
        }
        catch (error) {
            logger_1.default.error('[LevelUpCeremony] 升级仪式生成失败', { error, data });
            throw error;
        }
    }
    /**
     * 获取学生成长上下文
     */
    async getStudentGrowthContext(studentId) {
        // 获取学生基础信息
        const studentInfo = await (0, db_1.queryOne)(`SELECT nickname, current_opc_personality, created_at
       FROM users
       WHERE id = $1`, [studentId]);
        if (!studentInfo) {
            throw new Error('Student not found');
        }
        // 获取任务统计
        const taskStats = await (0, db_1.queryOne)(`SELECT
         COUNT(*) as total_tasks,
         AVG(client_rating) as avg_rating
       FROM task_assignments
       WHERE student_id = $1 AND status = 'completed'`, [studentId]);
        // 获取最近突破
        const recentBreakthroughs = await (0, db_1.query)(`SELECT breakthrough
       FROM mentor_growth_observations
       WHERE student_id = $1
         AND observation_type = 'breakthrough'
         AND created_at > NOW() - INTERVAL '30 days'
       ORDER BY created_at DESC
       LIMIT 3`, [studentId]);
        // 获取技能列表
        const skills = await (0, db_1.query)(`SELECT DISTINCT skill_name
       FROM student_skills
       WHERE student_id = $1
       ORDER BY last_used_at DESC
       LIMIT 5`, [studentId]);
        const daysOnPlatform = Math.floor((Date.now() - new Date(studentInfo.created_at).getTime()) / (1000 * 60 * 60 * 24));
        return {
            nickname: studentInfo.nickname || '同学',
            opcPersonality: studentInfo.current_opc_personality || 'unknown',
            totalTasksCompleted: parseInt(taskStats?.total_tasks) || 0,
            averageRating: parseFloat(taskStats?.avg_rating) || 0,
            recentBreakthroughs: recentBreakthroughs.map(b => b.breakthrough),
            skillsAcquired: skills.map(s => s.skill_name),
            daysOnPlatform
        };
    }
    /**
     * 使用AI生成个性化庆祝文案
     */
    async generateCeremonyContent(data, context) {
        const prompt = `你是启程平台的AI导师，现在需要为学生生成升级通关仪式的庆祝文案。

**学生信息**：
- 昵称：${context.nickname}
- OPC人格：${context.opcPersonality}
- 完成任务数：${context.totalTasksCompleted}
- 平均评分：${context.averageRating.toFixed(1)}/5.0
- 在平台天数：${context.daysOnPlatform}天
- 最近突破：${context.recentBreakthroughs.join('、') || '无'}
- 掌握技能：${context.skillsAcquired.join('、') || '无'}

**升级信息**：
- 从 Lv.${data.oldLevel} 升至 Lv.${data.newLevel}
- 触发原因：${this.getTriggerReasonLabel(data.triggerReason)}

**文案要求**：
1. **title**（8-12字）：简洁有力的标题，例如"突破Lv.3，进入专业赛道"
2. **mainMessage**（50-80字）：温暖、具体、让学生感到被看见的主文案。不要说"恭喜"，要说"你在XX上的坚持，让你走到了这里"
3. **achievements**（3条）：具体成就，必须基于真实数据，不要空话。例如"完成了${context.totalTasksCompleted}个真实项目"而不是"表现优秀"
4. **nextLevelPreview**（30-50字）：下一阶段的具体能力解锁，例如"现在你可以接更复杂的跨赛道项目，报酬提升30%"
5. **celebrationEmoji**：选一个合适的emoji（🎉/🎊/🏆/⭐/🚀）

**禁止事项**：
- 不要说"继续加油""再接再厉"这种空话
- 不要编造数据（如果某项为0就不要提）
- 不要过度夸张（不要用"惊人""卓越"等词）
- 文案要温暖但不煽情

请严格按照以下JSON格式输出：

{
  "title": "标题",
  "mainMessage": "主文案",
  "achievements": ["成就1", "成就2", "成就3"],
  "nextLevelPreview": "下一阶段预览",
  "celebrationEmoji": "🎉"
}`;
        try {
            const response = await anthropic.messages.create({
                model: 'claude-haiku-4-5',
                max_tokens: 1000,
                temperature: 0.7,
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ]
            });
            const content = response.content[0];
            if (content.type !== 'text') {
                throw new Error('Unexpected response type from Claude');
            }
            // 提取JSON
            const jsonMatch = content.text.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('Failed to extract JSON from Claude response');
            }
            const aiGenerated = JSON.parse(jsonMatch[0]);
            return {
                title: aiGenerated.title,
                mainMessage: aiGenerated.mainMessage,
                achievements: aiGenerated.achievements,
                nextLevelPreview: aiGenerated.nextLevelPreview,
                celebrationEmoji: aiGenerated.celebrationEmoji,
                soundEffect: this.selectSoundEffect(data.newLevel, data.triggerReason)
            };
        }
        catch (error) {
            logger_1.default.error('[LevelUpCeremony] AI生成文案失败，使用默认文案', { error });
            // 降级方案：使用模板生成
            return this.generateDefaultCeremony(data, context);
        }
    }
    /**
     * 生成默认庆祝文案（AI失败时的降级方案）
     */
    generateDefaultCeremony(data, context) {
        const levelTitles = {
            2: '破冰成功，正式启航',
            3: '进入专业赛道',
            4: '成为独当一面的创作者',
            5: '跨入高级创作者行列',
            6: '达到专家级水平'
        };
        const achievements = [];
        if (context.totalTasksCompleted > 0) {
            achievements.push(`完成了${context.totalTasksCompleted}个真实项目`);
        }
        if (context.averageRating >= 4.0) {
            achievements.push(`保持了${context.averageRating.toFixed(1)}分的高质量评价`);
        }
        if (context.skillsAcquired.length > 0) {
            achievements.push(`掌握了${context.skillsAcquired.length}项新技能`);
        }
        const nextLevelPreviews = {
            2: '现在你可以接更多类型的项目，开始建立自己的作品集',
            3: '解锁了跨赛道项目，报酬提升20-30%',
            4: '可以接复杂度更高的项目，并有机会成为新人导师',
            5: '进入高价值项目池，报酬提升50%以上',
            6: '可以接企业定制项目，并参与平台重大决策'
        };
        return {
            title: levelTitles[data.newLevel] || `升至Lv.${data.newLevel}`,
            mainMessage: `你在${context.daysOnPlatform}天里，一步步走到了Lv.${data.newLevel}。这不是运气，是你每一次尝试、每一次修改积累出来的。`,
            achievements: achievements.length > 0 ? achievements : ['完成了首个里程碑', '开始建立个人能力档案', '在启程找到了自己的节奏'],
            nextLevelPreview: nextLevelPreviews[data.newLevel] || `开启Lv.${data.newLevel}的新能力`,
            celebrationEmoji: data.newLevel >= 5 ? '🏆' : data.newLevel >= 3 ? '🎊' : '🎉',
            soundEffect: this.selectSoundEffect(data.newLevel, data.triggerReason)
        };
    }
    /**
     * 选择音效类型
     */
    selectSoundEffect(level, triggerReason) {
        if (level >= 5)
            return 'milestone';
        if (triggerReason === 'quality_breakthrough')
            return 'breakthrough';
        return 'level_up';
    }
    /**
     * 获取触发原因标签
     */
    getTriggerReasonLabel(reason) {
        const labels = {
            task_milestone: '完成任务里程碑',
            quality_breakthrough: '质量突破',
            skill_mastery: '技能精通'
        };
        return labels[reason] || '综合成长';
    }
    /**
     * 保存仪式记录
     */
    async saveCeremonyRecord(data, content) {
        const ceremonyId = (0, uuid_1.v4)();
        await (0, db_1.query)(`INSERT INTO level_up_ceremonies (
        id, student_id, old_level, new_level, trigger_reason,
        title, main_message, achievements, next_level_preview,
        celebration_emoji, sound_effect, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())`, [
            ceremonyId,
            data.studentId,
            data.oldLevel,
            data.newLevel,
            data.triggerReason,
            content.title,
            content.mainMessage,
            JSON.stringify(content.achievements),
            content.nextLevelPreview,
            content.celebrationEmoji,
            content.soundEffect
        ]);
        return ceremonyId;
    }
    /**
     * 触发通关仪式通知（包含前端LevelUpModal事件）
     */
    async triggerCeremonyNotification(studentId, ceremonyId, content, newLevel) {
        try {
            // 【产品优化 Phase 1.4】触发前端LevelUpModal
            const { frontendEventEmitter } = await Promise.resolve().then(() => __importStar(require('../utils/frontendEventEmitter')));
            // 解析achievements JSON字符串为数组
            let privilegesArray = [];
            if (typeof content.achievements === 'string') {
                try {
                    privilegesArray = JSON.parse(content.achievements);
                }
                catch {
                    privilegesArray = [content.achievements];
                }
            }
            else if (Array.isArray(content.achievements)) {
                privilegesArray = content.achievements;
            }
            // 触发前端升级事件
            await frontendEventEmitter.emitLevelUpEvent(studentId, {
                level: newLevel,
                title: content.title,
                message: content.mainMessage,
                privileges: privilegesArray
            });
            logger_1.default.info('[LevelUpCeremony] 前端升级事件已触发', { studentId, ceremonyId, newLevel });
            // 通过notificationQueue发送通知
            const { notificationQueue } = require('../config/queue');
            await notificationQueue.add('level-up-ceremony', {
                studentId,
                ceremonyId,
                title: content.title,
                message: content.mainMessage,
                type: 'level_up_ceremony',
                priority: 1, // 高优先级
                data: {
                    ceremonyContent: content
                }
            });
            logger_1.default.info('[LevelUpCeremony] 通知已加入队列', {
                studentId,
                ceremonyId
            });
        }
        catch (error) {
            logger_1.default.error('[LevelUpCeremony] 触发通知失败', { error, studentId, ceremonyId });
            // 不抛出错误，允许仪式继续
        }
    }
    /**
     * 获取学生的历史升级仪式记录
     */
    async getStudentCeremonies(studentId, limit = 10) {
        const ceremonies = await (0, db_1.query)(`SELECT
         id, old_level, new_level, trigger_reason,
         title, main_message, achievements, next_level_preview,
         celebration_emoji, sound_effect, created_at
       FROM level_up_ceremonies
       WHERE student_id = $1
       ORDER BY created_at DESC
       LIMIT $2`, [studentId, limit]);
        return ceremonies.map(c => ({
            ...c,
            achievements: typeof c.achievements === 'string'
                ? JSON.parse(c.achievements)
                : c.achievements
        }));
    }
    /**
     * 获取单个仪式详情
     */
    async getCeremonyById(ceremonyId) {
        const ceremony = await (0, db_1.queryOne)(`SELECT
         id, student_id, old_level, new_level, trigger_reason,
         title, main_message, achievements, next_level_preview,
         celebration_emoji, sound_effect, created_at
       FROM level_up_ceremonies
       WHERE id = $1`, [ceremonyId]);
        if (!ceremony) {
            return null;
        }
        return {
            ...ceremony,
            achievements: typeof ceremony.achievements === 'string'
                ? JSON.parse(ceremony.achievements)
                : ceremony.achievements
        };
    }
}
exports.levelUpCeremonyService = new LevelUpCeremonyService();
exports.default = exports.levelUpCeremonyService;
//# sourceMappingURL=levelUpCeremonyService.js.map