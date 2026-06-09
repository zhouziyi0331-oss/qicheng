/**
 * 指定大师派单服务
 *
 * 功能：
 * 1. 获取大师列表（带筛选）
 * 2. 发送邀请给大师
 * 3. 处理大师响应（接受/拒绝/协商）
 * 4. 管理协商流程
 */
interface MasterFilter {
    track?: 'A' | 'B' | 'AB';
    specialties?: string[];
    onlineOnly?: boolean;
    minRating?: number;
}
interface MasterInfo {
    masterId: string;
    nickname: string;
    avatarUrl: string;
    minHourlyRate: number;
    minOrderPrice: number;
    acceptDesignated: boolean;
    allowNegotiation: boolean;
    specialties: string[];
    isOnline: boolean;
    currentLoad: number;
    completedTasks: number;
    avgRating: number;
    createdAt: Date;
}
interface InvitationInput {
    taskId: string;
    enterpriseId: string;
    masterId: string;
    enterpriseOffer: number;
    message?: string;
}
interface InvitationResponse {
    invitationId: string;
    status: 'pending' | 'accepted' | 'negotiating' | 'rejected' | 'expired';
    masterCounterOffer?: number;
    masterNote?: string;
}
declare class DesignatedMasterService {
    /**
     * 获取大师列表
     */
    getMasterList(filter?: MasterFilter): Promise<MasterInfo[]>;
    /**
     * 获取单个大师详情
     */
    getMasterDetail(masterId: string): Promise<MasterInfo | null>;
    /**
     * 发送邀请给大师
     */
    sendInvitation(input: InvitationInput): Promise<InvitationResponse>;
    /**
     * 大师响应邀请
     */
    respondToInvitation(invitationId: string, masterId: string, action: 'accept' | 'reject' | 'negotiate', counterOffer?: number, note?: string): Promise<InvitationResponse>;
    /**
     * 创建任务分配（大师接受邀请后）
     */
    private createTaskAssignment;
    /**
     * 获取邀请详情
     */
    getInvitationDetail(invitationId: string): Promise<any>;
    /**
     * 自动过期超时的邀请
     */
    expireOldInvitations(): Promise<number>;
}
declare const _default: DesignatedMasterService;
export default _default;
//# sourceMappingURL=designatedMasterService.d.ts.map