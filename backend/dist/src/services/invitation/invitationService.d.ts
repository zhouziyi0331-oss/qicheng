/**
 * 邀请任务服务
 * 处理邀请任务的创建、发送、响应等核心业务逻辑
 */
interface InvitationTask {
    id: string;
    company_id: string;
    title: string;
    description: string;
    requirements: string;
    deliverables: string;
    budget: number;
    deadline: Date;
    target_level_min: number;
    target_abilities: Record<string, number>;
    target_tags: string[];
    max_invitations: number;
    status: string;
}
interface InvitationRecord {
    id: string;
    task_id: string;
    student_id: string;
    company_id: string;
    invitation_message: string;
    match_score: number;
    match_reason: any;
    status: string;
    expires_at: Date;
}
export declare class InvitationTaskService {
    /**
     * 创建邀请任务并自动匹配学生
     */
    createInvitationTask(companyId: string, taskData: {
        title: string;
        description: string;
        requirements?: string;
        deliverables?: string;
        budget: number;
        deadline?: Date;
        target_level_min?: number;
        target_abilities?: Record<string, number>;
        target_tags?: string[];
        max_invitations?: number;
        invitation_message?: string;
    }): Promise<{
        task: InvitationTask;
        invitations: InvitationRecord[];
    }>;
    /**
     * 获取学生收到的邀请列表
     */
    getStudentInvitations(studentId: string, status?: string): Promise<Array<InvitationRecord & {
        task: InvitationTask;
        company_name: string;
    }>>;
    /**
     * 学生接受邀请
     */
    acceptInvitation(invitationId: string, studentId: string, responseMessage?: string): Promise<{
        invitation: InvitationRecord;
        taskId: string;
    }>;
    /**
     * 学生拒绝邀请
     */
    rejectInvitation(invitationId: string, studentId: string, responseMessage?: string): Promise<void>;
    /**
     * 标记邀请为已查看
     */
    markAsViewed(invitationId: string, studentId: string): Promise<void>;
    /**
     * 将邀请任务转换为正式任务
     */
    private convertToFormalTask;
    /**
     * 获取商家发出的邀请列表
     */
    getCompanyInvitations(companyId: string, taskId?: string): Promise<Array<InvitationRecord & {
        student_name: string;
    }>>;
    /**
     * 商家撤回邀请
     */
    withdrawInvitation(invitationId: string, companyId: string): Promise<void>;
    /**
     * 自动过期邀请（定时任务调用）
     */
    expireInvitations(): Promise<number>;
    /**
     * 获取邀请任务详情
     */
    getInvitationTask(taskId: string): Promise<InvitationTask | null>;
    /**
     * 更新邀请任务状态
     */
    updateTaskStatus(taskId: string, companyId: string, status: 'active' | 'paused' | 'closed'): Promise<void>;
    /**
     * 获取邀请统计
     */
    getInvitationStats(companyId: string): Promise<{
        total_sent: number;
        pending: number;
        accepted: number;
        rejected: number;
        expired: number;
        acceptance_rate: number;
    }>;
}
export declare const invitationTaskService: InvitationTaskService;
export {};
//# sourceMappingURL=invitationService.d.ts.map