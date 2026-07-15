/**
 * 任务邀约服务
 *
 * 处理定向邀约的核心业务逻辑
 */
export interface TaskInvitation {
    id: string;
    task_id: string;
    student_id: string;
    status: 'pending' | 'accepted' | 'declined' | 'expired' | 'cancelled';
    invitation_type: 'auto' | 'paid';
    invitation_reason: string | null;
    match_score: number | null;
    match_details: any;
    rank: number | null;
    invited_at: Date;
    responded_at: Date | null;
    expires_at: Date;
    paid_amount: number;
    payment_id: string | null;
}
export interface InvitationWithTask extends TaskInvitation {
    task_title: string;
    task_description: string;
    task_budget: number;
    task_deadline: string;
    company_name: string;
    company_id: string;
}
export interface MyInvitationsResponse {
    pending: InvitationWithTask[];
    accepted: InvitationWithTask[];
    declined: InvitationWithTask[];
    expired: InvitationWithTask[];
}
declare class TaskInvitationService {
    /**
     * 获取学生的所有邀约
     */
    getMyInvitations(studentId: string): Promise<MyInvitationsResponse>;
    /**
     * 接受邀约
     */
    acceptInvitation(invitationId: string, studentId: string): Promise<TaskInvitation>;
    /**
     * 拒绝邀约
     */
    declineInvitation(invitationId: string, studentId: string): Promise<TaskInvitation>;
    /**
     * 获取单个邀约详情
     */
    getInvitationDetail(invitationId: string, studentId: string): Promise<InvitationWithTask | null>;
    /**
     * 自动过期24小时未响应的邀约
     */
    expireOldInvitations(): Promise<number>;
    /**
     * 创建邀约（供后台匹配引擎调用）
     */
    createInvitation(params: {
        taskId: string;
        studentId: string;
        invitationType: 'auto' | 'paid';
        invitationReason?: string;
        matchScore?: number;
        matchDetails?: any;
        rank?: number;
        paidAmount?: number;
        paymentId?: string;
    }): Promise<TaskInvitation>;
    /**
     * 批量创建邀约（供匹配引擎调用）
     */
    createBatchInvitations(taskId: string, students: Array<{
        studentId: string;
        matchScore: number;
        matchReasons: string[];
        matchDetails: any;
        rank: number;
    }>): Promise<TaskInvitation[]>;
}
export declare const taskInvitationService: TaskInvitationService;
export {};
//# sourceMappingURL=taskInvitationService.d.ts.map