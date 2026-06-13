"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const logger_1 = __importDefault(require("../utils/logger"));
const config_1 = require("../../config");
// 生成测试用的JWT令牌
const companyPayload = {
    userId: '11111111-1111-1111-1111-111111111111', // 测试企业ID
    role: 'company'
};
const studentPayload = {
    userId: '99999999-9999-9999-9999-999999999999', // 测试学生ID
    role: 'student'
};
const companyToken = jsonwebtoken_1.default.sign(companyPayload, config_1.config.jwt.accessSecret, {
    expiresIn: '7d'
});
const studentToken = jsonwebtoken_1.default.sign(studentPayload, config_1.config.jwt.accessSecret, {
    expiresIn: '7d'
});
logger_1.default.info('\n=== 测试令牌 ===\n');
logger_1.default.info('企业令牌 (Company Token):');
logger_1.default.info(companyToken);
logger_1.default.info('\n学生令牌 (Student Token):');
logger_1.default.info(studentToken);
logger_1.default.info('\n使用方式:');
logger_1.default.info('curl -H "Authorization: Bearer <token>" http://localhost:3000/api/v1/...');
logger_1.default.info('\n');
//# sourceMappingURL=generateTestToken.js.map