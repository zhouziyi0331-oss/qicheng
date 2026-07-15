/**
 * Phase 2.4: 案例库管理服务
 * 管理真实学生案例，供AI导师引用和学生浏览
 */
export interface StudentCase {
    id: string;
    caseType: 'stuck' | 'breakthrough' | 'success';
    category: string;
    title: string;
    situation: string;
    solution?: string;
    outcome?: string;
    emotion?: string;
    timeToResolve?: number;
    difficulty: number;
    helpfulness: number;
    tags: string[];
    createdAt: Date;
    updatedAt: Date;
}
export interface CaseFilter {
    caseType?: 'stuck' | 'breakthrough' | 'success';
    category?: string;
    difficulty?: number;
    tags?: string[];
    search?: string;
    limit?: number;
    offset?: number;
}
export interface CaseStats {
    totalCases: number;
    byType: {
        stuck: number;
        breakthrough: number;
        success: number;
    };
    popularCategories: Array<{
        category: string;
        count: number;
    }>;
    popularTags: Array<{
        tag: string;
        count: number;
    }>;
}
declare class CaseLibraryService {
    /**
     * 从mentor_growth_observations自动提取案例
     * 这个方法扫描observation表，将有价值的记录转换为案例
     */
    extractCasesFromObservations(): Promise<number>;
    /**
     * 搜索案例
     */
    searchCases(filter: CaseFilter): Promise<{
        cases: StudentCase[];
        total: number;
    }>;
    /**
     * 获取单个案例详情
     */
    getCaseById(caseId: string): Promise<StudentCase | null>;
    /**
     * 标记案例为有帮助
     */
    markCaseHelpful(caseId: string, studentId: string): Promise<boolean>;
    /**
     * 获取案例统计
     */
    getCaseStats(): Promise<CaseStats>;
    /**
     * 为AI导师查找相关案例
     */
    findRelevantCases(params: {
        category?: string;
        tags?: string[];
        caseType?: 'stuck' | 'breakthrough' | 'success';
        limit?: number;
    }): Promise<StudentCase[]>;
    private generateTitle;
    private extractSituation;
    private calculateDifficulty;
    private extractTags;
}
declare const _default: CaseLibraryService;
export default _default;
//# sourceMappingURL=caseLibraryService.d.ts.map