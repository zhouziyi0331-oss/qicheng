"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const RealProject_1 = require("../models/RealProject");
const realProjects_data_1 = require("./seedData/realProjects.data");
dotenv_1.default.config();
/**
 * 导入真实可接单项目
 */
const seedRealProjects = async () => {
    try {
        await mongoose_1.default.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/qicheng_opc');
        console.log('✓ 数据库连接成功\n');
        console.log('开始导入真实项目...');
        // 清空现有的available项目（可选）
        const existingCount = await RealProject_1.RealProject.countDocuments({ status: 'available' });
        console.log(`现有可接单项目: ${existingCount}个`);
        const realProjects = await RealProject_1.RealProject.insertMany(realProjects_data_1.realProjectsData);
        console.log(`✓ 成功导入 ${realProjects.length} 个真实项目\n`);
        console.log('项目列表:');
        realProjects.forEach((p, i) => {
            console.log(`  ${i + 1}. ${p.title} (${p.category}, ${p.difficulty}, ¥${p.budget})`);
        });
        console.log('\n✅ 真实项目导入完成！');
    }
    catch (error) {
        console.error('❌ 导入失败:', error);
        process.exit(1);
    }
    finally {
        await mongoose_1.default.disconnect();
        console.log('\n✓ 数据库连接已关闭');
        process.exit(0);
    }
};
seedRealProjects();
//# sourceMappingURL=seedRealProjects.js.map