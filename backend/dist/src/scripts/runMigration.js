"use strict";
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
const pg_1 = require("pg");
const logger_1 = __importDefault(require("../utils/logger"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const dotenv = __importStar(require("dotenv"));
// 加载环境变量
dotenv.config();
/**
 * 运行数据库迁移脚本
 */
async function runMigration() {
    const pool = new pg_1.Pool({
        connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/qicheng',
    });
    try {
        logger_1.default.info('连接数据库...');
        // 读取迁移文件
        const migrationPath = path.join(__dirname, '../../scripts/db/015_hybrid_matching_embeddings.sql');
        const sql = fs.readFileSync(migrationPath, 'utf-8');
        logger_1.default.info('执行迁移: 015_hybrid_matching_embeddings.sql');
        // 执行迁移
        await pool.query(sql);
        logger_1.default.info('✅ 迁移成功完成！');
        logger_1.default.info('已添加：');
        logger_1.default.info('  - pgvector扩展');
        logger_1.default.info('  - tasks表的embedding字段（title_embedding, description_embedding, combined_embedding）');
        logger_1.default.info('  - users表的embedding字段（skills_embedding, interests_embedding, profile_embedding）');
        logger_1.default.info('  - ai_match_logs表（记录混合匹配日志）');
        logger_1.default.info('  - 向量索引（加速相似度搜索）');
    }
    catch (error) {
        logger_1.default.error('❌ 迁移失败:', error);
        process.exit(1);
    }
    finally {
        await pool.end();
    }
}
runMigration();
//# sourceMappingURL=runMigration.js.map