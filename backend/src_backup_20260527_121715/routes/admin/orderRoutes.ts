import { Router } from 'express';
import {
  getOrderList,
  getOrderDetail,
  getAbnormalOrders,
  getDisputeList,
  resolveDispute,
  forceCompleteOrder,
  cancelOrder
} from './orderController';

const router = Router();

// 订单列表
router.get('/', getOrderList);

// 异常订单列表
router.get('/abnormal', getAbnormalOrders);

// 纠纷列表
router.get('/disputes', getDisputeList);

// 订单详情
router.get('/:id', getOrderDetail);

// 处理纠纷
router.post('/disputes/:id/resolve', resolveDispute);

// 强制完成订单
router.post('/:id/force-complete', forceCompleteOrder);

// 取消订单
router.post('/:id/cancel', cancelOrder);

export default router;
