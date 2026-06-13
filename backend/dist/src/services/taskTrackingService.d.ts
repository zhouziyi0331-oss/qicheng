/**
 * E-23, E-24, E-25, E-26, E-27, E-28: 任务追踪系统服务
 */
declare class TaskTrackingService {
    /**
     * E-23: 获取任务进度仪表盘
     */
    getProgressDashboard(taskId: string): Promise<any>;
    /**
     * 创建进度快照
     */
    createProgressSnapshot(taskId: string): Promise<void>;
    /**
     * E-24: 创建任务里程碑
     */
    createMilestone(data: {
        task_id: string;
        milestone_name: string;
        description?: string;
        sequence_number: number;
        due_date?: Date;
        deliverables?: string[];
        acceptance_criteria?: string[];
        budget_allocation?: number;
    }): Promise<any>;
    /**
     * 学生提交里程碑
     */
    submitMilestone(milestoneId: string, submission: string, files?: any[]): Promise<any>;
    /**
     * 企业确认里程碑
     */
    confirmMilestone(milestoneId: string, approved: boolean, feedback?: string, rejectedReason?: string): Promise<any>;
    /**
     * 获取任务里程碑列表
     */
    getMilestones(taskId: string): Promise<any[]>;
    /**
     * E-25: 创建交付通知
     */
    createDeliveryNotification(data: {
        task_id: string;
        milestone_id?: string;
        notification_type: string;
        recipient_id: string;
        recipient_role: string;
        title: string;
        message: string;
        days_until_due?: number;
    }): Promise<any>;
    /**
     * 获取用户的通知列表
     */
    getNotifications(userId: string, unreadOnly?: boolean): Promise<any[]>;
    /**
     * 标记通知为已读
     */
    markNotificationAsRead(notificationId: string): Promise<void>;
    /**
     * E-26: 创建沟通记录归档
     */
    archiveCommunication(taskId: string, startDate: Date, endDate: Date, archivedBy: string): Promise<any>;
    /**
     * 获取任务的归档记录
     */
    getArchives(taskId: string): Promise<any[]>;
    /**
     * E-27: 创建延期预警
     */
    createDelayWarning(data: {
        task_id: string;
        warning_type: string;
        severity: string;
        warning_message: string;
        warning_data?: any;
        suggested_actions?: string[];
    }): Promise<any>;
    /**
     * 解决预警
     */
    resolveWarning(warningId: string, resolutionNote?: string): Promise<any>;
    /**
     * 获取任务的预警列表
     */
    getWarnings(taskId: string, includeResolved?: boolean): Promise<any[]>;
    /**
     * E-28: 创建紧急介入请求
     */
    createEmergencyIntervention(data: {
        task_id: string;
        initiated_by: string;
        initiator_role: string;
        reason: string;
        reason_detail: string;
    }): Promise<any>;
    /**
     * 管理员响应介入请求
     */
    respondToIntervention(interventionId: string, adminId: string, response: string): Promise<any>;
    /**
     * 解决介入请求
     */
    resolveIntervention(interventionId: string, resolution: string, resolutionActions?: any): Promise<any>;
    /**
     * 获取介入请求列表
     */
    getInterventions(filters: {
        task_id?: string;
        status?: string;
        admin_id?: string;
    }): Promise<any[]>;
}
declare const _default: TaskTrackingService;
export default _default;
//# sourceMappingURL=taskTrackingService.d.ts.map