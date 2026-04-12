/**
 * 指令8: 任务沟通中转机制
 * GET  /chat/:taskId/messages  — 获取沟通记录
 * POST /chat/:taskId/messages  — 发送消息 (含联系方式过滤)
 */
import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { contactFilterMiddleware } from '../../middleware/contactFilter';
import * as controller from './controller';

const router = Router();
router.use(authenticate);

router.get('/:taskId/messages', controller.getMessages);
// contactFilterMiddleware 在所有 POST 消息上强制过滤联系方式
router.post('/:taskId/messages', contactFilterMiddleware, controller.sendMessage);

export default router;
