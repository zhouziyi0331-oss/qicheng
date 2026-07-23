"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// 生成测试token
const generateTestTokens = () => {
    const jwtSecret = process.env.JWT_SECRET || 'default-secret-key';
    // 普通用户token
    const userToken = jsonwebtoken_1.default.sign({
        userId: '6a587d4c29906132d3f1fe8b', // 张小白的ID（从之前的测试报告获取）
        openId: 'test_user_001',
        role: 'user'
    }, jwtSecret, { expiresIn: '7d' });
    // 管理员token
    const adminToken = jsonwebtoken_1.default.sign({
        userId: '6a5888964b296d3ed7a1c0a6', // 管理员ID（从刚才检查结果获取）
        openId: 'admin_001',
        role: 'admin'
    }, jwtSecret, { expiresIn: '7d' });
    console.log('=== 测试Token已生成 ===\n');
    console.log('普通用户Token (张小白):');
    console.log(userToken);
    console.log('\n管理员Token:');
    console.log(adminToken);
    console.log('\n使用方法:');
    console.log('curl -H "Authorization: Bearer <token>" http://localhost:3000/api/...');
};
generateTestTokens();
//# sourceMappingURL=generateTestTokens.js.map