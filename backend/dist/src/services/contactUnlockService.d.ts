/**
 * 联系方式解锁服务
 *
 * 功能：
 * 1. 申请解锁联系方式
 * 2. 同意/拒绝解锁申请
 * 3. 查看已解锁的联系方式
 * 4. 检查解锁状态
 */
interface UnlockRequest {
    studentId: string;
    companyId: string;
    taskId: string;
    requestedBy: 'student' | 'company';
}
interface UnlockResponse {
    id: string;
    studentId: string;
    companyId: string;
    studentAgreed: boolean;
    companyAgreed: boolean;
    exchanged: boolean;
    canUnlock: boolean;
    collaborationCount: number;
}
interface ContactInfo {
    phone?: string;
    wechat?: string;
    email?: string;
    qq?: string;
}
declare class ContactUnlockService {
    /**
     * 申请解锁联系方式
     */
    requestUnlock(params: UnlockRequest): Promise<UnlockResponse>;
    /**
     * 同意解锁申请
     */
    approveUnlock(studentId: string, companyId: string, approvedBy: 'student' | 'company'): Promise<UnlockResponse>;
    /**
     * 拒绝解锁申请
     */
    rejectUnlock(studentId: string, companyId: string, rejectedBy: 'student' | 'company'): Promise<void>;
    /**
     * 执行解锁（双方都同意后）
     */
    private executeUnlock;
    /**
     * 获取已解锁的联系方式
     */
    getUnlockedContact(studentId: string, companyId: string, requestedBy: 'student' | 'company', requesterId: string): Promise<ContactInfo>;
    /**
     * 获取解锁状态
     */
    getUnlockStatus(studentId: string, companyId: string): Promise<UnlockResponse>;
    /**
     * 检查是否可以解锁
     */
    canUnlock(studentId: string, companyId: string): Promise<{
        eligible: boolean;
        completedCount: number;
    }>;
    /**
     * 获取用户的所有解锁请求
     */
    getUserUnlockRequests(userId: string, userType: 'student' | 'company'): Promise<UnlockResponse[]>;
    /**
     * 格式化解锁响应
     */
    private formatUnlockResponse;
}
declare const _default: ContactUnlockService;
export default _default;
//# sourceMappingURL=contactUnlockService.d.ts.map