"use strict";
/**
 * 消息中转路由
 *
 * 定义消息中转和联系方式交换的API路由
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const messageRelayController = __importStar(require("../controllers/messageRelayController"));
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// =====================================================
// 所有路由都需要认证
// =====================================================
router.use(auth_1.authenticate);
// =====================================================
// 消息中转路由
// =====================================================
/**
 * 发送消息（通过AI中转）
 * POST /api/relay/send
 */
router.post('/send', messageRelayController.sendMessage);
/**
 * 获取任务的中转消息
 * GET /api/relay/messages/:taskId
 */
router.get('/messages/:taskId', messageRelayController.getMessages);
/**
 * 获取消息统计（仅平台管理员）
 * GET /api/relay/statistics
 */
router.get('/statistics', messageRelayController.getStatistics);
/**
 * 获取违规记录（仅平台管理员）
 * GET /api/relay/violations
 */
router.get('/violations', messageRelayController.getViolations);
// =====================================================
// 联系方式交换路由
// =====================================================
/**
 * 同意交换联系方式
 * POST /api/relay/exchange/agree
 */
router.post('/exchange/agree', messageRelayController.agreeToExchange);
/**
 * 获取交换状态
 * GET /api/relay/exchange/status
 */
router.get('/exchange/status', messageRelayController.getExchangeStatus);
/**
 * 检查是否可以交换联系方式
 * GET /api/relay/exchange/can-exchange
 */
router.get('/exchange/can-exchange', messageRelayController.canExchange);
exports.default = router;
//# sourceMappingURL=messageRelayRoutes.js.map