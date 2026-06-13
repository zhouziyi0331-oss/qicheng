"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const hybridMatchingService_1 = require("../services/hybridMatchingService");
const logger_1 = __importDefault(require("../utils/logger"));
const db_1 = __importDefault(require("../utils/db"));
async function regenerateStudentEmbeddings() {
    try {
        // 获取所有学生ID
        const result = await db_1.default.query(`
      SELECT u.id, u.nickname
      FROM users u
      WHERE u.role = 'student'
      ORDER BY u.created_at
    `);
        logger_1.default.info(`找到 ${result.length} 个学生，开始重新生成embedding...`);
        logger_1.default.info('=====================================');
        for (const student of result) {
            logger_1.default.info(`\n正在处理学生: ${student.nickname || student.id}`);
            try {
                await hybridMatchingService_1.hybridMatchingService.generateStudentEmbedding(student.id);
                logger_1.default.info(`✅ 成功生成embedding`);
            }
            catch (error) {
                logger_1.default.error(`❌ 失败: ${error.message}`);
            }
        }
        logger_1.default.info('\n=====================================');
        logger_1.default.info('所有学生embedding生成完成！');
        process.exit(0);
    }
    catch (error) {
        logger_1.default.error('错误:', error);
        process.exit(1);
    }
}
regenerateStudentEmbeddings();
//# sourceMappingURL=regenerateStudentEmbeddings.js.map