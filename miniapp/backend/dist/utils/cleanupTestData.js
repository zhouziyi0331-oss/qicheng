"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanupTestData = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const User_1 = require("../models/User");
const PracticeProject_1 = require("../models/PracticeProject");
const PracticeReport_1 = require("../models/PracticeReport");
const Collaboration_1 = require("../models/Collaboration");
const RealProject_1 = require("../models/RealProject");
const Assessment_1 = require("../models/Assessment");
const AbilityRadar_1 = require("../models/AbilityRadar");
const Income_1 = require("../models/Income");
const Withdrawal_1 = require("../models/Withdrawal");
const SecretSpace_1 = require("../models/SecretSpace");
const Achievement_1 = require("../models/Achievement");
dotenv_1.default.config();
/**
 * 清理测试数据脚本
 * 删除所有标记为测试数据的记录
 */
const cleanupTestData = async () => {
    try {
        // 生产环境警告
        if (process.env.NODE_ENV === 'production') {
            console.log('⚠️  警告: 正在生产环境中运行清理脚本');
            console.log('请确认要删除测试数据...');
        }
        console.log('🗑️  开始清理测试数据...');
        // 查找所有测试用户
        const testUsers = await User_1.User.find({ isTestData: true });
        const testUserIds = testUsers.map(u => u._id);
        console.log(`找到 ${testUsers.length} 个测试用户`);
        if (testUserIds.length === 0) {
            console.log('✓ 没有测试数据需要清理');
            return;
        }
        // 删除测试用户相关的所有数据
        const results = await Promise.all([
            // 删除测试用户
            User_1.User.deleteMany({ isTestData: true }),
            // 删除测试用户的项目
            PracticeProject_1.PracticeProject.deleteMany({ userId: { $in: testUserIds } }),
            // 删除测试用户的报告
            PracticeReport_1.PracticeReport.deleteMany({ userId: { $in: testUserIds } }),
            // 删除测试用户的协作
            Collaboration_1.Collaboration.deleteMany({
                $or: [
                    { fromUserId: { $in: testUserIds } },
                    { toUserId: { $in: testUserIds } }
                ]
            }),
            // 删除测试用户的真实项目
            RealProject_1.RealProject.deleteMany({ userId: { $in: testUserIds } }),
            // 删除测试用户的测评
            Assessment_1.Assessment.deleteMany({ userId: { $in: testUserIds } }),
            // 删除测试用户的能力雷达
            AbilityRadar_1.AbilityRadar.deleteMany({ userId: { $in: testUserIds } }),
            // 删除测试用户的收入
            Income_1.Income.deleteMany({ userId: { $in: testUserIds } }),
            // 删除测试用户的提现
            Withdrawal_1.Withdrawal.deleteMany({ userId: { $in: testUserIds } }),
            // 删除测试用户的秘密空间
            SecretSpace_1.SecretSpace.deleteMany({ userId: { $in: testUserIds } }),
            // 删除测试用户的成就
            Achievement_1.Achievement.deleteMany({ userId: { $in: testUserIds } })
        ]);
        console.log('\n📊 清理结果:');
        console.log(`  - 用户: ${results[0].deletedCount}`);
        console.log(`  - 练习项目: ${results[1].deletedCount}`);
        console.log(`  - 练习报告: ${results[2].deletedCount}`);
        console.log(`  - 协作记录: ${results[3].deletedCount}`);
        console.log(`  - 真实项目: ${results[4].deletedCount}`);
        console.log(`  - 测评记录: ${results[5].deletedCount}`);
        console.log(`  - 能力雷达: ${results[6].deletedCount}`);
        console.log(`  - 收入记录: ${results[7].deletedCount}`);
        console.log(`  - 提现记录: ${results[8].deletedCount}`);
        console.log(`  - 秘密空间: ${results[9].deletedCount}`);
        console.log(`  - 成就记录: ${results[10].deletedCount}`);
        const totalDeleted = results.reduce((sum, r) => sum + r.deletedCount, 0);
        console.log(`\n✓ 总共清理了 ${totalDeleted} 条测试数据`);
    }
    catch (error) {
        console.error('❌ 清理测试数据失败:', error.message);
        throw error;
    }
};
exports.cleanupTestData = cleanupTestData;
// 直接运行
if (require.main === module) {
    const run = async () => {
        try {
            await mongoose_1.default.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/qicheng');
            console.log('✓ 已连接到数据库');
            await (0, exports.cleanupTestData)();
            await mongoose_1.default.connection.close();
            console.log('\n✓ 数据库连接已关闭');
            process.exit(0);
        }
        catch (error) {
            console.error('执行失败:', error);
            process.exit(1);
        }
    };
    run();
}
//# sourceMappingURL=cleanupTestData.js.map