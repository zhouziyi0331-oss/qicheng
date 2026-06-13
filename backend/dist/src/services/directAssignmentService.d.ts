interface DirectInvitation {
    id: string;
    task_id: string;
    company_id: string;
    student_id: string;
    invitation_message?: string;
    offered_price?: number;
    deadline?: Date;
    status: 'pending' | 'accepted' | 'declined' | 'expired' | 'cancelled';
    student_response?: string;
    responded_at?: Date;
    created_at: Date;
    expires_at: Date;
}
interface FavoriteStudent {
    id: string;
    company_id: string;
    student_id: string;
    tags: string[];
    notes?: string;
    total_tasks: number;
    avg_rating?: number;
    last_collaborated_at?: Date;
    created_at: Date;
}
interface InvitationStats {
    total_invitations: number;
    accepted_count: number;
    declined_count: number;
    pending_count: number;
    acceptance_rate: number;
}
/**
 * E-08: 定向指定学生服务
 * 企业直接邀请指定学生接单
 */
declare class DirectAssignmentService {
    /**
     * 创建定向邀请
     */
    createDirectInvitation(data: {
        taskId: string;
        companyId: string;
        studentId: string;
        invitationMessage?: string;
        offeredPrice?: number;
        deadline?: Date;
        expiresInHours?: number;
    }): Promise<DirectInvitation>;
    /**
     * 学生响应邀请
     */
    respondToInvitation(invitationId: string, studentId: string, response: {
        accept: boolean;
        message?: string;
    }): Promise<DirectInvitation>;
    /**
     * 企业取消邀请
     */
    cancelInvitation(invitationId: string, companyId: string): Promise<void>;
    /**
     * 获取任务的邀请列表
     */
    getTaskInvitations(taskId: string, companyId: string): Promise<DirectInvitation[]>;
    /**
     * 获取学生收到的邀请列表
     */
    getStudentInvitations(studentId: string, status?: string): Promise<DirectInvitation[]>;
    /**
     * 添加收藏学生
     */
    addFavoriteStudent(companyId: string, studentId: string, data: {
        tags?: string[];
        notes?: string;
    }): Promise<FavoriteStudent>;
    /**
     * 移除收藏学生
     */
    removeFavoriteStudent(companyId: string, studentId: string): Promise<void>;
    /**
     * 获取收藏学生列表
     */
    getFavoriteStudents(companyId: string, options?: {
        tags?: string[];
        limit?: number;
        offset?: number;
    }): Promise<{
        students: any[];
        total: number;
    }>;
    /**
     * 获取邀请统计
     */
    getInvitationStats(companyId: string): Promise<InvitationStats>;
    /**
     * 过期待处理邀请（定时任务调用）
     */
    expirePendingInvitations(): Promise<number>;
}
declare const _default: DirectAssignmentService;
export default _default;
//# sourceMappingURL=directAssignmentService.d.ts.map