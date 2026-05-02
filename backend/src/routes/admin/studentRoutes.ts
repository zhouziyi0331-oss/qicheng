import { Router } from 'express';
import {
  getStudentList,
  getStudentDetail,
  getStudentAbility,
  getStudentGrowth,
  updateStudentStatus
} from './studentController';

const router = Router();

// 学生列表
router.get('/', getStudentList);

// 学生详情
router.get('/:id', getStudentDetail);

// 学生能力画像
router.get('/:id/ability', getStudentAbility);

// 学生成长轨迹
router.get('/:id/growth', getStudentGrowth);

// 更新学生状态
router.put('/:id/status', updateStudentStatus);

export default router;
