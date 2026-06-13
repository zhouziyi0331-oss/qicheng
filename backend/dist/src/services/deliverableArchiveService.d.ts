interface DeliverableArchive {
    id?: string;
    task_id: string;
    company_id: string;
    student_id: string;
    title: string;
    description?: string;
    category?: string;
    files: any[];
    tags?: string[];
    custom_category?: string;
    company_notes?: string;
}
interface ArchiveFilter {
    companyId: string;
    category?: string;
    customCategory?: string;
    tags?: string[];
    studentId?: string;
    startDate?: Date;
    endDate?: Date;
    isFavorite?: boolean;
    searchKeyword?: string;
    limit?: number;
    offset?: number;
}
interface ShareLinkOptions {
    password?: string;
    expiresAt?: Date;
    maxDownloads?: number;
}
/**
 * E-18: 交付物档案管理服务
 * 管理企业的历史交付物，支持分类、搜索、下载、分享
 */
declare class DeliverableArchiveService {
    /**
     * 手动创建档案
     */
    createArchive(data: DeliverableArchive): Promise<any>;
    /**
     * 获取档案列表
     */
    getArchives(filter: ArchiveFilter): Promise<{
        archives: any[];
        total: number;
    }>;
    /**
     * 获取档案详情
     */
    getArchiveById(archiveId: string, companyId: string): Promise<any>;
    /**
     * 更新档案
     */
    updateArchive(archiveId: string, companyId: string, updates: any): Promise<any>;
    /**
     * 删除档案
     */
    deleteArchive(archiveId: string, companyId: string): Promise<void>;
    /**
     * 记录下载
     */
    recordDownload(archiveId: string, userId: string, downloadedFiles: string[], method?: string): Promise<void>;
    /**
     * 添加版本
     */
    addVersion(archiveId: string, files: any[], changeNotes: string, uploadedBy: string): Promise<any>;
    /**
     * 创建自定义分类
     */
    createCategory(companyId: string, name: string, description?: string, color?: string, icon?: string): Promise<any>;
    /**
     * 获取企业的分类列表
     */
    getCategories(companyId: string): Promise<any[]>;
    /**
     * 更新分类
     */
    updateCategory(categoryId: string, companyId: string, updates: any): Promise<any>;
    /**
     * 删除分类
     */
    deleteCategory(categoryId: string, companyId: string): Promise<void>;
    /**
     * 创建分享链接
     */
    createShareLink(archiveId: string, companyId: string, options?: ShareLinkOptions): Promise<any>;
    /**
     * 验证分享链接
     */
    validateShareLink(shareCode: string, password?: string): Promise<any>;
    /**
     * 记录分享下载
     */
    recordShareDownload(shareCode: string): Promise<void>;
    /**
     * 获取档案统计
     */
    getArchiveStats(companyId: string): Promise<any>;
    /**
     * 批量操作档案
     */
    batchUpdateArchives(archiveIds: string[], companyId: string, updates: any): Promise<void>;
}
declare const _default: DeliverableArchiveService;
export default _default;
//# sourceMappingURL=deliverableArchiveService.d.ts.map