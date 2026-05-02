import jwt from 'jsonwebtoken';
import { config } from '../../config';

// 生成测试用的JWT令牌
const companyPayload = {
  userId: '11111111-1111-1111-1111-111111111111', // 测试企业ID
  role: 'company' as const
};

const studentPayload = {
  userId: '99999999-9999-9999-9999-999999999999', // 测试学生ID
  role: 'student' as const
};

const companyToken = jwt.sign(companyPayload, config.jwt.accessSecret, {
  expiresIn: '7d'
});

const studentToken = jwt.sign(studentPayload, config.jwt.accessSecret, {
  expiresIn: '7d'
});

console.log('\n=== 测试令牌 ===\n');
console.log('企业令牌 (Company Token):');
console.log(companyToken);
console.log('\n学生令牌 (Student Token):');
console.log(studentToken);
console.log('\n使用方式:');
console.log('curl -H "Authorization: Bearer <token>" http://localhost:3000/api/v1/...');
console.log('\n');
