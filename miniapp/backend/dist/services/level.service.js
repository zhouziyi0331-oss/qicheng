"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.levelService = exports.LevelService = void 0;
const User_1 = require("../models/User");
const level_config_1 = require("../config/level.config");
const logger_1 = require("../utils/logger");
const mongoose_1 = __importDefault(require("mongoose"));
/**
 * 等级服务
 * 管理用户等级、经验值、升级逻辑
 */
class LevelService {
    /**
     * 获取用户等级信息
     */
    async getUserLevel(userId) {
        const user = await User_1.User.findById(userId);
        if (!user) {
            throw new Error('用户不存在');
        }
        const exp = user.exp || 0;
        const levelInfo = (0, level_config_1.calculateLevelProgress)(exp);
        return {
            ...levelInfo,
            totalExp: exp,
            userName: user.nickname,
            userLevel: user.level
        };
    }
    /**
     * 增加经验值
     */
    async addExp(userId, exp, reason, metadata) {
        const user = await User_1.User.findById(userId);
        if (!user) {
            throw new Error('用户不存在');
        }
        const oldExp = user.exp || 0;
        const newExp = oldExp + exp;
        const oldLevel = (0, level_config_1.getLevelByExp)(oldExp);
        const newLevel = (0, level_config_1.getLevelByExp)(newExp);
        // 更新用户经验值
        user.exp = newExp;
        // 检查是否升级
        const leveledUp = newLevel.level > oldLevel.level;
        if (leveledUp) {
            user.level = newLevel.level;
            logger_1.log.info('用户升级', {
                userId,
                oldLevel: oldLevel.level,
                newLevel: newLevel.level,
                oldLevelName: oldLevel.name,
                newLevelName: newLevel.name
            });
        }
        await user.save();
        // 记录经验值获得历史
        await this.recordExpHistory(userId, exp, reason, metadata);
        // 如果升级，触发升级事件
        if (leveledUp) {
            await this.handleLevelUp(userId, oldLevel.level, newLevel.level);
        }
        logger_1.log.info('经验值增加', { userId, exp, reason, newExp, leveledUp });
        return {
            success: true,
            expAdded: exp,
            totalExp: newExp,
            oldLevel: oldLevel.name,
            newLevel: newLevel.name,
            leveledUp,
            levelInfo: (0, level_config_1.calculateLevelProgress)(newExp)
        };
    }
    /**
     * 记录经验值历史
     */
    async recordExpHistory(userId, exp, reason, metadata) {
        try {
            const { ExpHistory } = require('../models/ExpHistory');
            await ExpHistory.create({
                userId: new mongoose_1.default.Types.ObjectId(userId),
                exp,
                reason,
                metadata,
                createdAt: new Date()
            });
        }
        catch (error) {
            logger_1.log.error('记录经验值历史失败', { error: error.message });
            // 不影响主流程
        }
    }
    /**
     * 处理升级事件
     */
    async handleLevelUp(userId, oldLevel, newLevel) {
        try {
            // 1. 创建升级通知
            // TODO: 实现通知系统
            // 2. 解锁新权益
            // TODO: 实现权益解锁
            // 3. 记录里程碑
            await this.recordLevelMilestone(userId, newLevel);
            logger_1.log.info('升级事件处理完成', { userId, oldLevel, newLevel });
        }
        catch (error) {
            logger_1.log.error('处理升级事件失败', { error: error.message });
            // 不影响主流程
        }
    }
    /**
     * 记录等级里程碑
     */
    async recordLevelMilestone(userId, level) {
        try {
            const { Milestone } = require('../models/Milestone');
            const levelConfig = level_config_1.LEVEL_SYSTEM.find(l => l.level === level);
            if (levelConfig) {
                await Milestone.create({
                    userId: new mongoose_1.default.Types.ObjectId(userId),
                    type: 'level_up',
                    title: `升级到 ${levelConfig.name}`,
                    description: levelConfig.description,
                    metadata: {
                        level: level,
                        levelName: levelConfig.name,
                        unlocks: levelConfig.unlocks
                    },
                    achievedAt: new Date()
                });
            }
        }
        catch (error) {
            logger_1.log.error('记录等级里程碑失败', { error: error.message });
        }
    }
    /**
     * 项目完成时增加经验值
     */
    async addExpForProjectCompletion(userId, projectId, difficulty, rating) {
        try {
            // 检查是否是首个项目
            const user = await User_1.User.findById(userId);
            const isFirstProject = (user?.totalProjects || 0) === 1;
            // 计算经验值
            const exp = (0, level_config_1.calculateProjectExp)(difficulty, rating, isFirstProject);
            // 增加经验值
            const result = await this.addExp(userId, exp, '完成项目', {
                projectId,
                difficulty,
                rating,
                isFirstProject
            });
            return result;
        }
        catch (error) {
            logger_1.log.error('项目完成经验值增加失败', { error: error.message });
            throw error;
        }
    }
    /**
     * OPC测评完成时增加经验值
     */
    async addExpForOPCCompletion(userId) {
        return this.addExp(userId, level_config_1.EXP_RULES.firstTime.completeOPC, '完成OPC测评');
    }
    /**
     * 热情火花捕捉时增加经验值
     */
    async addExpForPassionSpark(userId, sparkId) {
        // 检查是否是首次
        const { PassionSpark } = require('../models/PassionSpark');
        const count = await PassionSpark.countDocuments({
            userId: new mongoose_1.default.Types.ObjectId(userId)
        });
        const isFirst = count === 1;
        const exp = isFirst
            ? level_config_1.EXP_RULES.firstTime.firstPassionSpark + level_config_1.EXP_RULES.growth.passionSpark
            : level_config_1.EXP_RULES.growth.passionSpark;
        return this.addExp(userId, exp, '捕捉热情火花', { sparkId, isFirst });
    }
    /**
     * 穿越感时刻时增加经验值
     */
    async addExpForFlowMoment(userId, momentId) {
        // 检查是否是首次
        const { FlowMoment } = require('../models/FlowMoment');
        const count = await FlowMoment.countDocuments({
            userId: new mongoose_1.default.Types.ObjectId(userId)
        });
        const isFirst = count === 1;
        const exp = isFirst
            ? level_config_1.EXP_RULES.firstTime.firstFlowMoment + level_config_1.EXP_RULES.growth.flowMoment
            : level_config_1.EXP_RULES.growth.flowMoment;
        return this.addExp(userId, exp, '体验穿越感时刻', { momentId, isFirst });
    }
    /**
     * 深度对话时增加经验值（超过5轮）
     */
    async addExpForDeepChat(userId, conversationId) {
        return this.addExp(userId, level_config_1.EXP_RULES.growth.aiChatDeep, 'AI深度对话', { conversationId });
    }
    /**
     * 连接生命问题时增加经验值
     */
    async addExpForLifeQuestionConnection(userId) {
        return this.addExp(userId, level_config_1.EXP_RULES.firstTime.connectLifeQuestion, '连接生命问题');
    }
    /**
     * 检查并解锁里程碑成就
     */
    async checkMilestones(userId) {
        try {
            const user = await User_1.User.findById(userId);
            if (!user) {
                return;
            }
            const totalProjects = user.totalProjects || 0;
            const totalIncome = user.totalIncome || 0;
            const { RealProject } = require('../models/RealProject');
            // 项目数量里程碑
            if (totalProjects === 5 && !await this.hasMilestone(userId, 'projects_5')) {
                await this.addExp(userId, level_config_1.EXP_RULES.milestones.projects5, '完成5个项目里程碑');
                await this.saveMilestone(userId, 'projects_5');
            }
            if (totalProjects === 10 && !await this.hasMilestone(userId, 'projects_10')) {
                await this.addExp(userId, level_config_1.EXP_RULES.milestones.projects10, '完成10个项目里程碑');
                await this.saveMilestone(userId, 'projects_10');
            }
            if (totalProjects === 20 && !await this.hasMilestone(userId, 'projects_20')) {
                await this.addExp(userId, level_config_1.EXP_RULES.milestones.projects20, '完成20个项目里程碑');
                await this.saveMilestone(userId, 'projects_20');
            }
            if (totalProjects === 50 && !await this.hasMilestone(userId, 'projects_50')) {
                await this.addExp(userId, level_config_1.EXP_RULES.milestones.projects50, '完成50个项目里程碑');
                await this.saveMilestone(userId, 'projects_50');
            }
            // 收入里程碑
            if (totalIncome >= 10000 && !await this.hasMilestone(userId, 'income_10k')) {
                await this.addExp(userId, level_config_1.EXP_RULES.milestones.income10k, '累计收入达到¥10,000');
                await this.saveMilestone(userId, 'income_10k');
            }
            if (totalIncome >= 30000 && !await this.hasMilestone(userId, 'income_30k')) {
                await this.addExp(userId, level_config_1.EXP_RULES.milestones.income30k, '累计收入达到¥30,000');
                await this.saveMilestone(userId, 'income_30k');
            }
            if (totalIncome >= 60000 && !await this.hasMilestone(userId, 'income_60k')) {
                await this.addExp(userId, level_config_1.EXP_RULES.milestones.income60k, '累计收入达到¥60,000');
                await this.saveMilestone(userId, 'income_60k');
            }
            // 5星评价里程碑
            const fiveStarCount = await RealProject.countDocuments({
                userId: new mongoose_1.default.Types.ObjectId(userId),
                'clientRating.score': 5
            });
            if (fiveStarCount >= 5 && !await this.hasMilestone(userId, 'rating_5star_5')) {
                await this.addExp(userId, level_config_1.EXP_RULES.milestones.rating5count5, '获得5次五星评价');
                await this.saveMilestone(userId, 'rating_5star_5');
            }
        }
        catch (error) {
            logger_1.log.error('检查里程碑失败', { error: error.message });
        }
    }
    /**
     * 检查是否已达成里程碑
     */
    async hasMilestone(userId, milestoneKey) {
        try {
            const { Milestone } = require('../models/Milestone');
            const count = await Milestone.countDocuments({
                userId: new mongoose_1.default.Types.ObjectId(userId),
                'metadata.key': milestoneKey
            });
            return count > 0;
        }
        catch {
            return false;
        }
    }
    /**
     * 保存里程碑记录
     */
    async saveMilestone(userId, milestoneKey) {
        try {
            const { Milestone } = require('../models/Milestone');
            await Milestone.create({
                userId: new mongoose_1.default.Types.ObjectId(userId),
                type: 'achievement',
                title: `里程碑: ${milestoneKey}`,
                metadata: { key: milestoneKey },
                achievedAt: new Date()
            });
        }
        catch (error) {
            logger_1.log.error('保存里程碑失败', { error: error.message });
        }
    }
    /**
     * 获取等级榜单
     */
    async getLevelLeaderboard(limit = 50) {
        const users = await User_1.User.find()
            .sort({ level: -1, exp: -1 })
            .limit(limit)
            .select('nickname avatar level exp totalProjects totalIncome');
        return users.map((user, index) => {
            const levelInfo = (0, level_config_1.calculateLevelProgress)(user.exp || 0);
            return {
                rank: index + 1,
                userId: user._id,
                nickname: user.nickname,
                avatar: user.avatar,
                level: levelInfo.currentLevel.level,
                levelName: levelInfo.currentLevel.name,
                exp: user.exp || 0,
                totalProjects: user.totalProjects || 0,
                totalIncome: user.totalIncome || 0
            };
        });
    }
    /**
     * 获取所有等级配置
     */
    getAllLevels() {
        return level_config_1.LEVEL_SYSTEM;
    }
}
exports.LevelService = LevelService;
exports.levelService = new LevelService();
//# sourceMappingURL=level.service.js.map