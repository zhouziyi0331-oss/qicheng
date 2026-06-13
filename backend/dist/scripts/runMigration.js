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
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../src/utils/db");
const fs_1 = require("fs");
const path = __importStar(require("path"));
async function runMigration(migrationFile) {
    const migrationPath = path.join(__dirname, '..', 'migrations', migrationFile);
    console.log(`正在运行迁移: ${migrationFile}`);
    try {
        const sql = await fs_1.promises.readFile(migrationPath, 'utf-8');
        const client = await db_1.pool.connect();
        try {
            await client.query(sql);
            console.log(`✅ 迁移成功: ${migrationFile}`);
        }
        finally {
            client.release();
        }
    }
    catch (error) {
        console.error(`❌ 迁移失败: ${migrationFile}`);
        console.error(error.message);
        throw error;
    }
    finally {
        await db_1.pool.end();
    }
}
const migrationFile = process.argv[2];
if (!migrationFile) {
    console.error('请指定迁移文件名，例如: npm run migrate:run 094_semantic_matching_system.sql');
    process.exit(1);
}
runMigration(migrationFile).catch(() => process.exit(1));
//# sourceMappingURL=runMigration.js.map