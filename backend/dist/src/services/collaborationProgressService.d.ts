/**
 * 合作进度服务
 *
 * 功能：
 * 1. 查询合作进度
 * 2. 检查是否可以解锁联系方式
 * 3. 获取解锁状态
 * 4. 生成进度提示文案
 */
interface CollaborationProgress {
    studentId: string;
    companyId: string;
    completedCount: number;
    inProgressCount: number;
    canUnlockContact: boolean;
    contactUnlocked: boolean;
    studentAgreed: boolean | null;
    companyAgreed: boolean | null;
    lastCompletedAt: Date | null;
    avgStudentRating: number | null;
    avgCompanyRating: number | null;
}
declare class CollaborationProgressService {
    /**
     * 获取合作进度
     */
    getProgress(studentId: string, companyId: string): Promise<CollaborationProgress>;
    /**
     * 获取进度提示文案
     */
    getProgressHint(progress: CollaborationProgress, currentUserType: 'student' | 'company'): string;
    /**
     * 检查是否可以解锁联系方式
     */
    canUnlock(studentId: string, companyId: string): Promise<boolean>;
    /**
     * 获取所有合作进度（用于学生查看所有企业）
     */
    getStudentCollaborations(studentId: string): Promise<CollaborationProgress[]>;
    /**
     * 获取所有合作进度（用于企业查看所有学生）
     */
    getCompanyCollaborations(companyId: string): Promise<CollaborationProgress[]>;
    /**
     * 获取进度百分比（用于UI展示）
     */
    getProgressPercentage(completedCount: number): number;
    /**
     * 获取进度状态
     */
    getProgressStatus(progress: CollaborationProgress): 'not_started' | 'in_progress' | 'can_unlock' | 'unlocked';
}
declare const _default: CollaborationProgressService;
export default _default;
//# sourceMappingURL=collaborationProgressService.d.ts.map