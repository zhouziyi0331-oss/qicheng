interface TalentDiscovery {
    discoverer_id: string;
    student_id: string;
    discovery_reason: string;
    recommended_skills?: string[];
    potential_rating?: number;
}
/**
 * E-11: 伯乐标签系统服务
 * 企业发现并推荐优秀学生，获得伯乐标签和奖励
 */
declare class BoleService {
    /**
     * 创建伯乐推荐
     */
    createDiscovery(data: TalentDiscovery): Promise<any>;
    /**
     * 获取企业的推荐列表
     */
    getCompanyDiscoveries(companyId: string): Promise<any[]>;
    /**
     * 获取学生被推荐记录
     */
    getStudentDiscoveries(studentId: string): Promise<any[]>;
    /**
     * 获取推荐详情
     */
    getDiscoveryById(discoveryId: string): Promise<any>;
    /**
     * 获取伯乐标签
     */
    getBoleBadges(companyId: string): Promise<any[]>;
    /**
     * 检查并授予伯乐标签
     */
    checkAndAwardBadge(companyId: string): Promise<any | null>;
    /**
     * 获取标签权益
     */
    private getBadgeBenefits;
    /**
     * 获取伯乐排行榜
     */
    getLeaderboard(month?: string): Promise<any[]>;
    /**
     * 获取企业伯乐统计
     */
    getCompanyBoleStats(companyId: string): Promise<any>;
    /**
     * 获取奖励配置
     */
    getRewardConfig(): Promise<any>;
    /**
     * 手动验证推荐（管理员）
     */
    validateDiscovery(discoveryId: string, adminId: string): Promise<any>;
    /**
     * 创建学生成长快照
     */
    createGrowthSnapshot(): Promise<void>;
    /**
     * 更新伯乐排行榜
     */
    updateLeaderboard(): Promise<void>;
    /**
     * 获取学生成长轨迹
     */
    getStudentGrowthTrack(studentId: string, months?: number): Promise<any[]>;
    /**
     * 推荐候选学生（AI推荐）
     */
    getRecommendedStudents(companyId: string, limit?: number): Promise<any[]>;
}
declare const _default: BoleService;
export default _default;
//# sourceMappingURL=boleService.d.ts.map