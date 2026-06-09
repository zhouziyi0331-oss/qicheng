import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import {
  createDispute,
  getMyDisputes,
  getDisputeDetail,
  handleDispute,
  getAllDisputes
} from './controller';

const router = Router();

// 学生/企业端路由
router.post('/', authenticate, createDispute); // 创建申诉
router.get('/my', authenticate, getMyDisputes); // 获取我的申诉列表
router.get('/:disputeId', authenticate, getDisputeDetail); // 获取申诉详情

// 管理员端路由
router.get('/', authenticate, getAllDisputes); // 获取所有申诉列表（管理员）
router.post('/:disputeId/handle', authenticate, handleDispute); // 处理申诉（管理员）

export default router;
