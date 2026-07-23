"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.secretSpaceService = exports.SecretSpaceService = void 0;
const SecretSpace_1 = require("../models/SecretSpace");
const mongoose_1 = __importDefault(require("mongoose"));
/**
 * 小猫的秘密空间服务
 *
 * 核心功能：每个用户的私密成长空间
 * 完全个性化，记录天数、心情、笔记等私密数据
 */
class SecretSpaceService {
    /**
     * 初始化用户的秘密空间（注册时调用）
     */
    async initializeSecretSpace(userId) {
        const secretSpace = new SecretSpace_1.SecretSpace({
            userId: new mongoose_1.default.Types.ObjectId(userId),
            daysSinceJoined: 0,
            consecutiveDays: 0,
            moodRecords: [],
            privateNotes: [],
            personalMilestones: [],
            favoriteQuotes: [],
            settings: {
                theme: 'cat',
                backgroundColor: '#FFF5E1',
                isPublic: false
            }
        });
        await secretSpace.save();
        return secretSpace;
    }
    /**
     * 获取用户的秘密空间
     */
    async getSecretSpace(userId) {
        const secretSpace = await SecretSpace_1.SecretSpace.findOne({
            userId: new mongoose_1.default.Types.ObjectId(userId)
        });
        // 如果不存在，自动创建
        if (!secretSpace) {
            return await this.initializeSecretSpace(userId);
        }
        return secretSpace;
    }
    /**
     * 签到（更新天数）
     * 使用UTC+8（中国标准时间）统一处理，避免跨时区问题
     */
    async checkIn(userId) {
        const secretSpace = await this.getSecretSpace(userId);
        if (!secretSpace) {
            throw new Error('秘密空间不存在');
        }
        // 使用UTC+8（中国标准时间），统一时区处理
        const now = new Date();
        const chinaTime = new Date(now.getTime() + (8 * 60 * 60 * 1000));
        const today = new Date(Date.UTC(chinaTime.getUTCFullYear(), chinaTime.getUTCMonth(), chinaTime.getUTCDate()));
        // 检查是否已经签到过
        if (secretSpace.lastCheckInDate) {
            const lastCheckIn = new Date(secretSpace.lastCheckInDate);
            const lastCheckInChina = new Date(lastCheckIn.getTime() + (8 * 60 * 60 * 1000));
            const lastCheckInDay = new Date(Date.UTC(lastCheckInChina.getUTCFullYear(), lastCheckInChina.getUTCMonth(), lastCheckInChina.getUTCDate()));
            // 今天已签到
            if (lastCheckInDay.getTime() === today.getTime()) {
                return {
                    secretSpace,
                    isConsecutive: true
                };
            }
            // 计算是否连续
            const dayDiff = Math.floor((today.getTime() - lastCheckInDay.getTime()) / (1000 * 60 * 60 * 24));
            if (dayDiff === 1) {
                // 连续签到
                secretSpace.consecutiveDays += 1;
            }
            else {
                // 中断了，重新开始
                secretSpace.consecutiveDays = 1;
            }
        }
        else {
            // 第一次签到
            secretSpace.consecutiveDays = 1;
        }
        secretSpace.daysSinceJoined += 1;
        secretSpace.lastCheckInDate = now;
        await secretSpace.save();
        // 触发成就检查
        const { backgroundTaskService } = require('./backgroundTask.service');
        await backgroundTaskService.createTask({
            userId,
            taskType: 'achievement_check',
            taskName: '检查成就解锁（签到）'
        });
        // 连续签到奖励
        let reward;
        if (secretSpace.consecutiveDays === 7) {
            reward = { exp: 50, message: '连续签到7天，获得50经验值！' };
        }
        else if (secretSpace.consecutiveDays === 30) {
            reward = { exp: 200, message: '连续签到30天，获得200经验值！' };
        }
        return {
            secretSpace,
            isConsecutive: secretSpace.consecutiveDays > 1,
            reward
        };
    }
    /**
     * 记录心情
     */
    async recordMood(userId, mood, note, tags) {
        const secretSpace = await this.getSecretSpace(userId);
        if (!secretSpace) {
            throw new Error('秘密空间不存在');
        }
        secretSpace.moodRecords.push({
            date: new Date(),
            mood,
            note,
            tags: tags || []
        });
        await secretSpace.save();
        return secretSpace;
    }
    /**
     * 获取心情记录（支持日期范围查询）
     */
    async getMoodRecords(userId, startDate, endDate) {
        const secretSpace = await this.getSecretSpace(userId);
        if (!secretSpace) {
            return [];
        }
        let records = secretSpace.moodRecords;
        if (startDate || endDate) {
            records = records.filter(record => {
                const recordDate = new Date(record.date);
                if (startDate && recordDate < startDate)
                    return false;
                if (endDate && recordDate > endDate)
                    return false;
                return true;
            });
        }
        return records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
    /**
     * 添加私密笔记
     */
    async addPrivateNote(userId, title, content, tags) {
        const secretSpace = await this.getSecretSpace(userId);
        if (!secretSpace) {
            throw new Error('秘密空间不存在');
        }
        secretSpace.privateNotes.push({
            title,
            content,
            createdAt: new Date(),
            updatedAt: new Date(),
            tags: tags || []
        });
        await secretSpace.save();
        return secretSpace;
    }
    /**
     * 更新私密笔记
     */
    async updatePrivateNote(userId, noteId, updates) {
        const secretSpace = await this.getSecretSpace(userId);
        if (!secretSpace) {
            throw new Error('秘密空间不存在');
        }
        const note = secretSpace.privateNotes.find((n) => n._id.toString() === noteId);
        if (!note) {
            throw new Error('笔记不存在');
        }
        if (updates.title)
            note.title = updates.title;
        if (updates.content)
            note.content = updates.content;
        if (updates.tags)
            note.tags = updates.tags;
        note.updatedAt = new Date();
        await secretSpace.save();
        return secretSpace;
    }
    /**
     * 删除私密笔记
     */
    async deletePrivateNote(userId, noteId) {
        const secretSpace = await this.getSecretSpace(userId);
        if (!secretSpace) {
            throw new Error('秘密空间不存在');
        }
        secretSpace.privateNotes = secretSpace.privateNotes.filter((note) => note._id.toString() !== noteId);
        await secretSpace.save();
        return secretSpace;
    }
    /**
     * 添加个人里程碑
     */
    async addPersonalMilestone(userId, title, description, targetDate) {
        const secretSpace = await this.getSecretSpace(userId);
        if (!secretSpace) {
            throw new Error('秘密空间不存在');
        }
        secretSpace.personalMilestones.push({
            title,
            description,
            targetDate,
            completed: false
        });
        await secretSpace.save();
        return secretSpace;
    }
    /**
     * 完成个人里程碑
     */
    async completeMilestone(userId, milestoneId) {
        const secretSpace = await this.getSecretSpace(userId);
        if (!secretSpace) {
            throw new Error('秘密空间不存在');
        }
        const milestone = secretSpace.personalMilestones.find((m) => m._id.toString() === milestoneId);
        if (!milestone) {
            throw new Error('里程碑不存在');
        }
        milestone.completed = true;
        milestone.completedAt = new Date();
        await secretSpace.save();
        return secretSpace;
    }
    /**
     * 添加名言收藏
     */
    async addFavoriteQuote(userId, text, author) {
        const secretSpace = await this.getSecretSpace(userId);
        if (!secretSpace) {
            throw new Error('秘密空间不存在');
        }
        secretSpace.favoriteQuotes.push({
            text,
            author,
            savedAt: new Date()
        });
        await secretSpace.save();
        return secretSpace;
    }
    /**
     * 更新空间设置
     */
    async updateSettings(userId, settings) {
        const secretSpace = await this.getSecretSpace(userId);
        if (!secretSpace) {
            throw new Error('秘密空间不存在');
        }
        if (settings.theme)
            secretSpace.settings.theme = settings.theme;
        if (settings.backgroundColor)
            secretSpace.settings.backgroundColor = settings.backgroundColor;
        if (settings.isPublic !== undefined)
            secretSpace.settings.isPublic = settings.isPublic;
        await secretSpace.save();
        return secretSpace;
    }
    /**
     * 获取空间统计
     */
    async getSpaceStats(userId) {
        const secretSpace = await this.getSecretSpace(userId);
        if (!secretSpace) {
            throw new Error('秘密空间不存在');
        }
        // 心情分布统计
        const moodCounts = new Map();
        for (const record of secretSpace.moodRecords) {
            moodCounts.set(record.mood, (moodCounts.get(record.mood) || 0) + 1);
        }
        const moodDistribution = Array.from(moodCounts.entries()).map(([mood, count]) => ({
            mood,
            count
        }));
        return {
            daysSinceJoined: secretSpace.daysSinceJoined,
            consecutiveDays: secretSpace.consecutiveDays,
            totalMoodRecords: secretSpace.moodRecords.length,
            totalNotes: secretSpace.privateNotes.length,
            totalMilestones: secretSpace.personalMilestones.length,
            completedMilestones: secretSpace.personalMilestones.filter(m => m.completed).length,
            totalQuotes: secretSpace.favoriteQuotes.length,
            moodDistribution
        };
    }
}
exports.SecretSpaceService = SecretSpaceService;
exports.secretSpaceService = new SecretSpaceService();
//# sourceMappingURL=secretSpace.service.js.map