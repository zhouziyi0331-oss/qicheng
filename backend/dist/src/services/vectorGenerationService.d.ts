/**
 * 向量生成服务
 * 使用Claude API生成任务和学生的embedding向量
 * 用于语义匹配引擎
 */
interface Task {
    id: string;
    title: string;
    description: string;
    required_skills?: any;
    track?: string;
    level?: number;
}
interface StudentCapability {
    student_id: string;
    skills: any;
    tasks_completed: number;
    avg_task_quality: number;
    preferred_task_types: string[];
    opc_openness?: number;
    opc_persistence?: number;
    opc_creativity?: number;
}
interface TaskVectors {
    title_embedding: number[];
    description_embedding: number[];
    combined_embedding: number[];
}
interface StudentVectors {
    skill_vector: number[];
    trajectory_vector: number[];
    quality_vector: number[];
    preference_vector: number[];
    combined_vector: number[];
}
declare class VectorGenerationService {
    private anthropic;
    private cache;
    private readonly EMBEDDING_DIM;
    constructor();
    /**
     * 生成文本的embedding向量
     * 使用Claude生成语义向量（模拟embedding）
     */
    private generateEmbedding;
    /**
     * 归一化向量（L2范数）
     */
    private normalizeVector;
    /**
     * 生成随机归一化向量
     */
    private generateRandomNormalizedVector;
    /**
     * 基于文本生成确定性向量（降级方案）
     */
    private generateDeterministicVector;
    /**
     * 简单的字符串hash函数
     */
    private hashString;
    /**
     * 生成任务向量
     */
    generateTaskVectors(task: Task): Promise<TaskVectors>;
    /**
     * 生成学生向量
     */
    generateStudentVectors(studentId: string, capability: StudentCapability): Promise<StudentVectors>;
    /**
     * 更新任务的embedding到数据库
     */
    updateTaskEmbedding(taskId: string): Promise<void>;
    /**
     * 更新学生的embedding到数据库
     */
    updateStudentEmbedding(studentId: string): Promise<void>;
    clearCache(): void;
}
declare const _default: VectorGenerationService;
export default _default;
//# sourceMappingURL=vectorGenerationService.d.ts.map