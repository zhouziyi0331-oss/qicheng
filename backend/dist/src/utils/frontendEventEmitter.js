"use strict";
/**
 * 前端事件发射器
 *
 * 用于后端触发前端事件（如升级仪式、成就解锁等）
 * 通过 WebSocket 或通知系统将事件推送到前端
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.frontendEventEmitter = void 0;
const logger_1 = __importDefault(require("./logger"));
const notificationQueue_1 = require("../queues/notificationQueue");
class FrontendEventEmitter {
    /**
     * 触发升级事件（前端 LevelUpModal）
     */
    async emitLevelUpEvent(userId, eventData) {
        try {
            logger_1.default.info('[FrontendEvent] 触发升级事件', {
                userId,
                level: eventData.level
            });
            const payload = {
                eventType: 'levelUp',
                userId,
                data: eventData,
                timestamp: Date.now()
            };
            // 通过通知队列发送到前端
            await notificationQueue_1.notificationQueue.add('frontend-event', {
                userId,
                eventType: 'levelUp',
                payload: eventData,
                deliveryMethod: 'websocket', // 优先使用 WebSocket
                fallbackMethod: 'http_poll' // 降级到 HTTP 轮询
            });
            logger_1.default.info('[FrontendEvent] 升级事件已加入队列', { userId });
        }
        catch (error) {
            logger_1.default.error('[FrontendEvent] 触发升级事件失败', {
                error,
                userId,
                eventData
            });
            // 不抛出错误，避免阻塞主流程
        }
    }
    /**
     * 触发成就解锁事件
     */
    async emitAchievementUnlocked(userId, achievementData) {
        try {
            await notificationQueue_1.notificationQueue.add('frontend-event', {
                userId,
                eventType: 'achievementUnlocked',
                payload: achievementData,
                deliveryMethod: 'websocket'
            });
        }
        catch (error) {
            logger_1.default.error('[FrontendEvent] 触发成就解锁事件失败', { error });
        }
    }
    /**
     * 触发新任务推送事件
     */
    async emitNewTaskPush(userId, taskData) {
        try {
            await notificationQueue_1.notificationQueue.add('frontend-event', {
                userId,
                eventType: 'newTaskPush',
                payload: taskData,
                deliveryMethod: 'websocket'
            });
        }
        catch (error) {
            logger_1.default.error('[FrontendEvent] 触发任务推送事件失败', { error });
        }
    }
    /**
     * 触发通用前端事件
     */
    async emitEvent(userId, eventType, data) {
        try {
            await notificationQueue_1.notificationQueue.add('frontend-event', {
                userId,
                eventType,
                payload: data,
                deliveryMethod: 'websocket'
            });
        }
        catch (error) {
            logger_1.default.error('[FrontendEvent] 触发前端事件失败', { error, eventType });
        }
    }
}
exports.frontendEventEmitter = new FrontendEventEmitter();
exports.default = exports.frontendEventEmitter;
//# sourceMappingURL=frontendEventEmitter.js.map