import { Router } from 'express';
import {
  getCompanyList,
  getCompanyDetail,
  getPendingVerifications,
  verifyCompany,
  getCompanyTasks
} from './companyController';

const router = Router();

// 企业列表
router.get('/', getCompanyList);

// 待审核企业列表
router.get('/pending-verifications', getPendingVerifications);

// 企业详情
router.get('/:id', getCompanyDetail);

// 审核企业认证
router.post('/:id/verify', verifyCompany);

// 企业需求管理
router.get('/:id/tasks', getCompanyTasks);

export default router;
