"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const User_1 = require("../models/User");
const Achievement_1 = require("../models/Achievement");
const SecretSpace_1 = require("../models/SecretSpace");
const TaskProgress_1 = require("../models/TaskProgress");
const PracticeProject_1 = require("../models/PracticeProject");
const RealProject_1 = require("../models/RealProject");
const achievement_service_1 = require("../services/achievement.service");
const secretSpace_service_1 = require("../services/secretSpace.service");
const taskProgress_service_1 = require("../services/taskProgress.service");
const favorite_service_1 = require("../services/favorite.service");
dotenv_1.default.config();
/**
 * 生成个性化系统的测试数据
 * 包括：秘密空间、成就、任务进度、收藏
 */
async function seedPersonalizedFeatures() {
    try {
        console.log('🚀 开始生成个性化功能测试数据...\n');
        // 连接数据库
        await mongoose_1.default.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/qicheng_opc');
        console.log('✓ 数据库连接成功\n');
        // 获取已存在的用户
        const users = await User_1.User.find().limit(3);
        if (users.length === 0) {
            console.log('⚠ 没有找到用户，请先运行 npm run seed 生成基础数据');
            process.exit(1);
        }
        console.log(`✓ 找到 ${users.length} 个用户\n`);
        // 为每个用户生成个性化数据
        for (let i = 0; i < users.length; i++) {
            const user = users[i];
            console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
            console.log(`为用户 ${i + 1}: ${user.nickname} 生成数据`);
            console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
            // 1. 初始化小猫的秘密空间
            console.log('1️⃣ 初始化小猫的秘密空间...');
            const existingSpace = await SecretSpace_1.SecretSpace.findOne({ userId: user._id });
            if (!existingSpace) {
                await secretSpace_service_1.secretSpaceService.initializeSecretSpace(user._id.toString());
            }
            // 签到几天
            const checkInDays = Math.floor(Math.random() * 10) + 5;
            for (let day = 0; day < checkInDays; day++) {
                await secretSpace_service_1.secretSpaceService.checkIn(user._id.toString());
            }
            // 添加心情记录
            const moods = ['excited', 'happy', 'normal', 'tired', 'frustrated'];
            const moodNotes = [
                '今天完成了一个项目，感觉特别有成就感！',
                '学到了很多新知识，开心',
                '平平淡淡也是一种幸福',
                '今天有点累，需要休息一下',
                '遇到了一些困难，但我会继续努力的'
            ];
            for (let j = 0; j < 3; j++) {
                const mood = moods[Math.floor(Math.random() * moods.length)];
                const note = moodNotes[Math.floor(Math.random() * moodNotes.length)];
                await secretSpace_service_1.secretSpaceService.recordMood(user._id.toString(), mood, note, ['成长', '项目', '学习']);
            }
            // 添加私密笔记
            await secretSpace_service_1.secretSpaceService.addPrivateNote(user._id.toString(), '我的目标', '三个月内完成10个项目，提升自己的能力，成为领域专家', ['目标', '计划']);
            await secretSpace_service_1.secretSpaceService.addPrivateNote(user._id.toString(), '今天的收获', '学会了如何更好地与客户沟通，明白了项目管理的重要性', ['反思', '经验']);
            // 添加个人里程碑
            await secretSpace_service_1.secretSpaceService.addPersonalMilestone(user._id.toString(), '完成第一个真实项目', '接到并完成我的第一个真实项目订单', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
            // 添加名言收藏
            await secretSpace_service_1.secretSpaceService.addFavoriteQuote(user._id.toString(), '成功不是终点，失败也不是终结，唯有勇气才是永恒。', '温斯顿·丘吉尔');
            console.log(`   ✓ 签到 ${checkInDays} 天`);
            console.log(`   ✓ 记录了 3 条心情`);
            console.log(`   ✓ 添加了 2 条私密笔记`);
            console.log(`   ✓ 设定了 1 个里程碑`);
            console.log(`   ✓ 收藏了 1 条名言\n`);
            // 2. 初始化成就系统
            console.log('2️⃣ 初始化成就系统...');
            const existingAchievements = await Achievement_1.Achievement.countDocuments({ userId: user._id });
            if (existingAchievements === 0) {
                await achievement_service_1.achievementService.initializeUserAchievements(user._id.toString());
                console.log(`   ✓ 初始化了 10 个成就\n`);
            }
            else {
                console.log(`   ✓ 成就系统已存在 (${existingAchievements} 个成就)\n`);
            }
            // 检查并解锁成就
            const unlockedAchievements = await achievement_service_1.achievementService.checkAllAchievements(user._id.toString());
            if (unlockedAchievements.length > 0) {
                console.log(`   🎉 解锁了 ${unlockedAchievements.length} 个成就:`);
                unlockedAchievements.forEach(ach => {
                    console.log(`      - ${ach.title}`);
                });
                console.log();
            }
            // 3. 生成任务进度（为已有的项目生成拆解）
            console.log('3️⃣ 生成任务进度...');
            const userProjects = await PracticeProject_1.PracticeProject.find({
                userId: user._id,
                status: 'ongoing'
            }).limit(2);
            if (userProjects.length > 0) {
                for (const project of userProjects) {
                    const existingProgress = await TaskProgress_1.TaskProgress.findOne({
                        userId: user._id,
                        projectId: project._id
                    });
                    if (!existingProgress) {
                        try {
                            const taskProgress = await taskProgress_service_1.taskProgressService.generateTaskDecomposition(user._id.toString(), 'practice', project._id.toString());
                            console.log(`   ✓ 为项目"${project.title}"生成了 ${taskProgress.tasks.length} 个任务`);
                            // 更新第一个任务状态为进行中
                            if (taskProgress.tasks.length > 0) {
                                await taskProgress_service_1.taskProgressService.updateTaskStatus(user._id.toString(), taskProgress._id.toString(), 1, {
                                    status: 'in_progress',
                                    startedAt: new Date(),
                                    progress: 30
                                });
                            }
                        }
                        catch (error) {
                            console.log(`   ⚠ 生成任务拆解失败: ${error.message}`);
                        }
                    }
                }
                console.log();
            }
            else {
                console.log('   ⚠ 没有找到进行中的项目，跳过任务拆解生成\n');
            }
            // 4. 添加收藏
            console.log('4️⃣ 添加收藏...');
            const allProjects = await PracticeProject_1.PracticeProject.find({ userId: user._id }).limit(2);
            const realProjects = await RealProject_1.RealProject.find().limit(1);
            let favoriteCount = 0;
            for (const project of allProjects) {
                try {
                    await favorite_service_1.favoriteService.addFavorite(user._id.toString(), 'practice_project', project._id.toString(), '这个项目很有意义，值得收藏', '重要项目');
                    favoriteCount++;
                }
                catch (error) {
                    // 可能已经收藏过
                }
            }
            for (const project of realProjects) {
                try {
                    await favorite_service_1.favoriteService.addFavorite(user._id.toString(), 'real_project', project._id.toString(), '想接这个项目', '待接单');
                    favoriteCount++;
                }
                catch (error) {
                    // 可能已经收藏过
                }
            }
            console.log(`   ✓ 添加了 ${favoriteCount} 个收藏\n`);
            // 5. 统计数据
            console.log('5️⃣ 统计数据:');
            const spaceStats = await secretSpace_service_1.secretSpaceService.getSpaceStats(user._id.toString());
            const achievementStats = await achievement_service_1.achievementService.getAchievementStats(user._id.toString());
            const favoriteStats = await favorite_service_1.favoriteService.getFavoriteStats(user._id.toString());
            const taskProgressList = await taskProgress_service_1.taskProgressService.getUserTaskProgressList(user._id.toString());
            console.log(`   📊 秘密空间:`);
            console.log(`      - 加入天数: ${spaceStats.daysSinceJoined}`);
            console.log(`      - 连续签到: ${spaceStats.consecutiveDays} 天`);
            console.log(`      - 心情记录: ${spaceStats.totalMoodRecords} 条`);
            console.log(`      - 私密笔记: ${spaceStats.totalNotes} 条`);
            console.log(`   🏆 成就系统:`);
            console.log(`      - 总成就数: ${achievementStats.total}`);
            console.log(`      - 已解锁: ${achievementStats.unlocked}`);
            console.log(`      - 解锁率: ${achievementStats.unlockRate}%`);
            console.log(`   ⭐ 收藏系统:`);
            console.log(`      - 总收藏: ${favoriteStats.total}`);
            console.log(`      - 置顶: ${favoriteStats.pinnedCount}`);
            console.log(`   📋 任务进度:`);
            console.log(`      - 项目数: ${taskProgressList.length}`);
        }
        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('✅ 个性化功能测试数据生成完成！');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        console.log('📝 生成的数据包括:');
        console.log('   • 小猫的秘密空间 - 签到、心情记录、私密笔记、里程碑');
        console.log('   • 成就系统 - 10种成就，自动解锁');
        console.log('   • 任务进度 - 基于真实项目的AI拆解');
        console.log('   • 收藏系统 - 项目收藏、分类管理\n');
        console.log('🎯 每个用户的数据都是独一无二的！\n');
    }
    catch (error) {
        console.error('❌ 生成数据失败:', error);
    }
    finally {
        await mongoose_1.default.disconnect();
        console.log('✓ 数据库连接已关闭');
    }
}
seedPersonalizedFeatures();
//# sourceMappingURL=seedPersonalizedFeatures.js.map