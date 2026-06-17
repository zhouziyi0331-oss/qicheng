"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../utils/db");
const logger_1 = __importDefault(require("../utils/logger"));
class SkillTagService {
    /**
     * 获取用户的技能标签（用于招募帖预填）
     */
    async getUserSkills(userId) {
        try {
            const profile = await this.buildUserSkillProfile(userId);
            // 合并所有技能标签，去重
            const allSkills = [
                profile.personalityTag,
                ...profile.topStrengths,
                ...profile.frequentSkills,
                ...profile.dimensionSkills,
            ].filter(Boolean);
            // 去重并返回前10个
            const uniqueSkills = Array.from(new Set(allSkills));
            return uniqueSkills.slice(0, 10);
        }
        catch (error) {
            logger_1.default.error('Failed to get user skills:', error);
            return [];
        }
    }
    /**
     * 构建用户技能画像
     */
    async buildUserSkillProfile(userId) {
        const profile = {
            personalityTag: '',
            topStrengths: [],
            frequentSkills: [],
            dimensionSkills: [],
        };
        try {
            // 1. 获取人格标签
            const abilityProfile = await (0, db_1.queryOne)(`SELECT personality_tag, top_strengths, six_dimensions
         FROM user_ability_profiles
         WHERE user_id = $1`, [userId]);
            if (abilityProfile) {
                profile.personalityTag = abilityProfile.personality_tag || '';
                profile.topStrengths = abilityProfile.top_strengths || [];
                // 2. 从六维画像中提取得分≥70的维度
                if (abilityProfile.six_dimensions) {
                    const dimensions = abilityProfile.six_dimensions;
                    const dimensionMap = {
                        openness: '开放性',
                        persistence: '坚持性',
                        creativity: '创造力',
                        collaboration: '协作能力',
                        learning_agility: '学习敏捷度',
                        execution: '执行力',
                    };
                    Object.entries(dimensions).forEach(([key, value]) => {
                        if (typeof value === 'number' && value >= 70) {
                            const skillName = dimensionMap[key];
                            if (skillName) {
                                profile.dimensionSkills.push(skillName);
                            }
                        }
                    });
                }
            }
            // 3. 从成长观察记录中提取高频技能
            const growthObservations = await (0, db_1.query)(`SELECT skills_shown
         FROM mentor_growth_observations
         WHERE student_id = $1
         ORDER BY created_at DESC
         LIMIT 10`, [userId]);
            const skillFrequency = {};
            growthObservations.forEach((row) => {
                if (row.skills_shown && Array.isArray(row.skills_shown)) {
                    row.skills_shown.forEach((skill) => {
                        skillFrequency[skill] = (skillFrequency[skill] || 0) + 1;
                    });
                }
            });
            // 按频率排序，取前3个
            profile.frequentSkills = Object.entries(skillFrequency)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 3)
                .map(([skill]) => skill);
            return profile;
        }
        catch (error) {
            logger_1.default.error('Failed to build user skill profile:', error);
            return profile;
        }
    }
    /**
     * 获取技能标签库（按赛道分类）
     */
    async getSkillLibrary(track) {
        // 预置技能标签库
        const skillLibrary = {
            content: [
                'AI生图',
                '视觉设计',
                '品牌设计',
                '文案策划',
                '社交媒体运营',
                '视频剪辑',
                '动画制作',
                '插画设计',
                '平面设计',
                'UI设计',
                '摄影',
                '内容策划',
                '故事叙事',
                '用户体验设计',
                '交互设计',
            ],
            dev: [
                'React',
                'Vue',
                'Node.js',
                'Python',
                'AI Agent开发',
                'N8N',
                'API集成',
                '数据库设计',
                '后端开发',
                '前端开发',
                '全栈开发',
                '微信小程序',
                'TypeScript',
                'JavaScript',
                'SQL',
                'Git',
                '测试',
                '部署',
            ],
            common: [
                '项目管理',
                '沟通协调',
                '需求分析',
                '产品设计',
                '用户研究',
                '数据分析',
                '文档撰写',
                '演示汇报',
                '时间管理',
                '团队协作',
            ],
        };
        if (track === 'content') {
            return {
                content: skillLibrary.content,
                dev: [],
                common: skillLibrary.common,
            };
        }
        else if (track === 'dev') {
            return {
                content: [],
                dev: skillLibrary.dev,
                common: skillLibrary.common,
            };
        }
        return skillLibrary;
    }
    /**
     * 智能推荐需求技能（基于项目描述）
     */
    async recommendRequiredSkills(projectDescription, track) {
        try {
            // 简单的关键词匹配推荐
            const skillLibrary = await this.getSkillLibrary(track);
            const allSkills = [
                ...skillLibrary.content,
                ...skillLibrary.dev,
                ...skillLibrary.common,
            ];
            const recommendations = [];
            allSkills.forEach(skill => {
                if (projectDescription.includes(skill)) {
                    recommendations.push({
                        skillName: skill,
                        requiredLevel: 'must',
                    });
                }
            });
            return recommendations.slice(0, 5);
        }
        catch (error) {
            logger_1.default.error('Failed to recommend required skills:', error);
            return [];
        }
    }
    /**
     * 验证技能标签是否有效
     */
    async validateSkillTags(skills) {
        const skillLibrary = await this.getSkillLibrary();
        const allValidSkills = [
            ...skillLibrary.content,
            ...skillLibrary.dev,
            ...skillLibrary.common,
        ];
        const invalidSkills = skills.filter(skill => !allValidSkills.includes(skill));
        return {
            valid: invalidSkills.length === 0,
            invalidSkills,
        };
    }
}
exports.default = new SkillTagService();
//# sourceMappingURL=skillTagService.js.map