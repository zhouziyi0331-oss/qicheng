/**
 * 前端事件发射器
 *
 * 用于后端触发前端事件（如升级仪式、成就解锁等）
 * 通过 WebSocket 或通知系统将事件推送到前端
 */
interface LevelUpEventData {
    level: number;
    title: string;
    message: string;
    privileges: string[];
}
declare class FrontendEventEmitter {
    /**
     * 触发升级事件（前端 LevelUpModal）
     */
    emitLevelUpEvent(userId: string, eventData: LevelUpEventData): Promise<void>;
    /**
     * 触发成就解锁事件
     */
    emitAchievementUnlocked(userId: string, achievementData: {
        achievementId: string;
        title: string;
        description: string;
        icon: string;
    }): Promise<void>;
    /**
     * 触发新任务推送事件
     */
    emitNewTaskPush(userId: string, taskData: {
        taskId: string;
        title: string;
        matchScore: number;
        matchReasons: string[];
    }): Promise<void>;
    /**
     * 触发通用前端事件
     */
    emitEvent(userId: string, eventType: string, data: any): Promise<void>;
}
export declare const frontendEventEmitter: FrontendEventEmitter;
export default frontendEventEmitter;
//# sourceMappingURL=frontendEventEmitter.d.ts.map