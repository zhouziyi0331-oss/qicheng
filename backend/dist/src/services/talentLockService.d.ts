interface TalentLock {
    company_id: string;
    student_id: string;
    lock_type: 'priority' | 'exclusive';
    duration_months: number;
    monthly_fee: number;
    benefits?: any;
    notes?: string;
}
interface LockApplication {
    company_id: string;
    student_id: string;
    lock_type: string;
    duration_months: number;
    monthly_fee: number;
    benefits?: any;
    application_reason?: string;
}
/**
 * E-10: 人才优先锁定服务
 * 企业可以锁定优秀学生，获得优先匹配权或独家合作权
 */
declare class TalentLockService {
    /**
     * 创建锁定申请
     */
    createLockApplication(data: LockApplication): Promise<any>;
    /**
     * 学生响应锁定申请
     */
    respondToApplication(applicationId: string, studentId: string, status: 'accepted' | 'rejected', response?: string): Promise<any>;
    /**
     * 创建人才锁定
     */
    createTalentLock(data: TalentLock): Promise<any>;
    /**
     * 获取企业的锁定列表
     */
    getCompanyLocks(companyId: string, status?: string): Promise<any[]>;
    /**
     * 获取学生的锁定列表
     */
    getStudentLocks(studentId: string, status?: string): Promise<any[]>;
    /**
     * 获取锁定详情
     */
    getLockById(lockId: string): Promise<any>;
    /**
     * 更新锁定状态
     */
    updateLockStatus(lockId: string, status: string, actionBy: string, reason?: string): Promise<any>;
    /**
     * 取消锁定
     */
    cancelLock(lockId: string, cancelledBy: string, reason?: string): Promise<void>;
    /**
     * 续约锁定
     */
    renewLock(lockId: string, additionalMonths: number): Promise<any>;
    /**
     * 添加历史记录
     */
    private addLockHistory;
    /**
     * 获取价格配置
     */
    getPricing(lockType: string, studentLevel: number): Promise<any>;
    /**
     * 计算锁定费用
     */
    calculateLockFee(lockType: string, studentLevel: number, durationMonths: number): Promise<{
        monthly_fee: number;
        total_fee: number;
        discount: number;
    }>;
    /**
     * 获取锁定申请列表
     */
    getApplications(userId: string, userRole: string): Promise<any[]>;
    /**
     * 检查学生是否被锁定
     */
    isStudentLocked(studentId: string, companyId?: string): Promise<any>;
    /**
     * 获取锁定统计
     */
    getLockStats(companyId: string): Promise<any>;
    /**
     * 检查并更新过期锁定
     */
    checkExpiredLocks(): Promise<void>;
}
declare const _default: TalentLockService;
export default _default;
//# sourceMappingURL=talentLockService.d.ts.map