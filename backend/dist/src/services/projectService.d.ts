interface Project {
    id: string;
    company_id: string;
    name: string;
    description: string;
    project_code: string;
    total_budget: number;
    budget_allocated: number;
    budget_spent: number;
    estimated_duration_days?: number;
    estimated_end_date?: Date;
    status: string;
    total_milestones: number;
    completed_milestones: number;
    total_tasks: number;
    completed_tasks: number;
    progress_percentage: number;
}
interface Milestone {
    id: string;
    project_id: string;
    milestone_order: number;
    title: string;
    description?: string;
    budget_allocation: number;
    budget_spent: number;
    estimated_duration_days?: number;
    due_date?: Date;
    status: string;
    deliverables: any[];
    acceptance_criteria: any[];
    depends_on_milestone_id?: string;
    total_tasks: number;
    completed_tasks: number;
    progress_percentage: number;
}
/**
 * E-14: 项目制发布服务
 * 支持大型项目的里程碑和任务管理
 */
declare class ProjectService {
    /**
     * 创建项目
     */
    createProject(data: {
        companyId: string;
        name: string;
        description: string;
        totalBudget: number;
        estimatedDurationDays?: number;
        estimatedEndDate?: Date;
        category?: string;
        tags?: string[];
    }): Promise<Project>;
    /**
     * 更新项目
     */
    updateProject(projectId: string, companyId: string, updates: Partial<{
        name: string;
        description: string;
        totalBudget: number;
        estimatedDurationDays: number;
        estimatedEndDate: Date;
        status: string;
        category: string;
        tags: string[];
    }>): Promise<Project>;
    /**
     * 获取项目详情
     */
    getProject(projectId: string, companyId: string): Promise<Project | null>;
    /**
     * 获取企业的项目列表
     */
    getCompanyProjects(companyId: string, options?: {
        status?: string;
        limit?: number;
        offset?: number;
    }): Promise<{
        projects: Project[];
        total: number;
    }>;
    /**
     * 添加里程碑
     */
    addMilestone(data: {
        projectId: string;
        companyId: string;
        milestoneOrder: number;
        title: string;
        description?: string;
        budgetAllocation: number;
        estimatedDurationDays?: number;
        dueDate?: Date;
        deliverables?: any[];
        acceptanceCriteria?: any[];
        dependsOnMilestoneId?: string;
    }): Promise<Milestone>;
    /**
     * 更新里程碑
     */
    updateMilestone(milestoneId: string, companyId: string, updates: Partial<{
        title: string;
        description: string;
        budgetAllocation: number;
        dueDate: Date;
        status: string;
        deliverables: any[];
        acceptanceCriteria: any[];
    }>): Promise<Milestone>;
    /**
     * 获取项目的里程碑列表
     */
    getProjectMilestones(projectId: string, companyId: string): Promise<Milestone[]>;
    /**
     * 关联任务到项目
     */
    linkTaskToProject(projectId: string, milestoneId: string | null, taskId: string, companyId: string, options?: {
        taskOrder?: number;
        isCritical?: boolean;
    }): Promise<any>;
    /**
     * 获取项目的任务列表
     */
    getProjectTasks(projectId: string, companyId: string): Promise<any[]>;
    /**
     * 添加协作者到项目
     */
    addCollaborator(projectId: string, studentId: string, companyId: string, options?: {
        role?: string;
        responsibilities?: string[];
    }): Promise<any>;
    /**
     * 获取项目协作者
     */
    getProjectCollaborators(projectId: string, companyId: string): Promise<any[]>;
    /**
     * 发布项目
     */
    publishProject(projectId: string, companyId: string): Promise<Project>;
    /**
     * 计算项目进度
     */
    calculateProjectProgress(projectId: string): Promise<number>;
}
declare const _default: ProjectService;
export default _default;
//# sourceMappingURL=projectService.d.ts.map