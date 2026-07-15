/**
 * 前端事件发射器
 *
 * 用于后端触发前端事件（如升级仪式、成就解锁等）
 * 通过 WebSocket 或通知系统将事件推送到前端
 */

import logger from './logger';
import { notificationQueue } from '../queues/notificationQueue';

interface LevelUpEventData {
  level: number;
  title: string;
  message: string;
  privileges: string[];
}

interface FrontendEventPayload {
  eventType: string;
  userId: string;
  data: any;
  timestamp: number;
}

class FrontendEventEmitter {
  /**
   * 触发升级事件（前端 LevelUpModal）
   */
  async emitLevelUpEvent(userId: string, eventData: LevelUpEventData): Promise<void> {
    try {
      logger.info('[FrontendEvent] 触发升级事件', {
        userId,
        level: eventData.level
      });

      const payload: FrontendEventPayload = {
        eventType: 'levelUp',
        userId,
        data: eventData,
        timestamp: Date.now()
      };

      // 通过通知队列发送到前端
      await notificationQueue.add('frontend-event', {
        userId,
        eventType: 'levelUp',
        payload: eventData,
        deliveryMethod: 'websocket', // 优先使用 WebSocket
        fallbackMethod: 'http_poll' // 降级到 HTTP 轮询
      });

      logger.info('[FrontendEvent] 升级事件已加入队列', { userId });

    } catch (error) {
      logger.error('[FrontendEvent] 触发升级事件失败', {
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
  async emitAchievementUnlocked(
    userId: string,
    achievementData: {
      achievementId: string;
      title: string;
      description: string;
      icon: string;
    }
  ): Promise<void> {
    try {
      await notificationQueue.add('frontend-event', {
        userId,
        eventType: 'achievementUnlocked',
        payload: achievementData,
        deliveryMethod: 'websocket'
      });
    } catch (error) {
      logger.error('[FrontendEvent] 触发成就解锁事件失败', { error });
    }
  }

  /**
   * 触发新任务推送事件
   */
  async emitNewTaskPush(
    userId: string,
    taskData: {
      taskId: string;
      title: string;
      matchScore: number;
      matchReasons: string[];
    }
  ): Promise<void> {
    try {
      await notificationQueue.add('frontend-event', {
        userId,
        eventType: 'newTaskPush',
        payload: taskData,
        deliveryMethod: 'websocket'
      });
    } catch (error) {
      logger.error('[FrontendEvent] 触发任务推送事件失败', { error });
    }
  }

  /**
   * 触发通用前端事件
   */
  async emitEvent(
    userId: string,
    eventType: string,
    data: any
  ): Promise<void> {
    try {
      await notificationQueue.add('frontend-event', {
        userId,
        eventType,
        payload: data,
        deliveryMethod: 'websocket'
      });
    } catch (error) {
      logger.error('[FrontendEvent] 触发前端事件失败', { error, eventType });
    }
  }
}

export const frontendEventEmitter = new FrontendEventEmitter();
export default frontendEventEmitter;
