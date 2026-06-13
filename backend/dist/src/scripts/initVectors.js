#!/usr/bin/env ts-node
"use strict";
/**
 * 向量初始化脚本
 * 为现有的任务和学生生成embedding向量
 *
 * 运行方式：
 * npm run init-vectors
 * 或
 * ts-node src/scripts/initVectors.ts
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vectorGenerationService_1 = __importDefault(require("../services/vectorGenerationService"));
const studentCapabilityService_1 = __importDefault(require("../services/studentCapabilityService"));
const logger_1 = __importDefault(require("../utils/logger"));
async function initVectors() {
    logger_1.default.info('========================================');
    logger_1.default.info('开始初始化向量系统');
    logger_1.default.info('========================================\n');
    try {
        // 1. 初始化所有学生的能力画像
        logger_1.default.info('步骤 1/3: 初始化学生能力画像...');
        await studentCapabilityService_1.default.initializeAllStudents();
        logger_1.default.info('✓ 学生能力画像初始化完成\n');
        // 2. 为所有任务生成向量
        logger_1.default.info('步骤 2/3: 为所有任务生成向量...');
        await vectorGenerationService_1.default.updateAllTaskEmbeddings();
        logger_1.default.info('✓ 任务向量生成完成\n');
        // 3. 为所有学生生成向量
        logger_1.default.info('步骤 3/3: 为所有学生生成向量...');
        await vectorGenerationService_1.default.updateAllStudentEmbeddings();
        logger_1.default.info('✓ 学生向量生成完成\n');
        logger_1.default.info('========================================');
        logger_1.default.info('向量初始化完成！');
        logger_1.default.info('========================================');
        logger_1.default.info('\n现在可以使用语义匹配功能了。');
        logger_1.default.info('\n企业发布任务后，调用以下API触发匹配：');
        logger_1.default.info('POST /api/v1/tasks/:taskId/trigger-matching\n');
        process.exit(0);
    }
    catch (error) {
        logger_1.default.error('\n❌ 向量初始化失败:', error);
        logger_1.default.error('Vector initialization failed:', error);
        process.exit(1);
    }
}
// 运行初始化
initVectors();
//# sourceMappingURL=initVectors.js.map