"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const orderController_1 = require("./orderController");
const router = (0, express_1.Router)();
// 订单列表
router.get('/', orderController_1.getOrderList);
// 异常订单列表
router.get('/abnormal', orderController_1.getAbnormalOrders);
// 纠纷列表
router.get('/disputes', orderController_1.getDisputeList);
// 订单详情
router.get('/:id', orderController_1.getOrderDetail);
// 处理纠纷
router.post('/disputes/:id/resolve', orderController_1.resolveDispute);
// 强制完成订单
router.post('/:id/force-complete', orderController_1.forceCompleteOrder);
// 取消订单
router.post('/:id/cancel', orderController_1.cancelOrder);
exports.default = router;
//# sourceMappingURL=orderRoutes.js.map