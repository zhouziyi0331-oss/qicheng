interface FollowData {
    company_id: string;
    student_id: string;
    follow_source?: string;
    follow_reason?: string;
    tags?: string[];
    notes?: string;
}
interface NotificationSettings {
    notify_on_available?: boolean;
    notify_on_level_up?: boolean;
    notify_on_new_skill?: boolean;
}
interface Collection {
    id?: string;
    company_id: string;
    name: string;
    description?: string;
    color?: string;
}
/**
 * E-09: 关注学生服务
 * 管理企业对学生的关注、动态、通知等功能
 */
declare class FollowService {
    /**
     * 关注学生
     */
    followStudent(data: FollowData): Promise<any>;
    /**
     * 取消关注
     */
    unfollowStudent(companyId: string, studentId: string): Promise<void>;
    /**
     * 检查是否关注
     */
    isFollowing(companyId: string, studentId: string): Promise<boolean>;
    /**
     * 获取企业关注的学生列表
     */
    getFollowingStudents(companyId: string, limit?: number, offset?: number): Promise<any[]>;
    /**
     * 获取关注该学生的企业列表
     */
    getFollowers(studentId: string, limit?: number, offset?: number): Promise<any[]>;
    /**
     * 更新关注设置
     */
    updateFollowSettings(companyId: string, studentId: string, settings: NotificationSettings & {
        tags?: string[];
        notes?: string;
    }): Promise<any>;
    /**
     * 获取学生动态
     */
    getStudentActivities(studentId: string, limit?: number, offset?: number): Promise<any[]>;
    /**
     * 获取关注学生的动态流
     */
    getFollowingActivitiesFeed(companyId: string, limit?: number): Promise<any[]>;
    /**
     * 获取关注通知
     */
    getFollowNotifications(companyId: string, limit?: number, offset?: number): Promise<any[]>;
    /**
     * 标记通知已读
     */
    markNotificationAsRead(notificationId: string, companyId: string): Promise<void>;
    /**
     * 标记所有通知已读
     */
    markAllNotificationsAsRead(companyId: string): Promise<void>;
    /**
     * 获取未读通知数
     */
    getUnreadNotificationCount(companyId: string): Promise<number>;
    /**
     * 创建收藏夹
     */
    createCollection(data: Collection): Promise<any>;
    /**
     * 获取企业的收藏夹列表
     */
    getCollections(companyId: string): Promise<any[]>;
    /**
     * 更新收藏夹
     */
    updateCollection(collectionId: string, updates: Partial<Collection>): Promise<any>;
    /**
     * 删除收藏夹
     */
    deleteCollection(collectionId: string, companyId: string): Promise<void>;
    /**
     * 将学生添加到收藏夹
     */
    addStudentToCollection(collectionId: string, studentId: string): Promise<void>;
    /**
     * 从收藏夹移除学生
     */
    removeStudentFromCollection(collectionId: string, studentId: string): Promise<void>;
    /**
     * 获取收藏夹中的学生
     */
    getCollectionStudents(collectionId: string): Promise<any[]>;
    /**
     * 获取关注统计
     */
    getFollowStats(companyId: string): Promise<any>;
    /**
     * 获取推荐关注的学生
     */
    getRecommendedStudents(companyId: string, limit?: number): Promise<any[]>;
}
declare const _default: FollowService;
export default _default;
//# sourceMappingURL=followService.d.ts.map