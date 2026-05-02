import { Router } from 'express';
import {
  getMentorList,
  getMentorDetail,
  updateMentorStatus,
  getMentorSessions
} from './mentorController';

const router = Router();

// 导师列表
router.get('/', getMentorList);

// 导师详情
router.get('/:id', getMentorDetail);

// 更新导师状态
router.put('/:id/status', updateMentorStatus);

// 咨询会话列表
router.get('/sessions', getMentorSessions);

export default router;
