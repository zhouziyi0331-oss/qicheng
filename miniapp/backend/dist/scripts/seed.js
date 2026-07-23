"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const database_1 = require("../config/database");
const seed_1 = require("../utils/seed");
dotenv_1.default.config();
const runSeed = async () => {
    try {
        console.log('连接数据库...');
        await (0, database_1.connectDatabase)();
        console.log('开始填充测试数据...');
        await (0, seed_1.seedDatabase)();
        console.log('\n✅ 全部完成！');
        process.exit(0);
    }
    catch (error) {
        console.error('❌ 执行失败:', error);
        process.exit(1);
    }
};
runSeed();
//# sourceMappingURL=seed.js.map