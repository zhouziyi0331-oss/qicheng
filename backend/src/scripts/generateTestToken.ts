import jwt from 'jsonwebtoken';
import logger from '../utils/logger';
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

logger.info('\n=== 测试令牌 ===\n');
logger.info('企业令牌 (Company Token):');
logger.info(companyToken);
logger.info('\n学生令牌 (Student Token):');
logger.info(studentToken);
logger.info('\n使用方式:');
logger.info('curl -H "Authorization: Bearer <token>" http://localhost:3000/api/v1/...');
logger.info('\n');
