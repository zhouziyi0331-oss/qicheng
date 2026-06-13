/**
 * E-29, E-30, E-31, E-32, E-33, E-34: 验收系统服务
 */
declare class AcceptanceService {
    /**
     * E-29: 创建验收清单
     */
    createChecklist(taskId: string, items: any[]): Promise<any>;
    /**
     * 更新清单项状态
     */
    updateChecklistItem(checklistId: string, itemId: number, status: string, checkedBy: string): Promise<any>;
    /**
     * 获取验收清单
     */
    getChecklist(taskId: string): Promise<any>;
    /**
     * E-30: 获取修改意见模板列表
     */
    getRevisionTemplates(category?: string): Promise<any[]>;
    /**
     * 使用模板生成修改意见
     */
    applyRevisionTemplate(templateId: string, placeholderValues: any): Promise<string>;
    /**
     * E-31: 创建维度化验收评分
     */
    createDimensionalScore(data: {
        task_id: string;
        company_id: string;
        student_id: string;
        quality_score: number;
        completeness_score: number;
        timeliness_score: number;
        communication_score: number;
        professionalism_score: number;
        quality_comment?: string;
        completeness_comment?: string;
        timeliness_comment?: string;
        communication_comment?: string;
        professionalism_comment?: string;
        overall_comment?: string;
    }): Promise<any>;
    /**
     * 获取维度评分
     */
    getDimensionalScore(taskId: string): Promise<any>;
    /**
     * 获取学生的评分统计
     */
    getStudentScoreStats(studentId: string): Promise<any>;
    /**
     * E-32: 记录合作意愿
     */
    recordCooperationWillingness(data: {
        task_id: string;
        company_id: string;
        student_id: string;
        role: 'company' | 'student';
        willing: boolean;
        reason?: string;
        tags?: string[];
    }): Promise<any>;
    /**
     * 获取合作意愿记录
     */
    getCooperationWillingness(taskId: string): Promise<any>;
    /**
     * 获取双向愿意合作的记录
     */
    getMutualCooperationPairs(userId: string, role: string): Promise<any[]>;
    /**
     * E-33: 创建知识产权声明
     */
    createIPDeclaration(data: {
        task_id: string;
        declaration_type: string;
        declaration_text: string;
        rights_scope: any;
        restrictions?: string[];
    }): Promise<any>;
    /**
     * 确认知识产权声明
     */
    confirmIPDeclaration(declarationId: string, role: 'company' | 'student'): Promise<any>;
    /**
     * 获取知识产权声明
     */
    getIPDeclaration(taskId: string): Promise<any>;
    /**
     * E-34: 创建退款/补偿申请
     */
    createRefundRequest(data: {
        task_id: string;
        applicant_id: string;
        applicant_role: string;
        record_type: string;
        reason: string;
        reason_detail: string;
        requested_amount: number;
        evidence_files?: any[];
    }): Promise<any>;
    /**
     * 审核退款申请
     */
    reviewRefundRequest(requestId: string, reviewedBy: string, approved: boolean, approvedAmount?: number, reviewComment?: string): Promise<any>;
    /**
     * 处理退款
     */
    processRefund(requestId: string, transactionId: string): Promise<any>;
    /**
     * 获取退款申请列表
     */
    getRefundRequests(filters: {
        applicant_id?: string;
        status?: string;
        task_id?: string;
    }): Promise<any[]>;
}
declare const _default: AcceptanceService;
export default _default;
//# sourceMappingURL=acceptanceService.d.ts.map